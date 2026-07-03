import { IPortfolioRepository, CreatePortfolioDTO } from '../../repositories/IPortfolioRepository.js';
import { Portfolio } from '../../entities/Portfolio.js';

export class CreatePortfolioUseCase {
  constructor(private readonly portfolioRepository: IPortfolioRepository) {}

  async execute(data: CreatePortfolioDTO): Promise<Portfolio> {
    return this.portfolioRepository.create(data);
  }
}
