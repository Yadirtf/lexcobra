import { IObligationRepository } from '../../repositories/IObligationRepository.js';
import { CreateRecoveryInput } from '@lexcobra/shared-schemas';

export class AddRecaudoUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(
    clienteId: string,
    obligacionId: string,
    usuarioId: string,
    data: CreateRecoveryInput
  ): Promise<void> {
    if (data.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    const fecha = new Date(data.fechaAbonada);
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha de abono inválida');
    }

    return this.obligationRepository.addRecaudo(
      clienteId,
      obligacionId,
      data.monto,
      fecha,
      usuarioId,
      data.observacion
    );
  }
}
