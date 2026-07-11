import { IPortfolioRepository, UpdatePortfolioDTO } from '../../repositories/IPortfolioRepository.js';
import { Portfolio } from '../../entities/Portfolio.js';

export class UpdatePortfolioUseCase {
  constructor(private readonly portfolioRepository: IPortfolioRepository) {}

  async execute(clienteId: string, portfolioId: string, data: UpdatePortfolioDTO): Promise<Portfolio> {
    const existingPortfolio = await this.portfolioRepository.findById(clienteId, portfolioId);
    if (!existingPortfolio) {
      throw new Error('Cartera no encontrada o no pertenece al cliente');
    }

    return this.portfolioRepository.update(clienteId, portfolioId, data);
  }
}
