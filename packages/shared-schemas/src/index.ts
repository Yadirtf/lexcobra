// ═══════════════════════════════════════════════════════════════
//  LexCobra — Schemas Zod compartidos (Schema Oficial)
//  Reutilizados en validación del backend y del frontend
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ── Auth ───────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ── Cartera (Portfolio) ────────────────────────────────────────
export const createPortfolioSchema = z.object({
  nombreEntidad: z.string().min(1, 'El nombre de la entidad es requerido').max(200),
  nit: z.string().max(30).optional(),
  representante: z.string().max(200).optional(),
  telefono: z.string().max(30).optional(),
  correo: z.string().email('Email inválido').optional().or(z.literal('')),
  observaciones: z.string().max(1000).optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const updatePortfolioSchema = createPortfolioSchema.partial().extend({
  activo: z.boolean().optional(),
});

// ── Persona (Deudor/Codeudor) ──────────────────────────────────
export const personSchema = z.object({
  documentId: z.string().min(1, 'El número de documento es requerido').max(20),
  fullName: z.string().min(1, 'El nombre completo es requerido').max(300),
  tipoIdentificacionId: z.string().uuid().optional(),
  contacts: z.array(z.object({
    tipoContactoId: z.string().uuid(),
    valor: z.string().min(1).max(150),
    esPrincipal: z.boolean().optional().default(false),
  })).optional().default([]),
});

// ── Obligación ─────────────────────────────────────────────────
export const createObligationSchema = z.object({
  portfolioId: z.string().uuid('ID de cartera inválido'),
  creditNumber: z.string().min(1, 'El número de crédito es requerido').max(50),
  promissoryNoteNumber: z.string().max(50).optional(),
  capitalBalance: z.number().positive('El saldo capital debe ser mayor a 0'),
  municipalityId: z.string().uuid().optional(),
  departamentoId: z.string().uuid().optional(),
  intakeDate: z.string().datetime().optional().or(z.literal('')),
  lawsuitDate: z.string().datetime().optional().or(z.literal('')),
  courtId: z.string().uuid().optional(),
  docketNumber: z.string().max(50).optional(),
  precautionaryMeasureId: z.string().uuid().optional(),
  paymentOrderDate: z.string().datetime().optional().or(z.literal('')),
  proceedExecutionDate: z.string().datetime().optional().or(z.literal('')),
  creditLiquidationDate: z.string().datetime().optional().or(z.literal('')),
  statusId: z.string().uuid().optional(),
  recoveryLevelId: z.string().uuid().optional(),
  debtors: z.array(personSchema).min(1, 'Al menos un deudor es requerido'),
  coDebtors: z.array(personSchema).optional().default([]),
});

export const updateObligationSchema = createObligationSchema.partial();

// ── Recaudo ────────────────────────────────────────────────────
export const createRecoverySchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fechaAbonada: z.string().min(1, 'La fecha es requerida'),
  observacion: z.string().max(500).optional(),
});

