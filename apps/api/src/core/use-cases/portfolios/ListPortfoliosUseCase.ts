import { IPortfolioRepository } from '../../repositories/IPortfolioRepository.js';
import { Portfolio } from '../../entities/Portfolio.js';

export class ListPortfoliosUseCase {
  constructor(private readonly portfolioRepository: IPortfolioRepository) {}

  async execute(clienteId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.findAll(clienteId);
  }
}
