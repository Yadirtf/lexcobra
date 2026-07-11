import { Obligation } from '../entities/Obligation.js';
import { CreateObligationInput, UpdateObligationInput } from '@lexcobra/shared-schemas';

export interface IObligationRepository {
  findById(clienteId: string, id: string): Promise<Obligation | null>;
  findByCartera(clienteId: string, carteraId: string): Promise<Obligation[]>;
  create(clienteId: string, data: CreateObligationInput): Promise<Obligation>;
  update(
    clienteId: string, 
    id: string, 
    data: UpdateObligationInput, 
    auditoriaCambios?: Array<{ campoModificado: string, valorAnterior: string | null, valorNuevo: string | null }>,
    usuarioId?: string | null
  ): Promise<Obligation>;
  updateStateWithHistory(
    clienteId: string, 
    id: string, 
    estadoNuevoId?: string | null, 
    nivelRecuperacionNuevoId?: string | null, 
    usuarioId?: string | null,
    observacion?: string | null
  ): Promise<Obligation>;
  addBitacora(
    clienteId: string,
    id: string,
    observacion: string,
    usuarioId?: string | null
  ): Promise<void>;
  delete(clienteId: string, id: string): Promise<void>;
}
