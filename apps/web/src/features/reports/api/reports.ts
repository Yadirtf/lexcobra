import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';

export interface CreateReportLinkDTO {
  startDate: string;
  endDate: string;
  title?: string;
  expiresInDays?: number;
}

export interface PublicReportData {
  title: string;
  portfolioName: string;
  nit: string;
  clientName: string;
  startDate: string;
  endDate: string;
  obligations: any[];
}

export function useCreateReportLink() {
  return useMutation({
    mutationFn: async ({ portfolioId, data }: { portfolioId: string; data: CreateReportLinkDTO }) => {
      const res = await apiClient.post<{ success: boolean; data: { token: string; expiresAt: string } }>(
        `/reports/portfolios/${portfolioId}/link`,
        data
      );
      if (!res.success) throw new Error('Error al generar el enlace');
      return res.data;
    },
  });
}

export function usePublicReport(token: string) {
  return useQuery({
    queryKey: ['public-report', token],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: PublicReportData }>(`/reports/public/${token}`);
      if (!res.success) throw new Error('Error al cargar el reporte público');
      return res.data;
    },
    enabled: !!token,
    retry: false,
  });
}
