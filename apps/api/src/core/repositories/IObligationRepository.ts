import { Obligation } from '../entities/Obligation.js';
import { CreateObligationInput, UpdateObligationInput } from '@lexcobra/shared-schemas';

export interface IObligationRepository {
  findById(clienteId: string, id: string): Promise<Obligation | null>;
  findByCartera(clienteId: string, carteraId: string): Promise<Obligation[]>;
  create(clienteId: string, data: CreateObligationInput): Promise<Obligation>;
  update(clienteId: string, id: string, data: UpdateObligationInput): Promise<Obligation>;
  delete(clienteId: string, id: string): Promise<void>;
}
