// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: ListEmployees
//  Lista los asesores del tenant con búsqueda y filtros.
//  Solo el Administrador puede acceder a la lista completa.
// ═══════════════════════════════════════════════════════════════

import prisma from '../../../infrastructure/database/prisma.client.js';

export interface ListEmployeesInput {
  clienteId: string;
  search?: string;        // Busca en nombres, apellidos e identificacion
  soloActivos?: boolean;  // true = solo activos, false = todos
}

export interface EmployeeListItem {
  id: string;
  clienteId: string;
  usuarioId: string | null;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  activo: boolean;
  createdAt: Date;
  cargo: { id: string; nombreCargo: string } | null;
  usuario: { id: string; correo: string; activo: boolean } | null;
}

export class ListEmployeesUseCase {
  async execute(input: ListEmployeesInput): Promise<EmployeeListItem[]> {
    const { clienteId, search, soloActivos } = input;

    const empleados = await prisma.empleado.findMany({
      where: {
        clienteId,
        // Filtro por estado activo/inactivo
        ...(soloActivos !== undefined && { activo: soloActivos }),
        // Búsqueda por texto en nombre, apellido o identificación
        ...(search && search.trim().length > 0 && {
          OR: [
            { nombres: { contains: search.trim(), mode: 'insensitive' } },
            { apellidos: { contains: search.trim(), mode: 'insensitive' } },
            { identificacion: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        cargo: { select: { id: true, nombreCargo: true } },
        usuario: { select: { id: true, correo: true, activo: true } },
      },
      orderBy: [
        { activo: 'desc' },   // Activos primero
        { nombres: 'asc' },   // Luego por nombre
      ],
    });

    return empleados.map((e) => ({
      id: e.id,
      clienteId: e.clienteId,
      usuarioId: e.usuarioId,
      identificacion: e.identificacion,
      nombres: e.nombres,
      apellidos: e.apellidos,
      telefono: e.telefono,
      activo: e.activo,
      createdAt: e.createdAt,
      cargo: e.cargo,
      usuario: e.usuario,
    }));
  }
}
