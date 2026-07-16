// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: CreateEmployee
//  Crea un asesor con credenciales de acceso en transacción atómica.
//  Responsabilidades:
//   1. Verificar límite de usuarios del plan activo.
//   2. Hashear contraseña con bcrypt (cost 12).
//   3. Crear usuario + asignar rol "Usuario" + crear empleado vinculado.
//  Solo el Administrador (Representante Legal) puede ejecutar este caso de uso.
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import prisma from '../../../infrastructure/database/prisma.client.js';
import { ConflictError, SubscriptionLimitError, AppError } from '../../../shared/errors/AppError.js';

export interface CreateEmployeeInput {
  clienteId: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  cargoId?: string;
  correo: string;
  password: string;
}

export interface CreateEmployeeOutput {
  id: string;
  clienteId: string;
  usuarioId: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  cargoId: string | null;
  activo: boolean;
  createdAt: Date;
  cargo: { id: string; nombreCargo: string } | null;
  usuario: { id: string; correo: string; activo: boolean };
}

export class CreateEmployeeUseCase {
  async execute(input: CreateEmployeeInput): Promise<CreateEmployeeOutput> {
    // ── 1. Verificar límite de usuarios del plan activo ──────────
    const suscripcion = await prisma.suscripcion.findFirst({
      where: { clienteId: input.clienteId },
      orderBy: { fechaFin: 'desc' },
      include: {
        plan: { select: { limitUsuarios: true } },
      },
    });

    if (suscripcion?.plan?.limitUsuarios != null) {
      const totalUsuarios = await prisma.usuario.count({
        where: { clienteId: input.clienteId, activo: true },
      });

      if (totalUsuarios >= suscripcion.plan.limitUsuarios) {
        throw new SubscriptionLimitError('usuarios en su plan');
      }
    }

    // ── 2. Verificar correo duplicado dentro del mismo tenant ────
    const correoNormalizado = input.correo.toLowerCase().trim();
    const existeCorreo = await prisma.usuario.findFirst({
      where: {
        clienteId: input.clienteId,
        correo: correoNormalizado,
      },
    });

    if (existeCorreo) {
      throw new ConflictError(`El correo "${correoNormalizado}" ya está registrado en esta empresa`);
    }

    // ── 3. Verificar identificación duplicada dentro del mismo tenant ──
    const existeIdentificacion = await prisma.empleado.findFirst({
      where: {
        clienteId: input.clienteId,
        identificacion: input.identificacion.trim(),
      },
    });

    if (existeIdentificacion) {
      throw new ConflictError(`La identificación "${input.identificacion}" ya está registrada`);
    }

    // ── 4. Obtener rol "Usuario" para asesores ───────────────────
    const rolUsuario = await prisma.rol.findFirst({
      where: { nombreRol: 'Usuario' },
    });

    if (!rolUsuario) {
      throw new AppError('Rol "Usuario" no encontrado en el sistema', 500, 'ROLE_NOT_FOUND');
    }

    // ── 5. Hashear contraseña (bcrypt cost 12) ───────────────────
    const contrasenaHash = await bcrypt.hash(input.password, 12);

    // ── 6. Transacción atómica: usuario + rol + empleado ────────
    const empleado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          clienteId: input.clienteId,
          correo: correoNormalizado,
          contrasena: contrasenaHash,
          activo: true,
        },
      });

      await tx.usuarioRol.create({
        data: {
          usuarioId: usuario.id,
          rolId: rolUsuario.id,
        },
      });

      const nuevoEmpleado = await tx.empleado.create({
        data: {
          clienteId: input.clienteId,
          usuarioId: usuario.id,
          identificacion: input.identificacion.trim(),
          nombres: input.nombres.trim(),
          apellidos: input.apellidos.trim(),
          telefono: input.telefono?.trim() || null,
          cargoId: input.cargoId || null,
          activo: true,
        },
        include: {
          cargo: { select: { id: true, nombreCargo: true } },
          usuario: { select: { id: true, correo: true, activo: true } },
        },
      });

      return nuevoEmpleado;
    });

    return {
      id: empleado.id,
      clienteId: empleado.clienteId,
      usuarioId: empleado.usuarioId!,
      identificacion: empleado.identificacion,
      nombres: empleado.nombres,
      apellidos: empleado.apellidos,
      telefono: empleado.telefono,
      cargoId: empleado.cargoId,
      activo: empleado.activo,
      createdAt: empleado.createdAt,
      cargo: empleado.cargo,
      usuario: empleado.usuario!,
    };
  }
}
