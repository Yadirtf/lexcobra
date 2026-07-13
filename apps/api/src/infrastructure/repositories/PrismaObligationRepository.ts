import { PrismaClient } from '@prisma/client';
import { IObligationRepository, RecaudoItem, NotificacionItem } from '../../core/repositories/IObligationRepository.js';
import { Obligation } from '../../core/entities/Obligation.js';
import { CreateObligationInput, UpdateObligationInput } from '@lexcobra/shared-schemas';

export class PrismaObligationRepository implements IObligationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(clienteId: string, id: string): Promise<Obligation | null> {
    const obligacion = await this.prisma.obligacion.findFirst({
      where: { id, clienteId },
      include: {
        actores: {
            include: { persona: { include: { contactos: { include: { tipoContacto: true } } } }, rolActor: true },
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
          include: { persona: { include: { contactos: { include: { tipoContacto: true } } } }, rolActor: true },
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
          actores: { include: { persona: { include: { contactos: { include: { tipoContacto: true } } } }, rolActor: true } },
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

  async update(
    clienteId: string, 
    id: string, 
    data: UpdateObligationInput,
    auditoriaCambios?: Array<{ campoModificado: string, valorAnterior: string | null, valorNuevo: string | null }>,
    usuarioId?: string | null
  ): Promise<Obligation> {
    return this.prisma.$transaction(async (tx) => {
      
      // Update Obligation
      const obligacion = await tx.obligacion.update({
        where: { id },
        data: {
          ...(data.creditNumber && { numeroCredito: data.creditNumber }),
          ...(data.capitalBalance !== undefined && { saldoCapitalDemandado: data.capitalBalance }),
          ...(data.statusId !== undefined && { estadoObligacionId: data.statusId }),
          ...(data.recoveryLevelId !== undefined && { nivelRecuperacionId: data.recoveryLevelId }),
          ...(data.docketNumber !== undefined && { radicado: data.docketNumber }),
          ...(data.courtId !== undefined && { juzgadoId: data.courtId }),
          ...(data.precautionaryMeasureId !== undefined && { medidaCautelarId: data.precautionaryMeasureId }),
          ...(data.intakeDate !== undefined && { fechaReparto: data.intakeDate ? new Date(data.intakeDate) : null }),
          ...(data.lawsuitDate !== undefined && { fechaPresentacionDemanda: data.lawsuitDate ? new Date(data.lawsuitDate) : null }),
          ...(data.paymentOrderDate !== undefined && { mandamientoPagoFecha: data.paymentOrderDate ? new Date(data.paymentOrderDate) : null }),
          ...(data.proceedExecutionDate !== undefined && { autoSeguirEjecucionFecha: data.proceedExecutionDate ? new Date(data.proceedExecutionDate) : null }),
          ...(data.creditLiquidationDate !== undefined && { liquidacionCreditoAprobadaFecha: data.creditLiquidationDate ? new Date(data.creditLiquidationDate) : null }),
          ...(data.municipalityId !== undefined && { municipioId: data.municipalityId }),
        },
        include: {
          actores: { include: { persona: { include: { contactos: { include: { tipoContacto: true } } } }, rolActor: true } },
          estadoObligacion: true,
          juzgado: true,
          municipio: true,
          medidaCautelar: true,
          nivelRecuperacion: true,
        },
      });

      // Update debtors if provided (partial update)
      if (data.debtors || data.coDebtors) {
        // This is complex for a simple update, we usually only update contacts, but since we are replacing actors:
        // We will just process contacts updates in the use case or let findOrCreatePersona handle it.
        const rolDeudor = await tx.rolActor.findFirst({ where: { nombreRol: 'Deudor Principal' } });
        const rolCodeudor = await tx.rolActor.findFirst({ where: { nombreRol: 'Codeudor' } });

        // Update debtors
        if (data.debtors) {
          for (const debtor of data.debtors) {
             await this.findOrCreatePersona(tx, clienteId, debtor);
          }
        }
        if (data.coDebtors) {
          for (const codebtor of data.coDebtors) {
             await this.findOrCreatePersona(tx, clienteId, codebtor);
          }
        }
      }

      // Record Auditoria
      if (auditoriaCambios && auditoriaCambios.length > 0) {
        await tx.auditoriaObligacion.createMany({
          data: auditoriaCambios.map(cambio => ({
            obligacionId: id,
            campoModificado: cambio.campoModificado,
            valorAnterior: cambio.valorAnterior,
            valorNuevo: cambio.valorNuevo,
            usuarioId: usuarioId || null
          }))
        });
      }

      return Obligation.create(obligacion);
    });
  }

  async updateStateWithHistory(
    clienteId: string,
    id: string,
    estadoNuevoId?: string | null,
    nivelRecuperacionNuevoId?: string | null,
    usuarioId?: string | null,
    observacion?: string | null
  ): Promise<Obligation> {
    return this.prisma.$transaction(async (tx) => {
      const obligacionActual = await tx.obligacion.findFirst({
        where: { id, clienteId }
      });
      if (!obligacionActual) throw new Error("Obligación no encontrada");

      const data: any = {};
      if (estadoNuevoId !== undefined) data.estadoObligacionId = estadoNuevoId;
      if (nivelRecuperacionNuevoId !== undefined) data.nivelRecuperacionId = nivelRecuperacionNuevoId;

      const obligacion = await tx.obligacion.update({
        where: { id },
        data,
        include: {
          actores: { include: { persona: { include: { contactos: { include: { tipoContacto: true } } } }, rolActor: true } },
          estadoObligacion: true,
          juzgado: true,
          municipio: true,
          medidaCautelar: true,
          nivelRecuperacion: true,
        },
      });

      await tx.historialEstadoObligacion.create({
        data: {
          obligacionId: id,
          estadoAnteriorId: obligacionActual.estadoObligacionId,
          estadoNuevoId: estadoNuevoId !== undefined ? estadoNuevoId : obligacionActual.estadoObligacionId,
          nivelRecuperacionAnteriorId: obligacionActual.nivelRecuperacionId,
          nivelRecuperacionNuevoId: nivelRecuperacionNuevoId !== undefined ? nivelRecuperacionNuevoId : obligacionActual.nivelRecuperacionId,
          usuarioId: usuarioId || null,
          observacion: observacion || null
        }
      });

      return Obligation.create(obligacion);
    });
  }

  async addBitacora(
    clienteId: string,
    id: string,
    observacion: string,
    usuarioId?: string | null
  ): Promise<void> {
    const obligacion = await this.prisma.obligacion.findFirst({
      where: { id, clienteId }
    });
    if (!obligacion) throw new Error("Obligación no encontrada");

    await this.prisma.bitacoraObservacion.create({
      data: {
        obligacionId: id,
        observacion,
        usuarioId: usuarioId || null
      }
    });
  }

  async addRecaudo(
    clienteId: string,
    obligacionId: string,
    monto: number,
    fechaAbonada: Date,
    usuarioId?: string | null,
    observacion?: string | null
  ): Promise<void> {
    const obligacion = await this.prisma.obligacion.findFirst({
      where: { id: obligacionId, clienteId }
    });
    if (!obligacion) throw new Error("Obligación no encontrada");

    await this.prisma.$transaction(async (tx) => {
      // Create recaudo
      await tx.recaudo.create({
        data: {
          obligacionId,
          monto,
          fechaAbonada,
          usuarioId: usuarioId || null,
          observacion: observacion || null
        } as any
      });
    });
  }

  async getRecaudos(
    clienteId: string,
    obligacionId: string
  ): Promise<RecaudoItem[]> {
    const obligacion = await this.prisma.obligacion.findFirst({
      where: { id: obligacionId, clienteId }
    });
    if (!obligacion) throw new Error("Obligación no encontrada");

    const recaudos = await this.prisma.recaudo.findMany({
      where: { obligacionId },
      include: {
        usuario: {
          select: {
            correo: true,
            empleado: {
              select: {
                nombres: true,
                apellidos: true
              }
            }
          }
        }
      },
      orderBy: { fechaAbonada: 'desc' }
    });

    return recaudos.map(r => ({
      id: r.id,
      obligacionId: r.obligacionId,
      fechaAbonada: r.fechaAbonada,
      monto: Number(r.monto),
      usuarioId: r.usuarioId,
      createdAt: r.createdAt,
      usuario: r.usuario,
      observacion: (r as any).observacion
    }));
  }

  async addNotificacion(
    clienteId: string,
    obligacionId: string,
    data: {
      destinatarioPersonaId?: string | null;
      fechaNotificacion: Date;
      observacion?: string | null;
    }
  ): Promise<void> {
    const obligacion = await this.prisma.obligacion.findFirst({
      where: { id: obligacionId, clienteId }
    });
    if (!obligacion) throw new Error("Obligación no encontrada");

    await (this.prisma as any).notificacion.create({
      data: {
        obligacionId,
        destinatarioPersonaId: data.destinatarioPersonaId || null,
        fechaNotificacion: data.fechaNotificacion,
        observacion: data.observacion || null
      }
    });
  }

  async getNotificaciones(
    clienteId: string,
    obligacionId: string
  ): Promise<NotificacionItem[]> {
    const obligacion = await this.prisma.obligacion.findFirst({
      where: { id: obligacionId, clienteId }
    });
    if (!obligacion) throw new Error("Obligación no encontrada");

    const list = await (this.prisma as any).notificacion.findMany({
      where: { obligacionId },
      include: {
        destinatarioPersona: {
          select: {
            nombreCompleto: true,
            numeroIdentificacion: true
          }
        }
      },
      orderBy: { fechaNotificacion: 'desc' }
    });

    return list.map((n: any) => ({
      id: n.id,
      obligacionId: n.obligacionId,
      destinatarioPersonaId: n.destinatarioPersonaId,
      fechaNotificacion: n.fechaNotificacion,
      observacion: n.observacion,
      createdAt: n.createdAt,
      destinatarioPersona: n.destinatarioPersona
    }));
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
