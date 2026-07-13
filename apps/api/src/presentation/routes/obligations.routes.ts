import { FastifyInstance } from 'fastify';
import { createObligationSchema, updateObligationSchema, createRecoverySchema, createNotificationSchema } from '@lexcobra/shared-schemas';
import { ListObligationsByPortfolioUseCase } from '../../core/use-cases/obligations/ListObligationsByPortfolioUseCase.js';
import { CreateObligationUseCase } from '../../core/use-cases/obligations/CreateObligationUseCase.js';
import { UpdateObligationUseCase } from '../../core/use-cases/obligations/UpdateObligationUseCase.js';
import { UpdateObligationStateUseCase } from '../../core/use-cases/obligations/UpdateObligationStateUseCase.js';
import { AddBitacoraUseCase } from '../../core/use-cases/obligations/AddBitacoraUseCase.js';
import { AddRecaudoUseCase } from '../../core/use-cases/obligations/AddRecaudoUseCase.js';
import { GetRecaudosUseCase } from '../../core/use-cases/obligations/GetRecaudosUseCase.js';
import { AddNotificacionUseCase } from '../../core/use-cases/obligations/AddNotificacionUseCase.js';
import { GetNotificacionesUseCase } from '../../core/use-cases/obligations/GetNotificacionesUseCase.js';
import { PrismaObligationRepository } from '../../infrastructure/repositories/PrismaObligationRepository.js';
import { prisma } from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';

const obligationRepo = new PrismaObligationRepository(prisma);
const listObligationsUseCase = new ListObligationsByPortfolioUseCase(obligationRepo);
const createObligationUseCase = new CreateObligationUseCase(obligationRepo);
const updateObligationUseCase = new UpdateObligationUseCase(obligationRepo);
const updateStateUseCase = new UpdateObligationStateUseCase(obligationRepo);
const addBitacoraUseCase = new AddBitacoraUseCase(obligationRepo);
const addRecaudoUseCase = new AddRecaudoUseCase(obligationRepo);
const getRecaudosUseCase = new GetRecaudosUseCase(obligationRepo);
const addNotificacionUseCase = new AddNotificacionUseCase(obligationRepo);
const getNotificacionesUseCase = new GetNotificacionesUseCase(obligationRepo);

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

  /**
   * PATCH /api/obligations/:id
   * Update entire obligation with auditoria
   */
  fastify.patch('/:id', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };

      // Validar datos de entrada
      const parseResult = updateObligationSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'));
      }

      const updatedObligation = await updateObligationUseCase.execute(user.clienteId, id, parseResult.data, user.userId);

      return reply.send(successResponse(updatedObligation));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error actualizando obligación'));
    }
  });

  /**
   * PATCH /api/obligations/:id/state
   */
  fastify.patch('/:id/state', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };
      const body = request.body as any;

      const updated = await updateStateUseCase.execute(user.clienteId, id, user.userId, {
        estadoNuevoId: body.estadoNuevoId,
        nivelRecuperacionNuevoId: body.nivelRecuperacionNuevoId,
        observacion: body.observacion
      });

      return reply.send(successResponse(updated));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error actualizando estado'));
    }
  });

  /**
   * POST /api/obligations/:id/bitacora
   */
  fastify.post('/:id/bitacora', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };
      const body = request.body as { observacion: string };

      await addBitacoraUseCase.execute(user.clienteId, id, user.userId, body.observacion);

      return reply.status(201).send(successResponse({ success: true }));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error añadiendo bitácora'));
    }
  });

  /**
   * GET /api/obligations/:id/history
   */
  fastify.get('/:id/history', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };
      
      const bitacoras = await prisma.bitacoraObservacion.findMany({
        where: { obligacionId: id, obligacion: { clienteId: user.clienteId } },
        include: { usuario: { select: { correo: true, empleado: { select: { nombres: true, apellidos: true } } } } },
        orderBy: { createdAt: 'desc' }
      });

      const estados = await prisma.historialEstadoObligacion.findMany({
        where: { obligacionId: id, obligacion: { clienteId: user.clienteId } },
        include: {
          usuario: { select: { correo: true, empleado: { select: { nombres: true, apellidos: true } } } },
          estadoAnterior: true,
          estadoNuevo: true,
          nivelRecuperacionAnterior: true,
          nivelRecuperacionNuevo: true
        },
        orderBy: { fechaCambio: 'desc' }
      });

      const auditorias = await prisma.auditoriaObligacion.findMany({
        where: { obligacionId: id, obligacion: { clienteId: user.clienteId } },
        include: { usuario: { select: { correo: true, empleado: { select: { nombres: true, apellidos: true } } } } },
        orderBy: { fechaCambio: 'desc' }
      });

      const recaudos = await prisma.recaudo.findMany({
        where: { obligacionId: id, obligacion: { clienteId: user.clienteId } },
        include: { usuario: { select: { correo: true, empleado: { select: { nombres: true, apellidos: true } } } } },
        orderBy: { fechaAbonada: 'desc' }
      });

      const notificaciones = await (prisma as any).notificacion.findMany({
        where: { obligacionId: id, obligacion: { clienteId: user.clienteId } },
        include: { destinatarioPersona: { select: { nombreCompleto: true, numeroIdentificacion: true } } },
        orderBy: { fechaNotificacion: 'desc' }
      });

      return reply.send(successResponse({ bitacoras, estados, auditorias, recaudos, notificaciones }));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error obteniendo historial'));
    }
  });

  /**
   * POST /api/obligations/:id/recaudos
   */
  fastify.post('/:id/recaudos', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };
      
      const parseResult = createRecoverySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'));
      }

      await addRecaudoUseCase.execute(user.clienteId, id, user.userId, parseResult.data);

      return reply.status(201).send(successResponse({ success: true }));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error registrando recaudo'));
    }
  });

  /**
   * GET /api/obligations/:id/recaudos
   */
  fastify.get('/:id/recaudos', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };
      
      const recaudos = await getRecaudosUseCase.execute(user.clienteId, id);

      return reply.send(successResponse(recaudos));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error obteniendo recaudos'));
    }
  });

  /**
   * POST /api/obligations/:id/notificaciones
   */
  fastify.post('/:id/notificaciones', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };

      const parseResult = createNotificationSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(422).send(errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'));
      }

      await addNotificacionUseCase.execute(user.clienteId, id, parseResult.data);

      return reply.status(201).send(successResponse({ success: true }));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error registrando notificación'));
    }
  });

  /**
   * GET /api/obligations/:id/notificaciones
   */
  fastify.get('/:id/notificaciones', async (request, reply) => {
    try {
      const user = request.currentUser;
      if (!user || !user.clienteId) throw new Error('Usuario inválido');

      const { id } = request.params as { id: string };

      const notificaciones = await getNotificacionesUseCase.execute(user.clienteId, id);

      return reply.send(successResponse(notificaciones));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error obteniendo notificaciones'));
    }
  });
}
