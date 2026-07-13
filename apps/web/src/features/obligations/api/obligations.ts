import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';
import { CreateObligationInput, UpdateObligationInput } from '@lexcobra/shared-schemas';

export interface Obligation {
  id: string;
  clienteId: string;
  carteraId: string | null;
  numeroCredito: string;
  numeroPagare?: string | null;
  saldoCapitalDemandado: number;
  estadoObligacionId: string | null;
  nivelRecuperacionId?: string | null;
  radicado: string | null;
  juzgadoId?: string | null;
  medidaCautelarId?: string | null;
  fechaPresentacionDemanda?: string | null;
  mandamientoPagoFecha?: string | null;
  fechaReparto?: string | null;
  autoSeguirEjecucionFecha?: string | null;
  liquidacionCreditoAprobadaFecha?: string | null;
  isActive: boolean;
  createdAt: string;
  actores: {
    rolActor?: { nombreRol: string };
    persona: {
      id: string;
      nombreCompleto: string;
      numeroIdentificacion: string;
      tipoIdentificacionId?: string | null;
      contactos?: {
        id: string;
        valor: string;
        esPrincipal: boolean;
        tipoContacto?: { nombre: string } | null;
      }[];
    };
  }[];
  estadoObligacion?: { nombre: string; color: string | null } | null;
  nivelRecuperacion?: { nombre: string; color: string | null } | null;
  juzgado?: { nombre: string } | null;
  municipio?: { nombre: string } | null;
  medidaCautelar?: { nombre: string } | null;
}

export function useObligations(portfolioId: string) {
  return useQuery({
    queryKey: ['obligations', portfolioId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Obligation[] }>(`/obligations?carteraId=${portfolioId}`);
      if (!response.success) throw new Error('Error al obtener obligaciones');
      return response.data;
    },
    enabled: !!portfolioId,
  });
}

export function useCreateObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateObligationInput) => {
      const response = await apiClient.post<{ success: boolean; data: Obligation }>('/obligations', data);
      if (!response.success) throw new Error('Error al crear obligación');
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['obligations', variables.portfolioId] });
      // Invalidar carteras para actualizar el contador
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useFullUpdateObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateObligationInput }) => {
      const response = await apiClient.patch<{ success: boolean; data: Obligation }>(`/obligations/${id}`, data);
      if (!response.success) throw new Error('Error al actualizar obligación');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}

export function useUpdateObligationState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { estadoNuevoId?: string; nivelRecuperacionNuevoId?: string; observacion?: string } }) => {
      const response = await apiClient.patch<{ success: boolean; data: Obligation }>(`/obligations/${id}/state`, data);
      if (!response.success) throw new Error('Error al actualizar estado');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}

export function useAddBitacora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { observacion: string } }) => {
      const response = await apiClient.post<{ success: boolean }>(`/obligations/${id}/bitacora`, data);
      if (!response.success) throw new Error('Error al añadir bitácora');
      return response;
    },
    onSuccess: () => {
      // Invalidate if history is needed, but we don't have a history query yet, so just invalidate obligations to be safe
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}

export function useObligationHistory(id: string, isOpen: boolean) {
  return useQuery({
    queryKey: ['obligations', id, 'history'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: any }>(`/obligations/${id}/history`);
      if (!response.success) throw new Error('Error fetching history');
      return response.data;
    },
    enabled: isOpen,
  });
}

export interface RecaudoItem {
  id: string;
  obligacionId: string;
  fechaAbonada: string;
  monto: number;
  usuarioId: string | null;
  observacion?: string | null;
  createdAt: string;
  usuario?: {
    correo: string;
    empleado?: {
      nombres: string;
      apellidos: string;
    } | null;
  } | null;
}

export function useObligationRecaudos(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['obligations', id, 'recaudos'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: RecaudoItem[] }>(`/obligations/${id}/recaudos`);
      if (!response.success) throw new Error('Error al obtener recaudos');
      return response.data;
    },
    enabled: enabled && !!id,
  });
}

export function useAddRecaudo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { monto: number; fechaAbonada: string; observacion?: string } }) => {
      const response = await apiClient.post<{ success: boolean }>(`/obligations/${id}/recaudos`, data);
      if (!response.success) throw new Error('Error al registrar recaudo');
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['obligations', variables.id, 'recaudos'] });
      queryClient.invalidateQueries({ queryKey: ['obligations', variables.id, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}

export interface NotificacionItem {
  id: string;
  obligacionId: string;
  destinatarioPersonaId: string | null;
  fechaNotificacion: string;
  observacion: string | null;
  createdAt: string;
  destinatarioPersona?: {
    nombreCompleto: string;
    numeroIdentificacion: string;
  } | null;
}

export function useObligationNotifications(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['obligations', id, 'notifications'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: NotificacionItem[] }>(`/obligations/${id}/notificaciones`);
      if (!response.success) throw new Error('Error al obtener notificaciones');
      return response.data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateObligationNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { destinatarioPersonaId?: string | null; fechaNotificacion: string; observacion?: string | null } }) => {
      const response = await apiClient.post<{ success: boolean }>(`/obligations/${id}/notificaciones`, data);
      if (!response.success) throw new Error('Error al registrar notificación');
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['obligations', variables.id, 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['obligations', variables.id, 'history'] });
    },
  });
}
