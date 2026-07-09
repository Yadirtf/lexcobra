import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';

export interface Municipality {
  id: string;
  nombre: string;
  departamentoId: string;
}

export interface CatalogItem {
  id: string;
  nombre?: string;
  codigo?: string;
  color?: string;
}

export function useMunicipalities() {
  return useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Municipality[] }>('/catalogs/municipalities');
      if (!response.success) throw new Error('Error al obtener municipios');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export interface Departamento {
  id: string;
  nombre: string;
}

export interface JuzgadoInfo {
  id: string;
  juzgadoId: string;
  departamentoId: string | null;
  municipioId: string | null;
  departamento?: { id: string; nombre: string } | null;
  municipio?: { id: string; nombre: string } | null;
}

export interface Juzgado extends CatalogItem {
  clienteId: string;
  informacion?: JuzgadoInfo | null;
}

export function useDepartamentos() {
  return useQuery({
    queryKey: ['departamentos'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Departamento[] }>('/catalogs/departamentos');
      if (!response.success) throw new Error('Error al obtener departamentos');
      return response.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h — datos geográficos casi estáticos
  });
}

export function useJuzgados() {
  return useQuery({
    queryKey: ['juzgados'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Juzgado[] }>('/catalogs/juzgados');
      if (!response.success) throw new Error('Error al obtener juzgados');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateJuzgado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nombre: string; departamentoId?: string; municipioId?: string }) => {
      const response = await apiClient.post<{ success: boolean; data: Juzgado }>('/catalogs/juzgados', data);
      if (!response.success) throw new Error('Error al crear juzgado');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juzgados'] });
    },
  });
}

export function useUpdateJuzgado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { nombre?: string; departamentoId?: string; municipioId?: string } }) => {
      const response = await apiClient.put<{ success: boolean; data: Juzgado }>(`/catalogs/juzgados/${id}`, data);
      if (!response.success) throw new Error('Error al actualizar juzgado');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juzgados'] });
    },
  });
}

export function useDeleteJuzgado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{ success: boolean }>(`/catalogs/juzgados/${id}`);
      if (!response.success) throw new Error('Error al eliminar juzgado');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juzgados'] });
    },
  });
}

export function useMedidasCautelares() {
  return useQuery({
    queryKey: ['medidas-cautelares'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/medidas-cautelares');
      if (!response.success) throw new Error('Error al obtener medidas cautelares');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useEstadosObligacion() {
  return useQuery({
    queryKey: ['estados-obligacion'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/estados-obligacion');
      if (!response.success) throw new Error('Error al obtener estados de obligación');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useNivelesRecuperacion() {
  return useQuery({
    queryKey: ['niveles-recuperacion'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/niveles-recuperacion');
      if (!response.success) throw new Error('Error al obtener niveles de recuperación');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useTiposContacto() {
  return useQuery({
    queryKey: ['tipos-contacto'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/tipos-contacto');
      if (!response.success) throw new Error('Error al obtener tipos de contacto');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useTiposIdentificacion() {
  return useQuery({
    queryKey: ['tipos-identificacion'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/tipos-identificacion');
      if (!response.success) throw new Error('Error al obtener tipos de identificación');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
}
