import { FastifyInstance } from 'fastify';
import { createObligationSchema } from '@lexcobra/shared-schemas';
import { ListObligationsByPortfolioUseCase } from '../../core/use-cases/obligations/ListObligationsByPortfolioUseCase.js';
import { CreateObligationUseCase } from '../../core/use-cases/obligations/CreateObligationUseCase.js';
import { PrismaObligationRepository } from '../../infrastructure/repositories/PrismaObligationRepository.js';
import { prisma } from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';

const obligationRepo = new PrismaObligationRepository(prisma);
const listObligationsUseCase = new ListObligationsByPortfolioUseCase(obligationRepo);
const createObligationUseCase = new CreateObligationUseCase(obligationRepo);

export async function obligationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  /**
   * GET /api/obligations?carteraId=xxx
   */
  fastify.get('/', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { carteraId } = request.query as { carteraId?: string };
      if (!carteraId) {
        return reply.status(400).send(errorResponse('BAD_REQUEST', 'El parámetro carteraId es requerido'));
      }

      const obligations = await listObligationsUseCase.execute(user.clienteId, carteraId);
      return reply.send(successResponse(obligations));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error obteniendo obligaciones'));
    }
  });

  /**
   * POST /api/obligations
   */
  fastify.post('/', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      // Validar datos de entrada
      const parseResult = createObligationSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'));
      }

      // Ejecutar creación transaccional
      const newObligation = await createObligationUseCase.execute(user.clienteId, parseResult.data);

      return reply.status(201).send(successResponse(newObligation));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error creando obligación'));
    }
  });
}
