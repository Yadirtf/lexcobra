import { IObligationRepository, RecaudoItem } from '../../repositories/IObligationRepository.js';

export class GetRecaudosUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(
    clienteId: string,
    obligacionId: string
  ): Promise<RecaudoItem[]> {
    return this.obligationRepository.getRecaudos(clienteId, obligacionId);
  }
}
