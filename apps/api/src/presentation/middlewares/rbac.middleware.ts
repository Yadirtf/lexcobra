// ═══════════════════════════════════════════════════════════════
//  LexCobra — Middleware RBAC (Schema Oficial)
//  Fábrica de guards por rol para las rutas
//  Roles ahora son dinámicos (tabla `roles` + `usuario_roles`)
// ═══════════════════════════════════════════════════════════════

import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../../shared/errors/AppError.js';

type RoleGuard = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

// Nombres de roles tal como están en la tabla `roles`
const ROLE_DUENO = 'Dueño del sistema';
const ROLE_ADMIN = 'Administrador';
const ROLE_USUARIO = 'Usuario';

/**
 * Crea un middleware que restringe acceso a los roles indicados.
 *
 * @example
 * // Solo administrador o dueño del sistema
 * fastify.addHook('preHandler', requireRoles(['Administrador', 'Dueño del sistema']))
 */
export function requireRoles(allowedRoles: string[]): RoleGuard {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser;

    if (!user) {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' },
      });
      return;
    }

    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      const error = new ForbiddenError();
      reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
  };
}

// ── Guards predefinidos para los roles del sistema ────────────────

/** Solo el Dueño del sistema (Super Admin) */
export const onlySuperAdmin = requireRoles([ROLE_DUENO]);

/** Administrador (Rep. Legal del cliente) o superior */
export const onlyAdminOrAbove = requireRoles([ROLE_DUENO, ROLE_ADMIN]);

/** Usuario (empleado del cliente) o superior */
export const onlyUserOrAbove = requireRoles([ROLE_DUENO, ROLE_ADMIN, ROLE_USUARIO]);

/**
 * Verifica que el usuario pertenece al mismo cliente que el recurso.
 * Protege contra accesos cross-tenant.
 */
export async function requireSameCliente(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = request.currentUser;

  // Dueño del sistema puede acceder a cualquier cliente
  if (user?.roles.includes(ROLE_DUENO)) return;

  const clienteIdFromRequest = request.clienteId;
  if (!clienteIdFromRequest || user?.clienteId !== clienteIdFromRequest) {
    reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Acceso denegado a este cliente' },
    });
  }
}
