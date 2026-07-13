import { IObligationRepository } from '../../repositories/IObligationRepository.js';
import { UpdateObligationInput } from '@lexcobra/shared-schemas';
import { Obligation } from '../../entities/Obligation.js';

export class UpdateObligationUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(
    clienteId: string,
    id: string,
    data: UpdateObligationInput,
    usuarioId?: string
  ): Promise<Obligation> {
    // 1. Fetch current obligation to diff
    const currentObligation = await this.obligationRepository.findById(clienteId, id);
    if (!currentObligation) {
      throw new Error('Obligación no encontrada');
    }

    // 2. Compute diffs for auditoría
    const auditoriaCambios: Array<{ campoModificado: string; valorAnterior: string | null; valorNuevo: string | null }> = [];

    const compareAndAdd = (campo: string, oldVal: any, newVal: any) => {
      const normOld = (oldVal === undefined || oldVal === null || oldVal === '') ? null : oldVal;
      const normNew = (newVal === undefined || newVal === null || newVal === '') ? null : newVal;

      if (newVal !== undefined && normOld !== normNew) {
        auditoriaCambios.push({
          campoModificado: campo,
          valorAnterior: normOld ? String(normOld) : null,
          valorNuevo: normNew ? String(normNew) : null,
        });
      }
    };

    compareAndAdd('numeroCredito', currentObligation.numeroCredito, data.creditNumber);
    compareAndAdd('saldoCapitalDemandado', currentObligation.saldoCapitalDemandado, data.capitalBalance);
    compareAndAdd('estadoObligacionId', currentObligation.estadoObligacionId, data.statusId);
    compareAndAdd('nivelRecuperacionId', currentObligation.nivelRecuperacionId, data.recoveryLevelId);
    compareAndAdd('radicado', currentObligation.radicado, data.docketNumber);
    compareAndAdd('juzgadoId', currentObligation.juzgadoId, data.courtId);
    compareAndAdd('medidaCautelarId', currentObligation.medidaCautelarId, data.precautionaryMeasureId);
    
    // Convert Dates for comparison if they exist
    const formatDate = (date: Date | null | undefined) => date ? date.toISOString() : null;
    compareAndAdd('fechaReparto', formatDate(currentObligation.fechaReparto), data.intakeDate);
    compareAndAdd('fechaPresentacionDemanda', formatDate(currentObligation.fechaPresentacionDemanda), data.lawsuitDate);
    compareAndAdd('mandamientoPagoFecha', formatDate(currentObligation.mandamientoPagoFecha), data.paymentOrderDate);
    compareAndAdd('autoSeguirEjecucionFecha', formatDate(currentObligation.autoSeguirEjecucionFecha), data.proceedExecutionDate);
    compareAndAdd('liquidacionCreditoAprobadaFecha', formatDate(currentObligation.liquidacionCreditoAprobadaFecha), data.creditLiquidationDate);

    // 3. Apply Update
    return this.obligationRepository.update(clienteId, id, data, auditoriaCambios, usuarioId);
  }
}
