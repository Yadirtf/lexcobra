import { IObligationRepository } from '../../repositories/IObligationRepository.js';
import { Obligation } from '../../entities/Obligation.js';

export interface UpdateStateDTO {
  estadoNuevoId?: string;
  nivelRecuperacionNuevoId?: string;
  observacion?: string;
}

export class UpdateObligationStateUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(
    clienteId: string,
    obligacionId: string,
    usuarioId: string,
    data: UpdateStateDTO
  ): Promise<Obligation> {
    return this.obligationRepository.updateStateWithHistory(
      clienteId,
      obligacionId,
      data.estadoNuevoId || null,
      data.nivelRecuperacionNuevoId || null,
      usuarioId,
      data.observacion || null
    );
  }
}
