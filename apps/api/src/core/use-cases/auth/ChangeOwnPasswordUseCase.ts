// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: ChangeOwnPassword
//  Permite al usuario autenticado cambiar su propia contraseña.
//  Requiere verificación de la contraseña actual por seguridad.
//  Disponible para cualquier rol (Administrador, Asesor).
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import prisma from '../../../infrastructure/database/prisma.client.js';
import { NotFoundError, UnauthorizedError } from '../../../shared/errors/AppError.js';

export interface ChangeOwnPasswordInput {
  usuarioId: string;
  passwordActual: string;
  passwordNuevo: string;
}

export class ChangeOwnPasswordUseCase {
  async execute(input: ChangeOwnPasswordInput): Promise<void> {
    // ── Obtener el usuario con su hash actual ────────────────────
    const usuario = await prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: { id: true, contrasena: true, activo: true },
    });

    if (!usuario || !usuario.activo) {
      throw new NotFoundError('Usuario');
    }

    // ── Verificar la contraseña actual ───────────────────────────
    const passwordValida = await bcrypt.compare(input.passwordActual, usuario.contrasena);
    if (!passwordValida) {
      throw new UnauthorizedError('La contraseña actual no es correcta');
    }

    // ── Verificar que la nueva contraseña sea diferente ──────────
    const esLaMisma = await bcrypt.compare(input.passwordNuevo, usuario.contrasena);
    if (esLaMisma) {
      throw new UnauthorizedError('La nueva contraseña no puede ser igual a la actual');
    }

    // ── Hashear y guardar la nueva contraseña (bcrypt cost 12) ───
    const nuevaContrasenaHash = await bcrypt.hash(input.passwordNuevo, 12);

    await prisma.usuario.update({
      where: { id: input.usuarioId },
      data: { contrasena: nuevaContrasenaHash },
    });
  }
}
