// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: ResetPasswordByAdmin
//  El Administrador (Representante Legal) resetea la contraseña
//  de un asesor de su tenant. No requiere la contraseña actual.
//  Solo puede resetear contraseñas de asesores de su propio tenant.
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import prisma from '../../../infrastructure/database/prisma.client.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';

export interface ResetPasswordByAdminInput {
  empleadoId: string;
  clienteId: string;    // Tenant del admin — para verificar aislamiento
  passwordNuevo: string;
}

export class ResetPasswordByAdminUseCase {
  async execute(input: ResetPasswordByAdminInput): Promise<void> {
    // ── Verificar que el empleado existe en el mismo tenant ──────
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: input.empleadoId,
        clienteId: input.clienteId,
      },
      select: { id: true, usuarioId: true, nombres: true, apellidos: true },
    });

    if (!empleado) {
      throw new NotFoundError('Asesor');
    }

    if (!empleado.usuarioId) {
      throw new ForbiddenError('Este asesor no tiene credenciales de acceso vinculadas');
    }

    // ── Hashear la nueva contraseña (bcrypt cost 12) ─────────────
    const nuevaContrasenaHash = await bcrypt.hash(input.passwordNuevo, 12);

    // ── Actualizar la contraseña del usuario vinculado ───────────
    await prisma.usuario.update({
      where: { id: empleado.usuarioId },
      data: { contrasena: nuevaContrasenaHash },
    });
  }
}
