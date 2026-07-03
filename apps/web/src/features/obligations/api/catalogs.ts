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

export function useJuzgados() {
  return useQuery({
    queryKey: ['juzgados'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/juzgados');
      if (!response.success) throw new Error('Error al obtener juzgados');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useCreateJuzgado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      const response = await apiClient.post<{ success: boolean; data: CatalogItem }>('/catalogs/juzgados', { nombre });
      if (!response.success) throw new Error('Error al crear juzgado');
      return response.data;
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
