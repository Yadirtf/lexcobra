// ═══════════════════════════════════════════════════════════════
//  LexCobra — Hook de autenticación
//  Gestiona el estado del usuario, login y logout
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '../../../shared/api/client.js';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  clienteId: string | null;
  clienteNombre: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearError: () => void;
  // Helpers
  isSuperAdmin: boolean;
  isLegalRep: boolean;
  isEmployee: boolean;
  canManageUsers: boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isSuperAdmin: false,
      isLegalRep: false,
      isEmployee: false,
      canManageUsers: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { accessToken: string; user: AuthUser };
        error?: { message: string };
      }>('/auth/login', { email, password });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Error de autenticación');
      }

      const { accessToken, user } = response.data;
      apiClient.setToken(accessToken);

      const isSuperAdmin = user.roles?.includes('Dueño del sistema') || false;
      const isLegalRep = user.roles?.includes('Administrador') || false;
      const isEmployee = user.roles?.includes('Usuario') || false;

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isSuperAdmin,
        isLegalRep,
        isEmployee,
        canManageUsers: isSuperAdmin || isLegalRep,
      });

      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore
    } finally {
      apiClient.clearToken();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        isLegalRep: false,
        isEmployee: false,
        canManageUsers: false,
      });
    }
  },

  clearError: () => set({ error: null }),
    }),
    {
      name: 'lexcobra-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          apiClient.setToken(state.accessToken);
        }
      },
    }
  )
);

