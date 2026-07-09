import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';
import { Departamento } from '../../obligations/api/catalogs.js';

// Extend Departamento to include municipios for the Admin view
export interface AdminDepartamento extends Departamento {
  municipios: { id: string; nombre: string }[];
}

export function useAdminLocations() {
  return useQuery({
    queryKey: ['admin-locations'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: AdminDepartamento[] }>('/admin/locations');
      if (!response.success) throw new Error('Error al obtener ubicaciones');
      return response.data;
    },
  });
}

export function useSyncLocations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ success: boolean; data: { deptCount: number; munCount: number; message: string } }>('/admin/locations/sync', {});
      if (!response.success) throw new Error('Error al sincronizar ubicaciones');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      // Also invalidate the tenant's caches to get fresh geographical data
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['municipalities'] });
    },
  });
}
