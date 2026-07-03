// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: Login (Schema Oficial)
//  Valida credenciales usando: usuarios + empleados + usuario_roles + clientes
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import prisma from '../../../infrastructure/database/prisma.client.js';
import { UnauthorizedError, TenantSuspendedError } from '../../../shared/errors/AppError.js';

interface LoginInput {
  email: string;
  password: string;
  tenantSubdomain?: string;
}

interface LoginOutput {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    clienteId: string | null;
    clienteNombre: string | null;
  };
}

/**
 * Ejecuta el flujo de login:
 * 1. Busca el usuario por correo
 * 2. Verifica la contraseña con bcrypt
 * 3. Obtiene nombres del empleado vinculado
 * 4. Verifica que el cliente esté activo y con suscripción vigente
 * 5. Genera el JWT de acceso
 */
export class LoginUseCase {
  async execute(
    input: LoginInput,
    jwtSign: (payload: object, options?: object) => string,
  ): Promise<LoginOutput> {
    const usuario = await prisma.usuario.findFirst({
      where: { correo: input.email.toLowerCase().trim() },
      select: {
        id: true,
        correo: true,
        contrasena: true,
        activo: true,
        clienteId: true,
        cliente: {
          select: {
            id: true,
            nombreComercial: true,
            subdominio: true,
            estado: {
              select: { estado: true },
            },
            suscripciones: {
              select: {
                estado: { select: { estado: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        usuarioRoles: {
          select: {
            rol: {
              select: { id: true, nombreRol: true },
            },
          },
        },
        empleado: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(input.password, usuario.contrasena);
    if (!passwordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Obtener roles del usuario
    const roles = usuario.usuarioRoles.map((ur) => ur.rol.nombreRol);

    // Obtener nombres del empleado vinculado
    const firstName = usuario.empleado?.nombres ?? 'Admin';
    const lastName = usuario.empleado?.apellidos ?? 'Sistema';

    // Verificar cliente si el usuario pertenece a uno
    if (usuario.cliente) {
      if (usuario.cliente.estado?.estado === 'Inactivo') {
        throw new TenantSuspendedError();
      }

      // Verificar suscripción activa
      const ultimaSuscripcion = usuario.cliente.suscripciones[0];
      if (ultimaSuscripcion?.estado?.estado === 'Suspendida') {
        throw new TenantSuspendedError();
      }

      // Si hay subdominio en el request, verificar que coincide
      if (input.tenantSubdomain && !['admin', ''].includes(input.tenantSubdomain)) {
        if (usuario.cliente.subdominio !== input.tenantSubdomain) {
          throw new UnauthorizedError('Usuario no pertenece a este cliente');
        }
      }
    }

    // Generar Access Token (15 minutos)
    const tokenPayload = {
      userId: usuario.id,
      clienteId: usuario.clienteId,
      roles: roles,
      email: usuario.correo,
    };

    const accessToken = jwtSign(tokenPayload, { expiresIn: '15m' });

    return {
      accessToken,
      user: {
        id: usuario.id,
        email: usuario.correo,
        firstName,
        lastName,
        roles,
        clienteId: usuario.clienteId,
        clienteNombre: usuario.cliente?.nombreComercial ?? null,
      },
    };
  }
}
