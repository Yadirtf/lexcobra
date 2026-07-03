import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';

export interface Tenant {
  id: string;
  nit: string;
  nombreComercial: string;
  subdominio: string;
  telefono: string | null;
  direccion: string | null;
  createdAt: string;
  estado?: { estado: string };
  suscripciones: Array<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    plan: { nombre: string; precio: number };
  }>;
}

export interface CreateTenantDTO {
  nit: string;
  nombreComercial: string;
  subdominio: string;
  departamentoId?: string;
  municipioId?: string;
  adminEmail: string;
  adminPasswordPlana: string;
  planId: string;
  fechaInicioSuscripcion: string;
  fechaFinSuscripcion: string;
}

export function useTenants() {
  return useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Tenant[] }>('/clients');
      if (!res.success) throw new Error('Error fetching tenants');
      return res.data;
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTenantDTO) => {
      const res = await apiClient.post<{ success: boolean; data: any }>('/clients', data);
      if (!res.success) throw new Error('Error creating tenant');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });
}

export interface UpdateTenantDTO {
  nit: string;
  nombreComercial: string;
  subdominio: string;
  planId?: string;
  fechaInicioSuscripcion?: string;
  fechaFinSuscripcion?: string;
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTenantDTO }) => {
      const res = await apiClient.put<{ success: boolean; data: any }>(`/clients/${id}`, data);
      if (!res.success) throw new Error('Error updating tenant');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });
}

export function useToggleTenantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, suspendido }: { id: string; suspendido: boolean }) => {
      const res = await apiClient.patch<{ success: boolean; message: string }>(`/clients/${id}/status`, { suspendido });
      if (!res.success) throw new Error('Error changing tenant status');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });
}

// ── Actualización de correo del administrador ──────────────────────────────

export interface UpdateAdminEmailDTO {
  nuevoCorreo: string;
}

/**
 * Actualiza el correo electrónico del usuario Administrador de un tenant.
 * Solo disponible para el Dueño del sistema (SuperAdmin).
 */
export function useUpdateAdminEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAdminEmailDTO }) => {
      const res = await apiClient.patch<{ success: boolean; data: { correo: string; usuarioId: string } }>(
        `/clients/${id}/admin-email`,
        data,
      );
      if (!res.success) throw new Error('Error al actualizar el correo del administrador');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });
}
