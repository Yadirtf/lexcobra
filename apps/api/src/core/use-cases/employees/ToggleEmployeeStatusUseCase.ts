// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: ToggleEmployeeStatus
//  Activa o desactiva un asesor de forma atómica.
//  Al desactivar:
//   - Se desactiva el empleado (activo = false)
//   - Se desactiva el usuario vinculado (activo = false)
//   → El asesor no podrá iniciar sesión.
//   → Las trazas históricas (auditorías, bitácoras) se preservan.
//  Restricción: El Administrador no puede desactivarse a sí mismo.
// ═══════════════════════════════════════════════════════════════

import prisma from '../../../infrastructure/database/prisma.client.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';

export interface ToggleEmployeeStatusInput {
  empleadoId: string;
  clienteId: string;    // Para verificar aislamiento multi-tenant
  requestUserId: string; // Para evitar que el admin se auto-desactive
  activar: boolean;     // true = activar, false = desactivar
}

export class ToggleEmployeeStatusUseCase {
  async execute(input: ToggleEmployeeStatusInput) {
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

    // ── Protección: El admin no puede desactivarse a sí mismo ───
    if (empleado.usuarioId === input.requestUserId && !input.activar) {
      throw new ForbiddenError('No puedes desactivar tu propia cuenta de administrador');
    }

    // ── Transacción: actualizar empleado y usuario vinculado ────
    await prisma.$transaction(async (tx) => {
      await tx.empleado.update({
        where: { id: input.empleadoId },
        data: { activo: input.activar },
      });

      if (empleado.usuarioId) {
        await tx.usuario.update({
          where: { id: empleado.usuarioId },
          data: { activo: input.activar },
        });
      }
    });

    return {
      empleadoId: empleado.id,
      activo: input.activar,
      mensaje: input.activar
        ? `Asesor "${empleado.nombres} ${empleado.apellidos}" activado correctamente`
        : `Asesor "${empleado.nombres} ${empleado.apellidos}" desactivado correctamente. Su acceso al sistema ha sido revocado.`,
    };
  }
}