// ── Notificación ───────────────────────────────────────────────
export const createNotificationSchema = z.object({
  destinatarioPersonaId: z.string().uuid('ID de destinatario inválido').optional().nullable().or(z.literal('')),
  fechaNotificacion: z.string().min(1, 'La fecha de notificación es requerida'),
  observacion: z.string().max(2000).optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// ── Bitácora (Observaciones) ───────────────────────────────────
export const createNoteSchema = z.object({
  observacion: z.string().min(1, 'La observación no puede estar vacía').max(2000),
});

// ── Juzgado ────────────────────────────────────────────────────
export const createCourtSchema = z.object({
  nombre: z.string().min(1, 'El nombre del juzgado es requerido').max(200),
});

export const updateCourtSchema = createCourtSchema.partial();

// ── Empleado ───────────────────────────────────────────────────

/**
 * Schema para crear un empleado/asesor con credenciales de acceso.
 * Solo el Administrador (Representante Legal) puede ejecutar esta acción.
 */
export const createEmployeeWithCredentialsSchema = z.object({
  // Datos del perfil del empleado
  identificacion: z.string().min(1, 'La identificación es requerida').max(20),
  nombres: z.string().min(1, 'Los nombres son requeridos').max(100),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100),
  telefono: z.string().max(20).optional(),
  cargoId: z.string().uuid('ID de cargo inválido').optional(),
  // Credenciales de acceso al sistema
  correo: z.string().email('Correo electrónico inválido').max(100),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
});

/**
 * Schema para actualizar el perfil de un empleado (datos personales únicamente).
 * El correo NO se incluye aquí — solo el admin puede actualizarlo via updateEmployeeEmailSchema.
 */
export const updateEmployeeProfileSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son requeridos').max(100).optional(),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100).optional(),
  telefono: z.string().max(20).optional().nullable(),
  cargoId: z.string().uuid('ID de cargo inválido').optional().nullable(),
});

/**
 * Schema para que el Administrador actualice el correo de un asesor.
 * Acción exclusiva del Representante Legal (Administrador del tenant).
 */
export const updateEmployeeEmailSchema = z.object({
  correo: z.string().email('Correo electrónico inválido').max(100),
});

/**
 * Schema para que el usuario cambie su PROPIA contraseña.
 * Requiere verificación de la contraseña actual.
 */
export const changeOwnPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'La contraseña actual es requerida'),
    passwordNuevo: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(100),
    passwordNuevoConfirmacion: z.string().min(1, 'La confirmación es requerida'),
  })
  .refine((data) => data.passwordNuevo === data.passwordNuevoConfirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordNuevoConfirmacion'],
  });

/**
 * Schema para que el Administrador resetee la contraseña de un asesor.
 * No requiere la contraseña actual — acción administrativa.
 */
export const resetPasswordByAdminSchema = z
  .object({
    passwordNuevo: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(100),
    passwordNuevoConfirmacion: z.string().min(1, 'La confirmación es requerida'),
  })
  .refine((data) => data.passwordNuevo === data.passwordNuevoConfirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordNuevoConfirmacion'],
  });

// Schema legacy — mantenido por compatibilidad
export const createEmpleadoSchema = z.object({
  identificacion: z.string().min(1, 'La identificación es requerida').max(20),
  nombres: z.string().min(1, 'Los nombres son requeridos').max(100),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100),
  telefono: z.string().max(20).optional(),
  cargoId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
});

export const updateEmpleadoSchema = createEmpleadoSchema.partial();

// ── Report (Extensión) ─────────────────────────────────────────
export const generateReportSchema = z.object({
  carteraId: z.string().uuid().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  hiddenColumns: z.array(z.string()).optional().default([]),
  title: z.string().max(200).optional(),
});

export const createReportLinkSchema = z.object({
  reportSnapshotId: z.string().uuid(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  neverExpires: z.boolean().optional().default(false),
});

// Tipos inferidos de los schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type CreateObligationInput = z.infer<typeof createObligationSchema>;
export type UpdateObligationInput = z.infer<typeof updateObligationSchema>;
export type CreateRecoveryInput = z.infer<typeof createRecoverySchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateCourtInput = z.infer<typeof createCourtSchema>;
export type CreateEmpleadoInput = z.infer<typeof createEmpleadoSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type CreateReportLinkInput = z.infer<typeof createReportLinkSchema>;
// Tipos nuevos del módulo de Asesores
export type CreateEmployeeWithCredentialsInput = z.infer<typeof createEmployeeWithCredentialsSchema>;
export type UpdateEmployeeProfileInput = z.infer<typeof updateEmployeeProfileSchema>;
export type UpdateEmployeeEmailInput = z.infer<typeof updateEmployeeEmailSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;
export type ResetPasswordByAdminInput = z.infer<typeof resetPasswordByAdminSchema>;
