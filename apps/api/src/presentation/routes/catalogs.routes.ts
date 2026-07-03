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

    protectedFastify.get('/juzgados', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) throw new Error('Usuario sin clienteId');

        const juzgados = await prisma.juzgado.findMany({
          where: { clienteId: user.clienteId },
          orderBy: { nombre: 'asc' }
        });
        return reply.send(successResponse(juzgados));
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener juzgados'));
      }
    });

    protectedFastify.post('/juzgados', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) throw new Error('Usuario sin clienteId');
        
        const { nombre } = request.body as { nombre: string };
        if (!nombre || nombre.trim() === '') {
          return reply.status(400).send(errorResponse('BAD_REQUEST', 'El nombre del juzgado es requerido'));
        }

        const juzgado = await prisma.juzgado.create({
          data: {
            nombre: nombre.trim().toUpperCase(),
            clienteId: user.clienteId
          }
        });

        return reply.status(201).send(successResponse(juzgado));
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al crear el juzgado'));
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
  });
}
