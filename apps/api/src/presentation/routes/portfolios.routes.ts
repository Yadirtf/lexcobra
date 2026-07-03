import { FastifyInstance } from 'fastify';
import { createPortfolioSchema } from '@lexcobra/shared-schemas';
import { ListPortfoliosUseCase } from '../../core/use-cases/portfolios/ListPortfoliosUseCase.js';
import { CreatePortfolioUseCase } from '../../core/use-cases/portfolios/CreatePortfolioUseCase.js';
import { PrismaPortfolioRepository } from '../../infrastructure/repositories/PrismaPortfolioRepository.js';
import { prisma } from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';

const portfolioRepo = new PrismaPortfolioRepository(prisma);
const listPortfoliosUseCase = new ListPortfoliosUseCase(portfolioRepo);
const createPortfolioUseCase = new CreatePortfolioUseCase(portfolioRepo);

export async function portfoliosRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticación a todas las rutas de este plugin
  fastify.addHook('onRequest', authenticate);

  /**
   * GET /api/portfolios
   * Devuelve las carteras del cliente del usuario autenticado
   */
  fastify.get('/', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const clienteId = user.clienteId;
      if (!clienteId) {
        return reply.status(403).send(errorResponse('FORBIDDEN', 'No perteneces a ningún cliente'));
      }

      const portfolios = await listPortfoliosUseCase.execute(clienteId);
      return reply.send(successResponse(portfolios));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error obteniendo carteras'));
    }
  });

  /**
   * POST /api/portfolios
   * Crea una nueva cartera (Solo Administrador o Dueño del sistema)
   */
  fastify.post('/', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const isDueno = user.roles.includes('Dueño del sistema');
      const isAdmin = user.roles.includes('Administrador');
      if (!isDueno && !isAdmin) {
        return reply.status(403).send(errorResponse('FORBIDDEN', 'No tienes permiso para crear carteras'));
      }

      const parseResult = createPortfolioSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'));
      }

      const newPortfolio = await createPortfolioUseCase.execute({
        clienteId: user.clienteId,
        nombreEntidad: parseResult.data.nombreEntidad,
        nit: parseResult.data.nit,
        representante: parseResult.data.representante,
        telefono: parseResult.data.telefono,
        correo: parseResult.data.correo,
        observaciones: parseResult.data.observaciones,
      });

      return reply.status(201).send(successResponse(newPortfolio));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error creando la cartera'));
    }
  });
}
