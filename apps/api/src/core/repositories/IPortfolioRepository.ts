import { Portfolio } from '../entities/Portfolio.js';

export interface CreatePortfolioDTO {
  clienteId: string;
  nombreEntidad: string;
  nit?: string | null;
  representante?: string | null;
  telefono?: string | null;
  correo?: string | null;
  observaciones?: string | null;
  logoUrl?: string | null;
}

export interface UpdatePortfolioDTO {
  nombreEntidad?: string;
  nit?: string | null;
  representante?: string | null;
  telefono?: string | null;
  correo?: string | null;
  observaciones?: string | null;
  logoUrl?: string | null;
  activo?: boolean;
}

export interface IPortfolioRepository {
  findById(clienteId: string, id: string): Promise<Portfolio | null>;
  findAll(clienteId: string): Promise<Portfolio[]>;
  create(data: CreatePortfolioDTO): Promise<Portfolio>;
  update(clienteId: string, id: string, data: UpdatePortfolioDTO): Promise<Portfolio>;
  delete(clienteId: string, id: string): Promise<void>;
}
