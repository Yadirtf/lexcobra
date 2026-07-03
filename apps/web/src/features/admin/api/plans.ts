import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';

export interface Plan {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionMeses: number;
  limitUsuarios: number;
  activo: boolean;
}

export function usePlans() {
  return useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Plan[] }>('/plans');
      if (!res.success) throw new Error('Error fetching plans');
      return res.data;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Plan, 'id' | 'activo'>) => {
      const res = await apiClient.post<{ success: boolean; data: Plan }>('/plans', data);
      if (!res.success) throw new Error('Error creating plan');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Plan> }) => {
      const res = await apiClient.put<{ success: boolean; data: Plan }>(`/plans/${id}`, data);
      if (!res.success) throw new Error('Error al actualizar el plan');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });
}

export function useTogglePlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const res = await apiClient.put<{ success: boolean; data: Plan }>(`/plans/${id}`, { activo });
      if (!res.success) throw new Error('Error al cambiar el estado del plan');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });
}
