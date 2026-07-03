import { IObligationRepository } from '../../repositories/IObligationRepository.js';
import { Obligation } from '../../entities/Obligation.js';

export class ListObligationsByPortfolioUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(clienteId: string, carteraId: string): Promise<Obligation[]> {
    return this.obligationRepository.findByCartera(clienteId, carteraId);
  }
}
