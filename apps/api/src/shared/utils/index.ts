// ═══════════════════════════════════════════════════════════════
//  LexCobra — Utilidades compartidas del backend
// ═══════════════════════════════════════════════════════════════

// ── PAGINACIÓN ──────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function buildPaginationMeta(
  total: number,
  params: PaginationParams,
): PaginatedResult<never>['meta'] {
  const totalPages = Math.ceil(total / params.limit);
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
  };
}

export function getPrismaSkipTake(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  };
}

// ── MONEDA (Colombia) ────────────────────────────────────────────

export function formatCurrencyCOP(amount: number | string | bigint): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ── FECHAS ───────────────────────────────────────────────────────

export function formatDateCO(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ── RESPUESTA API ESTÁNDAR ────────────────────────────────────────

export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true as const, data, ...(meta && { meta }) };
}

export function errorResponse(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}
