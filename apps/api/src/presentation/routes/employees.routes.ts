// ═══════════════════════════════════════════════════════════════
//  LexCobra — Employees Routes
//  Gestión de Asesores de Cobranza (Empleados del Tenant)
//
//  GET    /api/employees           — Listar asesores (solo Admin)
//  POST   /api/employees           — Crear asesor con credenciales (solo Admin)
//  PATCH  /api/employees/:id       — Editar perfil del asesor (solo Admin)
//  PATCH  /api/employees/:id/email — Actualizar correo del asesor (solo Admin)
//  PATCH  /api/employees/:id/status — Activar/desactivar asesor (solo Admin)
//  PATCH  /api/employees/:id/reset-password — Resetear contraseña (solo Admin)
//  GET    /api/employees/me        — Perfil propio del asesor autenticado
//  PATCH  /api/employees/me/profile — Asesor actualiza sus propios datos
// ═══════════════════════════════════════════════════════════════

import { FastifyInstance } from 'fastify';
import {
  createEmployeeWithCredentialsSchema,
  updateEmployeeProfileSchema,
  updateEmployeeEmailSchema,
  resetPasswordByAdminSchema,
} from '@lexcobra/shared-schemas';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import prisma from '../../infrastructure/database/prisma.client.js';
import { CreateEmployeeUseCase } from '../../core/use-cases/employees/CreateEmployeeUseCase.js';
import { ListEmployeesUseCase } from '../../core/use-cases/employees/ListEmployeesUseCase.js';
import { UpdateEmployeeUseCase } from '../../core/use-cases/employees/UpdateEmployeeUseCase.js';
import { UpdateEmployeeEmailUseCase } from '../../core/use-cases/employees/UpdateEmployeeEmailUseCase.js';
import { ToggleEmployeeStatusUseCase } from '../../core/use-cases/employees/ToggleEmployeeStatusUseCase.js';
import { ResetPasswordByAdminUseCase } from '../../core/use-cases/employees/ResetPasswordByAdminUseCase.js';

const createEmployeeUseCase = new CreateEmployeeUseCase();
const listEmployeesUseCase = new ListEmployeesUseCase();
const updateEmployeeUseCase = new UpdateEmployeeUseCase();
const updateEmployeeEmailUseCase = new UpdateEmployeeEmailUseCase();
const toggleEmployeeStatusUseCase = new ToggleEmployeeStatusUseCase();
const resetPasswordByAdminUseCase = new ResetPasswordByAdminUseCase();

// Guards de roles
const onlyAdmin = requireRoles(['Administrador', 'Dueño del sistema']);
const onlyAdminStrict = requireRoles(['Administrador']); // Solo el admin del tenant, no el superadmin

