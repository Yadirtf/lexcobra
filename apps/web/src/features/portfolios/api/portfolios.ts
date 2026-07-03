import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';
import { CreatePortfolioInput } from '@lexcobra/shared-schemas';

export interface Portfolio {
  id: string;
  clienteId: string;
  nombreEntidad: string;
  nit: string | null;
  representante: string | null;
  telefono: string | null;
  correo: string | null;
  observaciones: string | null;
  activo: boolean;
  createdAt: string;
  _count?: {
    obligaciones: number;
  };
}

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Portfolio[] }>('/portfolios');
      if (!response.success) throw new Error('Error al obtener carteras');
      return response.data;
    },
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePortfolioInput) => {
      const response = await apiClient.post<{ success: boolean; data: Portfolio }>('/portfolios', data);
      if (!response.success) throw new Error('Error al crear cartera');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}
