// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: UpdateEmployeeEmail
//  Acción exclusiva del Administrador (Representante Legal).
//  Permite actualizar el correo de un asesor cuando:
//   - El asesor pierde acceso a su correo.
//   - Cambia de empresa de correo corporativo.
//   - Cualquier motivo que impida el ingreso con el correo actual.
// ═══════════════════════════════════════════════════════════════

import prisma from '../../../infrastructure/database/prisma.client.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError.js';

export interface UpdateEmployeeEmailInput {
  empleadoId: string;
  clienteId: string; // Para verificar aislamiento multi-tenant
  correo: string;
}

export class UpdateEmployeeEmailUseCase {
  async execute(input: UpdateEmployeeEmailInput) {
    const correoNormalizado = input.correo.toLowerCase().trim();

    // ── Verificar que el empleado existe y pertenece al tenant ───
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: input.empleadoId,
        clienteId: input.clienteId,
      },
      include: {
        usuario: { select: { id: true, correo: true } },
      },
    });

    if (!empleado) {
      throw new NotFoundError('Asesor');
    }

    if (!empleado.usuarioId || !empleado.usuario) {
      throw new NotFoundError('El asesor no tiene credenciales de acceso vinculadas');
    }

    // ── Verificar que el nuevo correo no esté en uso en el mismo tenant ─
    const correoEnUso = await prisma.usuario.findFirst({
      where: {
        clienteId: input.clienteId,
        correo: correoNormalizado,
        id: { not: empleado.usuarioId },
      },
    });

    if (correoEnUso) {
      throw new ConflictError(`El correo "${correoNormalizado}" ya está en uso por otro usuario de esta empresa`);
    }

    // ── Actualizar el correo del usuario vinculado ───────────────
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: empleado.usuarioId },
      data: { correo: correoNormalizado },
      select: { id: true, correo: true, activo: true },
    });

    return {
      empleadoId: empleado.id,
      correoAnterior: empleado.usuario.correo,
      correoNuevo: usuarioActualizado.correo,
    };
  }
}
