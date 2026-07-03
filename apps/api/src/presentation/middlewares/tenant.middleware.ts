// ═══════════════════════════════════════════════════════════════
//  LexCobra — Tenant (Cliente) Resolver Middleware
//  Extrae el cliente desde el subdominio del Host header
//  Ej: putumayo.lexcobra.app → cliente "putumayo"
// ═══════════════════════════════════════════════════════════════

import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../infrastructure/database/prisma.client.js';

const BASE_DOMAIN = process.env['BASE_DOMAIN'] ?? 'lexcobra.app';
const ADMIN_SUBDOMAIN = 'admin';

// Cache en memoria simple (en producción se usa Redis)
const clienteCache = new Map<string, { id: string; estadoNombre: string | null } | null>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const cacheTimestamps = new Map<string, number>();

/**
 * Resuelve el cliente (tenant) desde el subdominio y lo adjunta a request.clienteId.
 * El Super Admin puede acceder sin subdominio (admin.lexcobra.app).
 */
export async function resolveTenant(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const host = request.hostname ?? '';
  const subdomain = extractSubdomain(host);

  // El subdominio "admin" está reservado para el Super Admin
  if (subdomain === ADMIN_SUBDOMAIN || !subdomain) {
    return; // Sin clienteId en el request — el RBAC lo maneja
  }

  // Verificar cache
  const now = Date.now();
  const cachedAt = cacheTimestamps.get(subdomain);
  if (cachedAt && now - cachedAt < CACHE_TTL_MS) {
    const cached = clienteCache.get(subdomain);
    if (cached === null) {
      return sendClienteNotFound(reply);
    }
    if (cached) {
      if (cached.estadoNombre === 'Inactivo') {
        return sendClienteInactive(reply);
      }
      request.clienteId = cached.id;
      return;
    }
  }

  // Consultar DB
  const cliente = await prisma.cliente.findUnique({
    where: { subdominio: subdomain },
    select: {
      id: true,
      estado: {
        select: { estado: true },
      },
    },
  });

  // Guardar en cache
  clienteCache.set(subdomain, cliente ? { id: cliente.id, estadoNombre: cliente.estado?.estado ?? null } : null);
  cacheTimestamps.set(subdomain, now);

  if (!cliente) {
    return sendClienteNotFound(reply);
  }

  if (cliente.estado?.estado === 'Inactivo') {
    return sendClienteInactive(reply);
  }

  request.clienteId = cliente.id;
}

function extractSubdomain(host: string): string {
  if (!host.includes('.')) return '';
  const withoutPort = host.split(':')[0] ?? host;
  const parts = withoutPort.split('.');
  if (parts.length <= 2) return '';
  const baseParts = BASE_DOMAIN.split('.').length;
  return parts.slice(0, parts.length - baseParts).join('.');
}

function sendClienteNotFound(reply: FastifyReply) {
  reply.status(404).send({
    success: false,
    error: {
      code: 'TENANT_NOT_FOUND',
      message: 'No se encontró un cliente para este subdominio',
    },
  });
}

function sendClienteInactive(reply: FastifyReply) {
  reply.status(403).send({
    success: false,
    error: {
      code: 'TENANT_INACTIVE',
      message: 'Este cliente está inactivo. Contacte al administrador.',
    },
  });
}
