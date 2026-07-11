import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';

export function useUpdatePersonaContactos() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { contactos: Array<{ tipoContactoId: string; valor: string; esPrincipal?: boolean; }> } }) => {
      const response = await apiClient.put<{ success: boolean }>(`/personas/${id}/contactos`, data);
      if (!response.success) throw new Error('Error al actualizar contactos');
      return response;
    }
  });
}
