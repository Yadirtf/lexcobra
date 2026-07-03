import { IObligationRepository } from '../../repositories/IObligationRepository.js';
import { Obligation } from '../../entities/Obligation.js';
import { CreateObligationInput } from '@lexcobra/shared-schemas';

export class CreateObligationUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(clienteId: string, data: CreateObligationInput): Promise<Obligation> {
    return this.obligationRepository.create(clienteId, data);
  }
}