export async function employeesRoutes(fastify: FastifyInstance) {
  // Autenticación requerida en todas las rutas de este módulo
  fastify.addHook('preHandler', authenticate);

  // ─────────────────────────────────────────────────────────────
  // GET /api/employees/me
  // Retorna el perfil propio del usuario autenticado (asesor o admin).
  // Disponible para todos los roles autenticados.
  // ─────────────────────────────────────────────────────────────
  fastify.get('/me', async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return reply.status(401).send(errorResponse('UNAUTHORIZED', 'No autenticado'));
    }

    try {
      const empleado = await prisma.empleado.findFirst({
        where: { usuarioId: user.userId },
        include: {
          cargo: { select: { id: true, nombreCargo: true } },
          usuario: { select: { id: true, correo: true, activo: true } },
        },
      });

      // Fallback: usar datos del currentUser si no hay perfil de empleado
      return reply.send(
        successResponse({
          usuarioId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          empleado: empleado ?? null,
        }),
      );
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error obteniendo perfil'));
    }
  });

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/employees/me/profile
  // El usuario actualiza sus propios datos: nombres, apellidos, teléfono.
  // Solo el Representante Legal (Administrador/Dueño del sistema) puede cambiar su correo.
  // ─────────────────────────────────────────────────────────────
  fastify.patch('/me/profile', async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return reply.status(401).send(errorResponse('UNAUTHORIZED', 'No autenticado'));
    }

    const body = request.body as Record<string, any>;
    const parseResult = updateEmployeeProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return reply.status(422).send(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'),
      );
    }

    const isLegalRep = user.roles.includes('Administrador') || user.roles.includes('Dueño del sistema');

    // Si intenta cambiar correo
    if (typeof body.correo === 'string' && body.correo.trim().toLowerCase() !== user.email.toLowerCase()) {
      if (!isLegalRep) {
        return reply.status(403).send(
          errorResponse('FORBIDDEN', 'Solo el Representante Legal puede cambiar el correo electrónico de acceso'),
        );
      }

      const correoNormalizado = body.correo.trim().toLowerCase();
      // Validar formato de correo
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
        return reply.status(422).send(errorResponse('VALIDATION_ERROR', 'Correo electrónico inválido'));
      }

      // Verificar que no esté en uso por otro usuario del mismo cliente
      if (user.clienteId) {
        const existente = await prisma.usuario.findFirst({
          where: {
            clienteId: user.clienteId,
            correo: correoNormalizado,
            id: { not: user.userId },
          },
        });
        if (existente) {
          return reply.status(409).send(errorResponse('CONFLICT', `El correo "${correoNormalizado}" ya está registrado`));
        }
      }

      // Actualizar el correo del usuario
      await prisma.usuario.update({
        where: { id: user.userId },
        data: { correo: correoNormalizado },
      });
    }

    try {
      // Buscar el empleado vinculado al usuario actual
      const empleado = await prisma.empleado.findFirst({
        where: { usuarioId: user.userId, clienteId: user.clienteId ?? undefined },
      });

      if (!empleado) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'No tienes un perfil de empleado vinculado'));
      }

      const resultado = await updateEmployeeUseCase.execute({
        empleadoId: empleado.id,
        clienteId: empleado.clienteId,
        ...parseResult.data,
      });

      return reply.send(successResponse(resultado, { message: 'Perfil actualizado correctamente' }));
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send(errorResponse(err.code, err.message));
      }
      request.log.error(err);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error actualizando perfil'));
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/employees
  // Lista todos los asesores del tenant. Solo el Administrador.
  // Query params: ?search=texto&soloActivos=true
  // ─────────────────────────────────────────────────────────────
  fastify.get<{
    Querystring: { search?: string; soloActivos?: string };
  }>('/', { preHandler: [onlyAdmin] }, async (request, reply) => {
    const user = request.currentUser;
    if (!user?.clienteId) {
      return reply.status(403).send(errorResponse('FORBIDDEN', 'No perteneces a ningún cliente'));
    }

    try {
      const { search, soloActivos } = request.query;
      const empleados = await listEmployeesUseCase.execute({
        clienteId: user.clienteId,
        search,
        soloActivos: soloActivos === undefined ? undefined : soloActivos === 'true',
      });

      return reply.send(successResponse(empleados));
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error listando asesores'));
    }
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/employees
  // Crea un nuevo asesor con credenciales de acceso. Solo Admin.
  // Body: { identificacion, nombres, apellidos, telefono?, cargoId?, correo, password }
  // ─────────────────────────────────────────────────────────────
  fastify.post('/', { preHandler: [onlyAdminStrict] }, async (request, reply) => {
    const user = request.currentUser;
    if (!user?.clienteId) {
      return reply.status(403).send(errorResponse('FORBIDDEN', 'No perteneces a ningún cliente'));
    }

    const parseResult = createEmployeeWithCredentialsSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(422).send(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'),
      );
    }

    try {
      const empleado = await createEmployeeUseCase.execute({
        clienteId: user.clienteId,
        ...parseResult.data,
      });

      return reply.status(201).send(successResponse(empleado, { message: 'Asesor creado correctamente' }));
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send(errorResponse(err.code, err.message));
      }
      request.log.error(err);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error creando el asesor'));
    }
  });

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/employees/:id
  // Edita el perfil del asesor (nombres, teléfono, cargo). Solo Admin.
  // NO incluye correo — usar /email endpoint.
  // ─────────────────────────────────────────────────────────────
  fastify.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [onlyAdminStrict] },
    async (request, reply) => {
      const user = request.currentUser;
      if (!user?.clienteId) {
        return reply.status(403).send(errorResponse('FORBIDDEN', 'No perteneces a ningún cliente'));
      }

      const parseResult = updateEmployeeProfileSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(
          errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'),
        );
      }

      try {
        const resultado = await updateEmployeeUseCase.execute({
          empleadoId: request.params.id,
          clienteId: user.clienteId,
          ...parseResult.data,
        });

        return reply.send(successResponse(resultado, { message: 'Asesor actualizado correctamente' }));
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send(errorResponse(err.code, err.message));
        }
        request.log.error(err);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error actualizando el asesor'));
      }
    },
  );

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/employees/:id/email
  // Actualiza el correo del asesor. Solo Admin (Representante Legal).
  // Caso de uso: asesor perdió acceso a su correo anterior.
  // ─────────────────────────────────────────────────────────────
  fastify.patch<{ Params: { id: string } }>(
    '/:id/email',
    { preHandler: [onlyAdminStrict] },
    async (request, reply) => {
      const user = request.currentUser;
      if (!user?.clienteId) {
        return reply.status(403).send(errorResponse('FORBIDDEN', 'No perteneces a ningún cliente'));
      }

      const parseResult = updateEmployeeEmailSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(
          errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'),
        );
      }

      try {
        const resultado = await updateEmployeeEmailUseCase.execute({
          empleadoId: request.params.id,
          clienteId: user.clienteId,
          correo: parseResult.data.correo,
        });

        return reply.send(successResponse(resultado, { message: 'Correo del asesor actualizado correctamente' }));
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send(errorResponse(err.code, err.message));
        }
        request.log.error(err);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error actualizando el correo'));
      }
    },
  );

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/employees/:id/status
  // Activa o desactiva un asesor (soft-delete). Solo Admin.
  // Body: { activar: boolean }
  // ─────────────────────────────────────────────────────────────
  fastify.patch<{ Params: { id: string }; Body: { activar: boolean } }>(
    '/:id/status',
    { preHandler: [onlyAdminStrict] },
    async (request, reply) => {
      const user = request.currentUser;
      if (!user?.clienteId) {
        return reply.status(403).send(errorResponse('FORBIDDEN', 'No perteneces a ningún cliente'));
      }

      const { activar } = request.body;
      if (typeof activar !== 'boolean') {
        return reply.status(422).send(
          errorResponse('VALIDATION_ERROR', 'El campo "activar" debe ser un booleano'),
        );
      }

      try {
        const resultado = await toggleEmployeeStatusUseCase.execute({
          empleadoId: request.params.id,
          clienteId: user.clienteId,
          requestUserId: user.userId,
          activar,
        });

        return reply.send(successResponse(resultado));
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send(errorResponse(err.code, err.message));
        }
        request.log.error(err);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error cambiando el estado del asesor'));
      }
    },
  );

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/employees/:id/reset-password
  // El Administrador resetea la contraseña de un asesor. Solo Admin.
  // Body: { passwordNuevo, passwordNuevoConfirmacion }
  // ─────────────────────────────────────────────────────────────
  fastify.patch<{ Params: { id: string } }>(
    '/:id/reset-password',
    { preHandler: [onlyAdminStrict] },
    async (request, reply) => {
      const user = request.currentUser;
      if (!user?.clienteId) {
        return reply.status(403).send(errorResponse('FORBIDDEN', 'No perteneces a ningún cliente'));
      }

      const parseResult = resetPasswordByAdminSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(
          errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'),
        );
      }

      try {
        await resetPasswordByAdminUseCase.execute({
          empleadoId: request.params.id,
          clienteId: user.clienteId,
          passwordNuevo: parseResult.data.passwordNuevo,
        });

        return reply.send(successResponse(null, { message: 'Contraseña del asesor restablecida correctamente' }));
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send(errorResponse(err.code, err.message));
        }
        request.log.error(err);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error restableciendo la contraseña'));
      }
    },
  );
}
