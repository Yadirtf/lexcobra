// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: UpdateEmployee
//  Actualiza el perfil del asesor (datos personales únicamente).
//  El correo se gestiona por un caso de uso separado (UpdateEmployeeEmailUseCase)
//  para garantizar separación de responsabilidades y seguridad.
// ═══════════════════════════════════════════════════════════════

import prisma from '../../../infrastructure/database/prisma.client.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';

export interface UpdateEmployeeInput {
  empleadoId: string;
  clienteId: string; // Para verificar aislamiento multi-tenant
  nombres?: string;
  apellidos?: string;
  telefono?: string | null;
  cargoId?: string | null;
}

export class UpdateEmployeeUseCase {
  async execute(input: UpdateEmployeeInput) {
    // ── Verificar que el empleado existe y pertenece al mismo tenant ─
    const empleadoExistente = await prisma.empleado.findFirst({
      where: {
        id: input.empleadoId,
        clienteId: input.clienteId,
      },
    });

    if (!empleadoExistente) {
      throw new NotFoundError('Asesor');
    }

    if (!empleadoExistente.activo) {
      throw new ForbiddenError('No se puede editar un asesor inactivo');
    }

    // ── Actualizar datos del perfil ──────────────────────────────
    const empleadoActualizado = await prisma.empleado.update({
      where: { id: input.empleadoId },
      data: {
        ...(input.nombres !== undefined && { nombres: input.nombres.trim() }),
        ...(input.apellidos !== undefined && { apellidos: input.apellidos.trim() }),
        ...(input.telefono !== undefined && { telefono: input.telefono?.trim() || null }),
        ...(input.cargoId !== undefined && { cargoId: input.cargoId }),
      },
      include: {
        cargo: { select: { id: true, nombreCargo: true } },
        usuario: { select: { id: true, correo: true, activo: true } },
      },
    });

    return empleadoActualizado;
  }
}
