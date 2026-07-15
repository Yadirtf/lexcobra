// ═══════════════════════════════════════════════════════════════
//  LexCobra — Servidor Fastify principal
// ═══════════════════════════════════════════════════════════════

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './presentation/routes/auth.routes.js';
import { portfoliosRoutes } from './presentation/routes/portfolios.routes.js';
import { obligationsRoutes } from './presentation/routes/obligations.routes.js';
import { catalogsRoutes } from './presentation/routes/catalogs.routes.js';
import { plansRoutes } from './presentation/routes/plans.routes.js';
import { clientsRoutes } from './presentation/routes/clients.routes.js';
import { adminRoutes } from './presentation/routes/admin.routes.js';
import { personasRoutes } from './presentation/routes/personas.routes.js';
import { reportsRoutes } from './presentation/routes/reports.routes.js';
import { resolveTenant } from './presentation/middlewares/tenant.middleware.js';
import { errorResponse } from './shared/utils/index.js';
import prisma from './infrastructure/database/prisma.client.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const BASE_DOMAIN = process.env['BASE_DOMAIN'] ?? 'lexcobra.app';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      transport:
        process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins globales ──────────────────────────────────────────

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Permite: *.lexcobra.app y localhost en desarrollo
      const allowedPatterns = [
        new RegExp(`\\.${BASE_DOMAIN.replace('.', '\\.')}$`),
        /^https?:\/\/localhost/,
      ];
      if (!origin || allowedPatterns.some((p) => p.test(origin))) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  await fastify.register(cookie, {
    secret: process.env['COOKIE_SECRET'] ?? 'lexcobra-cookie-secret-change-in-production',
  });

  await fastify.register(jwt, {
    secret: process.env['JWT_SECRET'] ?? 'lexcobra-jwt-secret-change-in-production',
    sign: { expiresIn: '15m' },
  });

  // Rate limiting global
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas peticiones. Intente en un momento.',
      },
    }),
  });

  // ── Middleware global: Tenant Resolver ────────────────────────
  fastify.addHook('preHandler', resolveTenant);

  // ── Rutas ─────────────────────────────────────────────────────
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(portfoliosRoutes, { prefix: '/api/portfolios' });
  fastify.register(obligationsRoutes, { prefix: '/api/obligations' });
  fastify.register(catalogsRoutes, { prefix: '/api/catalogs' });
  fastify.register(plansRoutes, { prefix: '/api/plans' });
  fastify.register(clientsRoutes, { prefix: '/api/clients' });
  fastify.register(adminRoutes, { prefix: '/api/admin' });
  fastify.register(personasRoutes, { prefix: '/api/personas' });
  fastify.register(reportsRoutes, { prefix: '/api/reports' });

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));

  // ── Error handler global ──────────────────────────────────────
  fastify.setErrorHandler((error: any, _request, reply) => {
    fastify.log.error(error);

    if (error.statusCode === 429) {
      return reply.status(429).send(
        errorResponse('RATE_LIMIT_EXCEEDED', 'Demasiadas peticiones'),
      );
    }

    return reply.status(500).send(
      errorResponse('INTERNAL_ERROR', 'Error interno del servidor'),
    );
  });

  // ── Graceful shutdown ─────────────────────────────────────────
  const shutdown = async () => {
    fastify.log.info('Cerrando servidor...');
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return fastify;
}

async function start() {
  const fastify = await buildServer();
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`🚀 LexCobra API corriendo en http://${HOST}:${PORT}`);
}

start().catch((err) => {
  console.error('Error iniciando el servidor:', err);
  process.exit(1);
});
