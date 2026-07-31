/**
 * Error de negocio esperado (400/401/403/404/409...). El errorHandler lo loguea
 * como `warn` y expone `message` al cliente tal cual. Cualquier otro error
 * (bug, excepción no controlada) se trata como no operacional: se loguea como
 * `error` y en producción se responde con un mensaje genérico.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
