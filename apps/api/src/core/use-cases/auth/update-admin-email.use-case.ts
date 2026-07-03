// ═══════════════════════════════════════════════════════════════
//  LexCobra — Use Case: UpdateAdminEmail
//  Actualiza el correo del usuario Administrador de un tenant.
//  Solo puede ser ejecutado por el Dueño del sistema (SuperAdmin).
// ═══════════════════════════════════════════════════════════════

import prisma from '../../../infrastructure/database/prisma.client.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError.js';

interface UpdateAdminEmailInput {
  /** ID del Cliente (tenant) cuyo administrador se actualiza */
  clienteId: string;
  /** Nuevo correo electrónico que se asignará al administrador */
  nuevoCorreo: string;
}

interface UpdateAdminEmailOutput {
  /** Correo actualizado confirmado */
  correo: string;
  /** ID del usuario actualizado */
  usuarioId: string;
}

/**
 * Ejecuta el flujo de actualización de correo del administrador:
 * 1. Verifica que el cliente existe
 * 2. Localiza el usuario con rol 'Administrador' del cliente
 * 3. Verifica que el nuevo correo no está en uso por otro usuario del mismo tenant
 * 4. Actualiza el correo en la tabla `usuarios`
 */
export class UpdateAdminEmailUseCase {
  async execute(input: UpdateAdminEmailInput): Promise<UpdateAdminEmailOutput> {
    const nuevoCorreo = input.nuevoCorreo.toLowerCase().trim();

    // 1. Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: input.clienteId },
      select: { id: true, nombreComercial: true },
    });

    if (!cliente) {
      throw new NotFoundError('Casa de Cobranza');
    }

    // 2. Localizar el usuario administrador principal del tenant
    //    Se busca el usuario vinculado al rol 'Administrador' dentro del cliente.
    const usuarioAdmin = await prisma.usuario.findFirst({
      where: {
        clienteId: input.clienteId,
        usuarioRoles: {
          some: {
            rol: { nombreRol: 'Administrador' },
          },
        },
      },
      select: { id: true, correo: true },
    });

    if (!usuarioAdmin) {
      throw new NotFoundError('Usuario Administrador del cliente');
    }

    // 3. Si el nuevo correo es idéntico al actual, no hay nada que hacer
    if (usuarioAdmin.correo === nuevoCorreo) {
      return { correo: usuarioAdmin.correo, usuarioId: usuarioAdmin.id };
    }

    // 4. Verificar que el nuevo correo no esté en uso por OTRO usuario dentro del mismo tenant
    //    La restricción de BD es UNIQUE(clienteId, correo), pero lo validamos antes
    //    para devolver un mensaje claro en lugar de un error de Prisma genérico.
    const correoEnUso = await prisma.usuario.findFirst({
      where: {
        clienteId: input.clienteId,
        correo: nuevoCorreo,
        id: { not: usuarioAdmin.id }, // Excluir el mismo usuario
      },
      select: { id: true },
    });

    if (correoEnUso) {
      throw new ConflictError('El correo electrónico ya está en uso por otro usuario de esta entidad');
    }

    // 5. Actualizar el correo del administrador
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuarioAdmin.id },
      data: { correo: nuevoCorreo },
      select: { id: true, correo: true },
    });

    return {
      correo: usuarioActualizado.correo,
      usuarioId: usuarioActualizado.id,
    };
  }
}
