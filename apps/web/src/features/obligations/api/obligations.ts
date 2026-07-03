import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';
import { CreateObligationInput } from '@lexcobra/shared-schemas';

export interface Obligation {
  id: string;
  clienteId: string;
  carteraId: string | null;
  numeroCredito: string;
  saldoCapitalDemandado: number;
  estadoObligacionId: string | null;
  radicado: string | null;
  isActive: boolean;
  createdAt: string;
  actores: {
    rolActor?: { nombreRol: string };
    persona: {
      id: string;
      nombreCompleto: string;
      numeroIdentificacion: string;
    };
  }[];
  estadoObligacion?: { nombre: string; color: string | null };
  juzgado?: { nombre: string };
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
