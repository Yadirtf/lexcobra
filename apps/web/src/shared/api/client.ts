// ═══════════════════════════════════════════════════════════════
//  LexCobra — API Client
//  Wrapper sobre fetch con interceptores de auth y errores
// ═══════════════════════════════════════════════════════════════

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(),
      credentials: 'include', // Para las cookies del refresh token
    });

    if (response.status === 401) {
      // Intentar refrescar el token automáticamente
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        // Reintentar la petición original
        return this.get<T>(path);
      }
    }

    if (!response.ok && response.status !== 401) {
      const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(body.error?.message ?? `Error ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({})) as T;

    if (!response.ok) {
      const errorData = data as { error?: { message?: string } };
      throw new Error(errorData.error?.message ?? `Error ${response.status}`);
    }

    return data;
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({})) as T;

    if (!response.ok) {
      const errorData = data as { error?: { message?: string } };
      throw new Error(errorData.error?.message ?? `Error ${response.status}`);
    }

    return data;
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: this.buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({})) as T;

    if (!response.ok) {
      const errorData = data as { error?: { message?: string } };
      throw new Error(errorData.error?.message ?? `Error ${response.status}`);
    }

    return data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(body.error?.message ?? `Error ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) return false;

      const data = await response.json() as { data?: { accessToken?: string } };
      if (data.data?.accessToken) {
        this.token = data.data.accessToken;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
