// ═══════════════════════════════════════════════════════════════
//  LexCobra — Middleware de autenticación (Schema Oficial)
//  Verifica JWT y adjunta el usuario al contexto de la request
// ═══════════════════════════════════════════════════════════════

import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, TenantSuspendedError } from '../../shared/errors/AppError.js';
import prisma from '../../infrastructure/database/prisma.client.js';

export interface AuthenticatedUser {
  userId: string;
  clienteId: string | null;
  roles: string[];
  email: string;
  firstName: string;
  lastName: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: AuthenticatedUser;
    clienteId?: string;
  }
}

/**
 * Verifica que el request tiene un JWT válido.
 * Adjunta el usuario decodificado a request.currentUser
 * Obtiene nombres del empleado vinculado.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();

    const payload = request.user as { userId: string; clienteId: string | null; roles: string[]; email: string };

    // Verificar que el usuario existe y está activo en DB
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        activo: true,
        clienteId: true,
        correo: true,
        usuarioRoles: {
          select: {
            rol: { select: { nombreRol: true } },
          },
        },
        empleado: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        cliente: {
          select: {
            estado: { select: { estado: true } },
            suscripciones: {
              select: {
                estado: { select: { estado: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError('Usuario inactivo o no encontrado');
    }

    // Si tiene cliente, verificar que esté activo y con suscripción vigente
    if (usuario.clienteId && usuario.cliente) {
      if (usuario.cliente.estado?.estado === 'Inactivo') {
        throw new TenantSuspendedError();
      }
      const ultimaSuscripcion = usuario.cliente.suscripciones[0];
      if (ultimaSuscripcion?.estado?.estado === 'Suspendida') {
        throw new TenantSuspendedError();
      }
    }

    const roles = usuario.usuarioRoles.map((ur) => ur.rol.nombreRol);

    request.currentUser = {
      userId: usuario.id,
      clienteId: usuario.clienteId,
      roles,
      email: usuario.correo,
      firstName: usuario.empleado?.nombres ?? 'Admin',
      lastName: usuario.empleado?.apellidos ?? 'Sistema',
    };
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof TenantSuspendedError) {
      reply.status(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' },
    });
  }
}
