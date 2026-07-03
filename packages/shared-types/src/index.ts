// ═══════════════════════════════════════════════════════════════
//  LexCobra — Tipos TypeScript compartidos (Schema Oficial)
//  Usados en API (backend) y Web (frontend)
// ═══════════════════════════════════════════════════════════════

// ── Enums / Tipos de dominio ───────────────────────────────────
export type PeriodType = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'CUSTOM';

// ── Respuesta API estándar ─────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ── DTOs de dominio ────────────────────────────────────────────

export interface UsuarioDTO {
  id: string;
  correo: string;
  roles: string[];
  clienteId: string | null;
  clienteNombre: string | null;
  nombres: string;
  apellidos: string;
  activo: boolean;
}

export interface ClienteDTO {
  id: string;
  nit: string;
  nombreComercial: string;
  subdominio: string;
  telefono: string | null;
  direccion: string | null;
  logoUrl: string | null;
  estadoNombre: string | null;
  suscripcion: SuscripcionDTO | null;
  createdAt: string;
}

export interface SuscripcionDTO {
  id: string;
  planNombre: string;
  estadoNombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface PlanDTO {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionMeses: number;
  limitUsuarios: number;
  activo: boolean;
}

export interface CarteraDTO {
  id: string;
  clienteId: string;
  nombreEntidad: string;
  nit: string | null;
  representante: string | null;
  telefono: string | null;
  correo: string | null;
  observaciones: string | null;
  logoUrl: string | null;
  activo: boolean;
  obligacionCount?: number;
  totalCapital?: number;
  totalRecaudado?: number;
  createdAt: string;
}

export interface ObligacionDTO {
  id: string;
  clienteId: string;
  carteraId: string | null;
  numeroCredito: string;
  numeroPagare: string | null;
  saldoCapitalDemandado: number;
  departamentoId: string | null;
  departamentoNombre?: string;
  municipioId: string | null;
  municipioNombre?: string;
  fechaReparto: string | null;
  fechaPresentacionDemanda: string | null;
  juzgadoId: string | null;
  juzgadoNombre?: string;
  radicado: string | null;
  medidaCautelarId: string | null;
  medidaCautelarNombre?: string;
  mandamientoPagoFecha: string | null;
  autoSeguirEjecucionFecha: string | null;
  liquidacionCreditoAprobadaFecha: string | null;
  estadoObligacionId: string | null;
  estadoObligacionNombre?: string;
  estadoObligacionColor?: string;
  nivelRecuperacionId: string | null;
  nivelRecuperacionNombre?: string;
  nivelRecuperacionColor?: string;
  totalRecaudado?: number;
  actores?: ObligacionActorDTO[];
  notificaciones?: NotificacionDTO[];
  recaudos?: RecaudoDTO[];
  bitacora?: BitacoraDTO[];
  createdAt: string;
}

export interface ObligacionActorDTO {
  id: string;
  rolActorNombre: string;
  persona: PersonaDTO;
}

export interface PersonaDTO {
  id: string;
  tipoIdentificacionCodigo?: string;
  numeroIdentificacion: string;
  nombreCompleto: string;
  contactos: PersonaContactoDTO[];
}

export interface PersonaContactoDTO {
  id: string;
  tipoContactoNombre?: string;
  valor: string;
  esPrincipal: boolean;
}

export interface NotificacionDTO {
  id: string;
  destinatarioPersonaNombre?: string;
  fechaNotificacion: string;
  observacion: string | null;
}

export interface RecaudoDTO {
  id: string;
  monto: number;
  fechaAbonada: string;
  usuarioNombre?: string;
  createdAt: string;
}

export interface BitacoraDTO {
  id: string;
  observacion: string;
  usuarioNombre?: string;
  createdAt: string;
}

export interface JuzgadoDTO {
  id: string;
  clienteId: string;
  nombre: string;
  obligacionCount?: number;
}

export interface EmpleadoDTO {
  id: string;
  clienteId: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  telefono: string | null;
  cargoNombre: string | null;
  activo: boolean;
  createdAt: string;
}

export interface DepartamentoDTO {
  id: string;
  nombre: string;
}

export interface MunicipioDTO {
  id: string;
  departamentoId: string;
  nombre: string;
}

export interface TipoIdentificacionDTO {
  id: string;
  codigo: string;
  nombre: string;
}

export interface RolDTO {
  id: string;
  nombreRol: string;
  descripcion: string | null;
}

export interface CargoDTO {
  id: string;
  nombreCargo: string;
  descripcion: string | null;
}

export interface EstadoObligacionDTO {
  id: string;
  nombre: string;
  color: string | null;
}

export interface MedidaCautelarDTO {
  id: string;
  nombre: string;
}

export interface NivelRecuperacionDTO {
  id: string;
  nombre: string;
  color: string | null;
}

export interface ReportLinkDTO {
  id: string;
  token: string;
  expiresAt: string | null;
  isActive: boolean;
  viewCount: number;
  publicUrl: string;
  createdAt: string;
}
