// ═══════════════════════════════════════════════════════════════
//  LexCobra — Error classes centralizados
//  Todo error de la aplicación extiende AppError
// ═══════════════════════════════════════════════════════════════

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tiene permisos para esta acción') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(resource: string) {
    super(`${resource} ya existe`, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class TenantSuspendedError extends AppError {
  constructor() {
    super('La suscripción del tenant está suspendida', 403, 'TENANT_SUSPENDED');
  }
}

export class SubscriptionLimitError extends AppError {
  constructor(resource: string) {
    super(
      `Ha alcanzado el límite de ${resource} de su plan de suscripción`,
      403,
      'SUBSCRIPTION_LIMIT_REACHED',
    );
  }
}
