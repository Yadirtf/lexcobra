import { PrismaClient } from '@prisma/client';

export interface UpdateContactosDTO {
  contactos: Array<{
    tipoContactoId: string;
    valor: string;
    esPrincipal?: boolean;
  }>;
}

export class UpdatePersonaContactosUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(clienteId: string, personaId: string, data: UpdateContactosDTO): Promise<void> {
    const persona = await this.prisma.persona.findFirst({
      where: { id: personaId, clienteId }
    });

    if (!persona) {
      throw new Error('Persona no encontrada o no pertenece al tenant');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Eliminar todos los contactos anteriores de esta persona
      await tx.personaContacto.deleteMany({
        where: { personaId }
      });

      // 2. Crear los nuevos contactos
      if (data.contactos && data.contactos.length > 0) {
        await tx.personaContacto.createMany({
          data: data.contactos.map(c => ({
            personaId,
            tipoContactoId: c.tipoContactoId,
            valor: c.valor,
            esPrincipal: c.esPrincipal ?? false
          }))
        });
      }
    });
  }
}
