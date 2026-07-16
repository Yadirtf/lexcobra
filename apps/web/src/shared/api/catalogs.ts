import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface CatalogItem {
  id: string;
  nombre: string;
  color?: string | null;
}

export interface Cargo {
  id: string;
  nombreCargo: string;
  descripcion: string | null;
}

export function useCatalogs() {
  const { data: estadosObligacion, isLoading: loadingEstados } = useQuery({
    queryKey: ['catalogs', 'estados-obligacion'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/estados-obligacion');
      if (!res.success) throw new Error('Error fetching estados de obligación');
      return res.data;
    }
  });

  const { data: nivelesRecuperacion, isLoading: loadingNiveles } = useQuery({
    queryKey: ['catalogs', 'niveles-recuperacion'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/niveles-recuperacion');
      if (!res.success) throw new Error('Error fetching niveles de recuperación');
      return res.data;
    }
  });

  const { data: tiposContacto, isLoading: loadingContactos } = useQuery({
    queryKey: ['catalogs', 'tipos-contacto'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/tipos-contacto');
      if (!res.success) throw new Error('Error fetching tipos de contacto');
      return res.data;
    }
  });

  const { data: medidasCautelares, isLoading: loadingMedidas } = useQuery({
    queryKey: ['catalogs', 'medidas-cautelares'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: CatalogItem[] }>('/catalogs/medidas-cautelares');
      if (!res.success) throw new Error('Error fetching medidas cautelares');
      return res.data;
    }
  });

  return {
    estadosObligacion,
    nivelesRecuperacion,
    tiposContacto,
    medidasCautelares,
    isLoading: loadingEstados || loadingNiveles || loadingContactos || loadingMedidas
  };
}

/** Hook para obtener los cargos disponibles para asesores */
export function useCargos() {
  return useQuery({
    queryKey: ['catalogs', 'cargos'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Cargo[] }>('/catalogs/cargos');
      if (!res.success) throw new Error('Error al obtener cargos');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos — los cargos cambian poco
  });
}
