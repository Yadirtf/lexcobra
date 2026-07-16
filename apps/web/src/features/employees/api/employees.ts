// ═══════════════════════════════════════════════════════════════
//  LexCobra — Employees API Hooks (React Query)
//  Hooks de datos para el módulo de Asesores de Cobranza
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client.js';
import type {
  CreateEmployeeWithCredentialsInput,
  UpdateEmployeeProfileInput,
  UpdateEmployeeEmailInput,
  ResetPasswordByAdminInput,
  ChangeOwnPasswordInput,
} from '@lexcobra/shared-schemas';

// ── Tipos del módulo ────────────────────────────────────────────

export interface Cargo {
  id: string;
  nombreCargo: string;
}

export interface EmployeeUser {
  id: string;
  correo: string;
  activo: boolean;
}

export interface Employee {
  id: string;
  clienteId: string;
  usuarioId: string | null;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
  cargo: Cargo | null;
  usuario: EmployeeUser | null;
}

export interface MyProfile {
  usuarioId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  empleado: Employee | null;
}

// ── Query Keys ──────────────────────────────────────────────────
const EMPLOYEES_KEY = ['employees'] as const;
const MY_PROFILE_KEY = ['my-profile'] as const;

// ── Hooks de lectura ────────────────────────────────────────────

/**
 * Obtiene la lista de asesores del tenant.
 * Solo disponible para el Administrador.
 * @param search Filtro de búsqueda por nombre o identificación
 * @param soloActivos Filtrar solo activos (undefined = todos)
 */
export function useEmployees(search?: string, soloActivos?: boolean) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, { search, soloActivos }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search?.trim()) params.set('search', search.trim());
      if (soloActivos !== undefined) params.set('soloActivos', String(soloActivos));
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<{ success: boolean; data: Employee[] }>(
        `/employees${query}`,
      );
      if (!response.success) throw new Error('Error al obtener los asesores');
      return response.data;
    },
  });
}

/**
 * Obtiene el perfil propio del usuario autenticado.
 * Disponible para todos los roles.
 */
export function useMyProfile() {
  return useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: MyProfile }>(
        '/employees/me',
      );
      if (!response.success) throw new Error('Error al obtener el perfil');
      return response.data;
    },
  });
}

// ── Hooks de mutación ───────────────────────────────────────────

/**
 * Crea un nuevo asesor con credenciales de acceso.
 * Solo Admin.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeWithCredentialsInput) => {
      const response = await apiClient.post<{ success: boolean; data: Employee; error?: { message: string } }>(
        '/employees',
        data,
      );
      if (!response.success) throw new Error((response as any).error?.message ?? 'Error al crear el asesor');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    },
  });
}

/**
 * Actualiza el perfil del asesor (nombres, teléfono, cargo).
 * Solo Admin.
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeProfileInput }) => {
      const response = await apiClient.patch<{ success: boolean; data: Employee }>(
        `/employees/${id}`,
        data,
      );
      if (!response.success) throw new Error('Error al actualizar el asesor');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    },
  });
}

/**
 * Actualiza el correo del asesor.
 * Solo Admin (Representante Legal).
 */
export function useUpdateEmployeeEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeEmailInput }) => {
      const response = await apiClient.patch<{ success: boolean; data: unknown }>(
        `/employees/${id}/email`,
        data,
      );
      if (!response.success) throw new Error('Error al actualizar el correo');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    },
  });
}

/**
 * Activa o desactiva un asesor (soft-delete).
 * Solo Admin.
 */
export function useToggleEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activar }: { id: string; activar: boolean }) => {
      const response = await apiClient.patch<{ success: boolean; data: { mensaje: string } }>(
        `/employees/${id}/status`,
        { activar },
      );
      if (!response.success) throw new Error('Error al cambiar el estado del asesor');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    },
  });
}

/**
 * El Administrador resetea la contraseña de un asesor.
 * Solo Admin.
 */
export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ResetPasswordByAdminInput;
    }) => {
      const response = await apiClient.patch<{ success: boolean; data: null }>(
        `/employees/${id}/reset-password`,
        data,
      );
      if (!response.success) throw new Error('Error al restablecer la contraseña');
      return response.data;
    },
  });
}

/**
 * El asesor actualiza su propio perfil (nombres, teléfono, cargo).
 * Disponible para cualquier rol autenticado.
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeProfileInput) => {
      const response = await apiClient.patch<{ success: boolean; data: Employee }>(
        '/employees/me/profile',
        data,
      );
      if (!response.success) throw new Error('Error al actualizar el perfil');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
    },
  });
}

/**
 * El usuario cambia su propia contraseña.
 * Requiere verificación de la contraseña actual.
 * Disponible para cualquier rol autenticado.
 */
export function useChangeMyPassword() {
  return useMutation({
    mutationFn: async (data: ChangeOwnPasswordInput) => {
      const response = await apiClient.patch<{ success: boolean; data: null }>(
        '/auth/change-password',
        data,
      );
      if (!response.success) throw new Error('Error al cambiar la contraseña');
      return response.data;
    },
  });
}
