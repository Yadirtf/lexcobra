import { FastifyInstance } from 'fastify';
import prisma from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';

export async function catalogsRoutes(fastify: FastifyInstance) {
  // GET /departamentos — Todos los departamentos (sin auth, para formularios públicos)
  fastify.get('/departamentos', async (request, reply) => {
    try {
      const departamentos = await prisma.departamento.findMany({
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      });
      return reply.send(successResponse(departamentos));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener departamentos'));
    }
  });

  // GET /municipalities?departamentoId= — Municipios, opcionalmente filtrados por departamento
  fastify.get<{ Querystring: { departamentoId?: string } }>('/municipalities', async (request, reply) => {
    try {
      const { departamentoId } = request.query;
      const municipalities = await prisma.municipio.findMany({
        where: departamentoId ? { departamentoId } : undefined,
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, departamentoId: true },
      });
      return reply.send(successResponse(municipalities));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener municipios'));
    }
  });

  // Protected catalogs requiring authentication
  fastify.register(async function (protectedFastify) {
    protectedFastify.addHook('onRequest', authenticate);

    // GET /catalogs/juzgados — Lista de juzgados del tenant con información de ubicación
    protectedFastify.get('/juzgados', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) throw new Error('Usuario sin clienteId');

        const juzgados = await prisma.juzgado.findMany({
          where: { clienteId: user.clienteId },
          orderBy: { nombre: 'asc' },
          include: {
            informacion: {
              include: {
                departamento: { select: { id: true, nombre: true } },
                municipio:    { select: { id: true, nombre: true } },
              },
            },
          },
        });
        return reply.send(successResponse(juzgados));
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener juzgados'));
      }
    });

    // POST /catalogs/juzgados — Crear nuevo juzgado con ubicación opcional
    protectedFastify.post('/juzgados', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) throw new Error('Usuario sin clienteId');

        const { nombre, departamentoId, municipioId } = request.body as {
          nombre: string;
          departamentoId?: string;
          municipioId?: string;
        };

        if (!nombre || nombre.trim() === '') {
          return reply.status(400).send(errorResponse('BAD_REQUEST', 'El nombre del juzgado es requerido'));
        }

        const juzgado = await prisma.juzgado.create({
          data: {
            nombre: nombre.trim().toUpperCase(),
            clienteId: user.clienteId,
            ...(departamentoId || municipioId
              ? {
                  informacion: {
                    create: {
                      departamentoId: departamentoId || null,
                      municipioId:    municipioId    || null,
                    },
                  },
                }
              : {}),
          },
          include: {
            informacion: {
              include: {
                departamento: { select: { id: true, nombre: true } },
                municipio:    { select: { id: true, nombre: true } },
              },
            },
          },
        });

        return reply.status(201).send(successResponse(juzgado));
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al crear el juzgado'));
      }
    });

    // PUT /catalogs/juzgados/:id — Editar nombre y/o ubicación
    protectedFastify.put<{ Params: { id: string } }>('/juzgados/:id', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) throw new Error('Usuario sin clienteId');

        const { id } = request.params;
        const { nombre, departamentoId, municipioId } = request.body as {
          nombre?: string;
          departamentoId?: string;
          municipioId?: string;
        };

        // Verificar que el juzgado pertenece al tenant (anti cross-tenant)
        const existing = await prisma.juzgado.findUnique({ where: { id } });
        if (!existing || existing.clienteId !== user.clienteId) {
          return reply.status(404).send(errorResponse('NOT_FOUND', 'Juzgado no encontrado'));
        }

        const updated = await prisma.juzgado.update({
          where: { id },
          data: {
            ...(nombre ? { nombre: nombre.trim().toUpperCase() } : {}),
            informacion: {
              upsert: {
                create: {
                  departamentoId: departamentoId ?? null,
                  municipioId:    municipioId    ?? null,
                },
                update: {
                  departamentoId: departamentoId ?? null,
                  municipioId:    municipioId    ?? null,
                },
              },
            },
          },
          include: {
            informacion: {
              include: {
                departamento: { select: { id: true, nombre: true } },
                municipio:    { select: { id: true, nombre: true } },
              },
            },
          },
        });

        return reply.send(successResponse(updated));
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al actualizar el juzgado'));
      }
    });

    // DELETE /catalogs/juzgados/:id — Eliminar juzgado (falla si tiene obligaciones)
    protectedFastify.delete<{ Params: { id: string } }>('/juzgados/:id', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) throw new Error('Usuario sin clienteId');

        const { id } = request.params;

        // Verificar que el juzgado pertenece al tenant
        const existing = await prisma.juzgado.findUnique({ where: { id } });
        if (!existing || existing.clienteId !== user.clienteId) {
          return reply.status(404).send(errorResponse('NOT_FOUND', 'Juzgado no encontrado'));
        }

        await prisma.juzgado.delete({ where: { id } });

        return reply.send(successResponse({ message: 'Juzgado eliminado correctamente' }));
      } catch (error: any) {
        // P2003 = FK constraint violation — hay obligaciones que lo referencian
        if (error?.code === 'P2003') {
          return reply.status(409).send(errorResponse(
            'COURT_IN_USE',
            'No se puede eliminar este juzgado porque tiene obligaciones asociadas. Reasigne las obligaciones primero.'
          ));
        }
        fastify.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al eliminar el juzgado'));
      }
    });

    protectedFastify.get('/medidas-cautelares', async (request, reply) => {
      try {
        const medidas = await prisma.medidaCautelar.findMany({
          orderBy: { nombre: 'asc' }
        });
        return reply.send(successResponse(medidas));
      } catch (error) {
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener medidas'));
      }
    });

    protectedFastify.get('/estados-obligacion', async (request, reply) => {
      try {
        const estados = await prisma.estadoObligacion.findMany({
          orderBy: { nombre: 'asc' }
        });
        return reply.send(successResponse(estados));
      } catch (error) {
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener estados'));
      }
    });

    protectedFastify.get('/niveles-recuperacion', async (request, reply) => {
      try {
        const niveles = await prisma.nivelRecuperacion.findMany({
          orderBy: { nombre: 'asc' }
        });
        return reply.send(successResponse(niveles));
      } catch (error) {
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener niveles'));
      }
    });

    protectedFastify.get('/tipos-contacto', async (request, reply) => {
      try {
        const tipos = await prisma.tipoContacto.findMany({
          orderBy: { nombre: 'asc' }
        });
        return reply.send(successResponse(tipos));
      } catch (error) {
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener tipos de contacto'));
      }
    });

    protectedFastify.get('/tipos-identificacion', async (request, reply) => {
      try {
        const tipos = await prisma.tipoIdentificacion.findMany({
          orderBy: { nombre: 'asc' }
        });
        return reply.send(successResponse(tipos));
      } catch (error) {
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener tipos de id'));
      }
    });

    // GET /catalogs/cargos — Cargos disponibles para asesores
    protectedFastify.get('/cargos', async (_request, reply) => {
      try {
        const cargos = await prisma.cargo.findMany({
          orderBy: { nombreCargo: 'asc' },
          select: { id: true, nombreCargo: true, descripcion: true },
        });
        return reply.send(successResponse(cargos));
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener los cargos'));
      }
    });
  });
}
