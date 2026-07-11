import { FastifyInstance } from 'fastify';
import { prisma } from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';
import { UpdatePersonaContactosUseCase } from '../../core/use-cases/personas/UpdatePersonaContactosUseCase.js';

const updateContactosUseCase = new UpdatePersonaContactosUseCase(prisma);

export async function personasRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  /**
   * PUT /api/personas/:id/contactos
   * Actualiza los contactos de una persona (Deudor, Codeudor, etc.)
   */
  fastify.put('/:id/contactos', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };
      const body = request.body as {
        contactos: Array<{ tipoContactoId: string; valor: string; esPrincipal?: boolean; }>
      };

      if (!body.contactos || !Array.isArray(body.contactos)) {
        return reply.status(400).send(errorResponse('BAD_REQUEST', 'El formato de contactos es incorrecto'));
      }

      await updateContactosUseCase.execute(user.clienteId, id, { contactos: body.contactos });

      return reply.send(successResponse({ success: true, message: 'Contactos actualizados correctamente' }));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error actualizando contactos'));
    }
  });
}
