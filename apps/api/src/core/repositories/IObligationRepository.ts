import { Obligation } from '../entities/Obligation.js';
import { CreateObligationInput, UpdateObligationInput } from '@lexcobra/shared-schemas';

export interface RecaudoItem {
  id: string;
  obligacionId: string;
  fechaAbonada: Date;
  monto: number;
  usuarioId: string | null;
  observacion: string | null;
  createdAt: Date;
  usuario?: {
    correo: string;
    empleado?: {
      nombres: string;
      apellidos: string;
    } | null;
  } | null;
}

export interface NotificacionItem {
  id: string;
  obligacionId: string;
  destinatarioPersonaId: string | null;
  fechaNotificacion: Date;
  observacion: string | null;
  createdAt: Date;
  destinatarioPersona?: {
    nombreCompleto: string;
    numeroIdentificacion: string;
  } | null;
}

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
  addRecaudo(
    clienteId: string,
    obligacionId: string,
    monto: number,
    fechaAbonada: Date,
    usuarioId?: string | null,
    observacion?: string | null
  ): Promise<void>;
  getRecaudos(
    clienteId: string,
    obligacionId: string
  ): Promise<RecaudoItem[]>;
  addNotificacion(
    clienteId: string,
    obligacionId: string,
    data: {
      destinatarioPersonaId?: string | null;
      fechaNotificacion: Date;
      observacion?: string | null;
    }
  ): Promise<void>;
  getNotificaciones(
    clienteId: string,
    obligacionId: string
  ): Promise<NotificacionItem[]>;
  delete(clienteId: string, id: string): Promise<void>;
}
