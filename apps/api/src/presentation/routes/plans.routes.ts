import { FastifyInstance } from 'fastify';
import prisma from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { onlySuperAdmin } from '../middlewares/rbac.middleware.js';

export async function plansRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', onlySuperAdmin);

  // GET: Listar todos los planes
  fastify.get('/', async (request, reply) => {
    try {
      const plans = await prisma.plan.findMany({
        orderBy: { precio: 'asc' }
      });
      
      return reply.send({ success: true, data: plans });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: { message: 'Error al obtener los planes' } });
    }
  });

  // POST: Crear un nuevo plan
  fastify.post<{ Body: { nombre: string; descripcion?: string; precio: number; duracionMeses: number; limitUsuarios: number } }>('/', async (request, reply) => {
    try {
      const { nombre, descripcion, precio, duracionMeses, limitUsuarios } = request.body;
      
      const newPlan = await prisma.plan.create({
        data: {
          nombre,
          descripcion,
          precio,
          duracionMeses,
          limitUsuarios
        }
      });
      
      return reply.status(201).send({ success: true, data: newPlan });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: { message: 'Error al crear el plan' } });
    }
  });

  // PUT: Actualizar un plan existente (Habilitar/Deshabilitar, editar datos)
  fastify.put<{ Params: { id: string }, Body: { activo?: boolean; nombre?: string; descripcion?: string; precio?: number; duracionMeses?: number; limitUsuarios?: number } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { activo, nombre, descripcion, precio, duracionMeses, limitUsuarios } = request.body;
      
      const updatedPlan = await prisma.plan.update({
        where: { id },
        data: { activo, nombre, descripcion, precio, duracionMeses, limitUsuarios }
      });
      
      return reply.send({ success: true, data: updatedPlan });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: { message: 'Error al actualizar el plan' } });
    }
  });
}
