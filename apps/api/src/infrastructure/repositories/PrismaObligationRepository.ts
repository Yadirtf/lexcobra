import { PrismaClient } from '@prisma/client';
import { IObligationRepository } from '../../core/repositories/IObligationRepository.js';
import { Obligation } from '../../core/entities/Obligation.js';
import { CreateObligationInput, UpdateObligationInput } from '@lexcobra/shared-schemas';

export class PrismaObligationRepository implements IObligationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(clienteId: string, id: string): Promise<Obligation | null> {
    const obligacion = await this.prisma.obligacion.findFirst({
      where: { id, clienteId },
      include: {
        actores: {
          include: { persona: true, rolActor: true },
        },
        estadoObligacion: true,
        juzgado: true,
        municipio: true,
        medidaCautelar: true,
        nivelRecuperacion: true,
      },
    });
    if (!obligacion) return null;
    return Obligation.create(obligacion);
  }

  async findByCartera(clienteId: string, carteraId: string): Promise<Obligation[]> {
    const obligaciones = await this.prisma.obligacion.findMany({
      where: { carteraId, clienteId, isActive: true },
      include: {
        actores: {
          include: { persona: true, rolActor: true },
        },
        estadoObligacion: true,
        juzgado: true,
        municipio: true,
        medidaCautelar: true,
        nivelRecuperacion: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return obligaciones.map((o) => Obligation.create(o));
  }

  async create(clienteId: string, data: CreateObligationInput): Promise<Obligation> {
    return this.prisma.$transaction(async (tx) => {
      // 0. Get Roles
      const rolDeudor = await tx.rolActor.findFirst({ where: { nombreRol: 'Deudor Principal' } });
      const rolCodeudor = await tx.rolActor.findFirst({ where: { nombreRol: 'Codeudor' } });

      // 1. Process Debtors (Actores)
      const actorLinks: any[] = [];

      for (const debtor of data.debtors) {
        // Find or create persona
        const persona = await this.findOrCreatePersona(tx, clienteId, debtor);

        actorLinks.push({
          personaId: persona.id,
          rolActorId: rolDeudor?.id, // Deudor Principal
        });
      }

      // Process CoDebtors
      for (const coDebtor of data.coDebtors) {
        const persona = await this.findOrCreatePersona(tx, clienteId, coDebtor);

        actorLinks.push({
          personaId: persona.id,
          rolActorId: rolCodeudor?.id, // Codeudor
        });
      }

      // 2. Create Obligación
      const obligacion = await tx.obligacion.create({
        data: {
          clienteId,
          carteraId: data.portfolioId,
          numeroCredito: data.creditNumber,
          numeroPagare: data.promissoryNoteNumber,
          saldoCapitalDemandado: data.capitalBalance,
          municipioId: data.municipalityId,
          fechaReparto: data.intakeDate ? new Date(data.intakeDate) : null,
          fechaPresentacionDemanda: data.lawsuitDate ? new Date(data.lawsuitDate) : null,
          juzgadoId: data.courtId,
          radicado: data.docketNumber,
          medidaCautelarId: data.precautionaryMeasureId,
          mandamientoPagoFecha: data.paymentOrderDate ? new Date(data.paymentOrderDate) : null,
          autoSeguirEjecucionFecha: data.proceedExecutionDate ? new Date(data.proceedExecutionDate) : null,
          liquidacionCreditoAprobadaFecha: data.creditLiquidationDate ? new Date(data.creditLiquidationDate) : null,
          estadoObligacionId: data.statusId,
          nivelRecuperacionId: data.recoveryLevelId,
          actores: {
            create: actorLinks,
          },
        },
        include: {
          actores: { include: { persona: true, rolActor: true } },
          estadoObligacion: true,
          juzgado: true,
          municipio: true,
          medidaCautelar: true,
          nivelRecuperacion: true,
        },
      });

      return Obligation.create(obligacion);
    });
  }

  async update(clienteId: string, id: string, data: UpdateObligationInput): Promise<Obligation> {
    const obligacion = await this.prisma.obligacion.update({
      where: { id },
      data: {
        ...(data.creditNumber && { numeroCredito: data.creditNumber }),
        ...(data.capitalBalance !== undefined && { saldoCapitalDemandado: data.capitalBalance }),
        ...(data.statusId !== undefined && { estadoObligacionId: data.statusId }),
        ...(data.recoveryLevelId !== undefined && { nivelRecuperacionId: data.recoveryLevelId }),
        ...(data.docketNumber !== undefined && { radicado: data.docketNumber }),
        ...(data.courtId !== undefined && { juzgadoId: data.courtId }),
        ...(data.precautionaryMeasureId !== undefined && { medidaCautelarId: data.precautionaryMeasureId }),
      },
      include: {
        actores: { include: { persona: true, rolActor: true } },
        estadoObligacion: true,
        juzgado: true,
        municipio: true,
        medidaCautelar: true,
        nivelRecuperacion: true,
      },
    });

    return Obligation.create(obligacion);
  }

  async delete(clienteId: string, id: string): Promise<void> {
    await this.prisma.obligacion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Busca una persona por cliente + documento, o la crea si no existe.
   * Evita el uso de upsert con composite keys nullable.
   */
  private async findOrCreatePersona(
    tx: any,
    clienteId: string,
    personData: { 
      documentId: string; 
      fullName: string; 
      tipoIdentificacionId?: string;
      contacts?: Array<{ tipoContactoId: string; valor: string; esPrincipal?: boolean }>;
    },
  ) {
    const existing = await tx.persona.findFirst({
      where: {
        clienteId,
        numeroIdentificacion: personData.documentId,
        ...(personData.tipoIdentificacionId && { tipoIdentificacionId: personData.tipoIdentificacionId }),
      },
    });

    let persona;

    if (existing) {
      persona = await tx.persona.update({
        where: { id: existing.id },
        data: { nombreCompleto: personData.fullName },
      });
    } else {
      persona = await tx.persona.create({
        data: {
          clienteId,
          tipoIdentificacionId: personData.tipoIdentificacionId,
          numeroIdentificacion: personData.documentId,
          nombreCompleto: personData.fullName,
        },
      });
    }

    // Procesar contactos si fueron enviados
    if (personData.contacts && personData.contacts.length > 0) {
      for (const contact of personData.contacts) {
        // Buscar si ya existe el mismo contacto (mismo tipo y valor) para no duplicar
        const existingContact = await tx.personaContacto.findFirst({
          where: {
            personaId: persona.id,
            tipoContactoId: contact.tipoContactoId,
            valor: contact.valor,
          },
        });

        if (!existingContact) {
          await tx.personaContacto.create({
            data: {
              personaId: persona.id,
              tipoContactoId: contact.tipoContactoId,
              valor: contact.valor,
              esPrincipal: contact.esPrincipal ?? false,
            },
          });
        }
      }
    }

    return persona;
  }
}
