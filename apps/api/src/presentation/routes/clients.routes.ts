import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../../infrastructure/database/prisma.client.js';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middlewares/auth.middleware.js';
import { onlySuperAdmin } from '../middlewares/rbac.middleware.js';
import { UpdateAdminEmailUseCase } from '../../core/use-cases/auth/update-admin-email.use-case.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';
import { AppError } from '../../shared/errors/AppError.js';

const updateAdminEmailUseCase = new UpdateAdminEmailUseCase();

const updateAdminEmailSchema = z.object({
  nuevoCorreo: z
    .string()
    .email('El nuevo correo no tiene un formato válido')
    .min(1, 'El correo es requerido'),
});

export async function clientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', onlySuperAdmin);

  // GET: Listar todas las casas de cobranza (con sus suscripciones vigentes)
  fastify.get('/', async (request, reply) => {
    try {
      const clients = await prisma.cliente.findMany({
        include: {
          suscripciones: {
            include: { plan: true },
            orderBy: { fechaFin: 'desc' },
            take: 1
          },
          departamento: true,
          municipio: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return reply.send({ success: true, data: clients });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: { message: 'Error al obtener los clientes' } });
    }
  });

  // POST: Crear nuevo Cliente (Transaccional)
  fastify.post<{ Body: {
    nit: string;
    nombreComercial: string;
    subdominio: string;
    telefono?: string;
    direccion?: string;
    departamentoId?: string;
    municipioId?: string;
    adminEmail: string;
    adminPasswordPlana: string;
    planId: string;
    fechaInicioSuscripcion: string;
    fechaFinSuscripcion: string;
  } }>('/', async (request, reply) => {
    const data = request.body;
    
    try {
      const hashedPassword = await bcrypt.hash(data.adminPasswordPlana, 10);
      
      const newClient = await prisma.$transaction(async (tx) => {
        // 1. Crear el Cliente (Casa de Cobranza)
        const cliente = await tx.cliente.create({
          data: {
            nit: data.nit,
            nombreComercial: data.nombreComercial,
            subdominio: data.subdominio.toLowerCase(),
            telefono: data.telefono?.trim() || null,
            direccion: data.direccion?.trim() || null,
            departamentoId: data.departamentoId || null,
            municipioId: data.municipioId || null,
          }
        });

        // 2. Crear la suscripción asociada
        await tx.suscripcion.create({
          data: {
            clienteId: cliente.id,
            planId: data.planId,
            fechaInicio: new Date(data.fechaInicioSuscripcion),
            fechaFin: new Date(data.fechaFinSuscripcion),
          }
        });

        // 3. Obtener el rol de administrador
        const adminRol = await tx.rol.findFirst({
          where: { nombreRol: 'Administrador' }
        });

        if (!adminRol) {
          throw new Error('Rol Administrador no encontrado');
        }

        // 4. Crear el usuario Administrador (Representante Legal)
        const usuario = await tx.usuario.create({
          data: {
            clienteId: cliente.id,
            correo: data.adminEmail,
            contrasena: hashedPassword,
            activo: true,
          }
        });

        // 5. Asignar rol
        await tx.usuarioRol.create({
          data: {
            usuarioId: usuario.id,
            rolId: adminRol.id
          }
        });

        // 6. Crear el perfil de empleado
        await tx.empleado.create({
          data: {
            clienteId: cliente.id,
            usuarioId: usuario.id,
            nombres: 'Representante',
            apellidos: 'Legal',
            identificacion: `REP-${data.nit}`, // Valor por defecto
          }
        });

        return cliente;
      });
      
      return reply.status(201).send({ success: true, data: newClient });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, error: { message: 'El NIT, Subdominio o Email ya están registrados.' } });
      }
      return reply.status(500).send({ success: false, error: { message: 'Error interno al crear el cliente' } });
    }
  });

  // PUT: Editar Cliente y/o renovar suscripción
  fastify.put<{ Params: { id: string }, Body: {
    nit: string;
    nombreComercial: string;
    subdominio: string;
    telefono?: string;
    direccion?: string;
    departamentoId?: string | null;
    municipioId?: string | null;
    planId?: string;
    fechaInicioSuscripcion?: string;
    fechaFinSuscripcion?: string;
  } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;
    
    try {
      const updatedClient = await prisma.$transaction(async (tx) => {
        // 1. Actualizar datos base
        const cliente = await tx.cliente.update({
          where: { id },
          data: {
            nit: data.nit,
            nombreComercial: data.nombreComercial,
            subdominio: data.subdominio.toLowerCase(),
            telefono: data.telefono?.trim() || null,
            direccion: data.direccion?.trim() || null,
            departamentoId: data.departamentoId ?? null,
            municipioId: data.municipioId ?? null,
          }
        });

        // 2. Si vienen datos de suscripción, actualizar la más reciente o crear una nueva si se venció
        if (data.planId && data.fechaInicioSuscripcion && data.fechaFinSuscripcion) {
          const suscripcionActual = await tx.suscripcion.findFirst({
            where: { clienteId: id },
            orderBy: { fechaFin: 'desc' }
          });

          if (suscripcionActual) {
            await tx.suscripcion.update({
              where: { id: suscripcionActual.id },
              data: {
                planId: data.planId,
                fechaInicio: new Date(data.fechaInicioSuscripcion),
                fechaFin: new Date(data.fechaFinSuscripcion)
              }
            });
          } else {
            await tx.suscripcion.create({
              data: {
                clienteId: id,
                planId: data.planId,
                fechaInicio: new Date(data.fechaInicioSuscripcion),
                fechaFin: new Date(data.fechaFinSuscripcion)
              }
            });
          }
        }
        return cliente;
      });
      
      return reply.send({ success: true, data: updatedClient });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, error: { message: 'El NIT o Subdominio ya están en uso por otra empresa.' } });
      }
      return reply.status(500).send({ success: false, error: { message: 'Error al actualizar el cliente' } });
    }
  });

  // PATCH: Suspender / Activar Cliente
  fastify.patch<{ Params: { id: string }, Body: { suspendido: boolean } }>('/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { suspendido } = request.body;
    
    try {
      // Como no tenemos los UUID exactos de estados_cliente, podemos simular la suspensión 
      // buscando el estado 'Inactivo' / 'Activo' o usando el campo 'activo' en los usuarios del tenant.
      
      let estadoStr = suspendido ? 'Inactivo' : 'Activo';
      
      // Buscar si el estado existe en la BD
      let estado = await prisma.estadoCliente.findFirst({
        where: { estado: estadoStr }
      });
      
      // Si no existe, crearlo dinámicamente para evitar errores (esto normalmente iría en seed.ts)
      if (!estado) {
        estado = await prisma.estadoCliente.create({
          data: { estado: estadoStr, descripcion: estadoStr }
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.cliente.update({
          where: { id },
          data: { estadoId: estado.id }
        });

        // También podemos suspender a todos los usuarios del tenant
        await tx.usuario.updateMany({
          where: { clienteId: id },
          data: { activo: !suspendido }
        });
      });

      return reply.send({ success: true, message: `Cliente ${estadoStr.toLowerCase()} correctamente` });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: { message: 'Error al cambiar estado del cliente' } });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /:id/admin-email — Actualizar correo del Administrador del tenant
  // Body: { nuevoCorreo: string }
  // Protección: onlySuperAdmin (heredado del hook global de esta ruta)
  // ─────────────────────────────────────────────────────────────────────────
  fastify.patch<{ Params: { id: string }; Body: { nuevoCorreo: string } }>(
    '/:id/admin-email',
    async (request, reply) => {
      const parseResult = updateAdminEmailSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(422).send(
          errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'),
        );
      }

      try {
        const { id } = request.params;
        const { nuevoCorreo } = parseResult.data;

        const result = await updateAdminEmailUseCase.execute({
          clienteId: id,
          nuevoCorreo,
        });

        return reply.send(
          successResponse(result, {
            message: 'Correo del administrador actualizado correctamente',
          }),
        );
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send(
            errorResponse(err.code, err.message),
          );
        }
        fastify.log.error(err);
        return reply.status(500).send(
          errorResponse('INTERNAL_ERROR', 'Error interno al actualizar el correo'),
        );
      }
    },
  );
}
