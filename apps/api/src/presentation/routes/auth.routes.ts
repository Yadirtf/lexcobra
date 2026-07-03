// ═══════════════════════════════════════════════════════════════
//  LexCobra — Auth Routes (Schema Oficial)
//  POST /api/auth/login
//  POST /api/auth/logout
//  GET  /api/auth/me
//  POST /api/auth/refresh
// ═══════════════════════════════════════════════════════════════

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LoginUseCase } from '../../core/use-cases/auth/login.use-case.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';
import { AppError } from '../../shared/errors/AppError.js';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginUseCase = new LoginUseCase();

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Responde con: { accessToken, user }
   * El refresh token se envía como httpOnly cookie
   */
  fastify.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(422).send(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message ?? 'Datos inválidos'),
      );
    }

    try {
      const { email, password } = parseResult.data;
      const subdomain = extractSubdomainFromRequest(request.hostname);

      const result = await loginUseCase.execute(
        { email, password, tenantSubdomain: subdomain },
        (payload, options) => fastify.jwt.sign(payload as object, options as object),
      );

      // Refresh token (httpOnly cookie, 30 días)
      const refreshToken = fastify.jwt.sign(
        { userId: result.user.id, type: 'refresh' },
        { expiresIn: '30d' },
      );

      reply.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días en segundos
        path: '/api/auth',
      });

      return reply.send(successResponse(result));
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send(
          errorResponse(err.code, err.message),
        );
      }
      fastify.log.error(err);
      return reply.status(500).send(
        errorResponse('INTERNAL_ERROR', 'Error interno del servidor'),
      );
    }
  });

  /**
   * POST /api/auth/logout
   * Limpia la cookie del refresh token
   */
  fastify.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    reply.clearCookie('refresh_token', { path: '/api/auth' });
    return reply.send(successResponse({ message: 'Sesión cerrada correctamente' }));
  });

  /**
   * GET /api/auth/me
   * Retorna el usuario autenticado actual
   */
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    return reply.send(successResponse(request.currentUser));
  });

  /**
   * POST /api/auth/refresh
   * Usa el refresh token de la cookie para emitir un nuevo access token
   */
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies['refresh_token'];
    if (!refreshToken) {
      return reply.status(401).send(errorResponse('UNAUTHORIZED', 'No hay sesión activa'));
    }

    try {
      const decoded = fastify.jwt.verify(refreshToken) as { userId: string; type: string };
      if (decoded.type !== 'refresh') {
        throw new Error('Token type inválido');
      }

      // Generar nuevo access token
      const newAccessToken = fastify.jwt.sign({ userId: decoded.userId });

      return reply.send(successResponse({ accessToken: newAccessToken }));
    } catch {
      reply.clearCookie('refresh_token', { path: '/api/auth' });
      return reply.status(401).send(errorResponse('UNAUTHORIZED', 'Sesión expirada'));
    }
  });
}

function extractSubdomainFromRequest(hostname: string): string {
  if (!hostname || !hostname.includes('.')) return '';
  const parts = hostname.split('.');
  if (parts.length <= 2) return '';
  return parts[0] ?? '';
}
