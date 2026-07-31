import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Manejador de errores global de Express.
 * Debe registrarse despues de todas las rutas en server.ts:
 *   app.use(errorHandler)
 */
export function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : (err.status ?? err.statusCode ?? 500);
  const isOperational = err instanceof AppError ? err.isOperational : statusCode < 500;

  const context = { requestId: req.id, method: req.method, url: req.originalUrl, statusCode };

  if (isOperational) {
    logger.warn({ ...context, err }, err.message);
  } else {
    logger.error({ ...context, err }, err.message);
  }

  const message =
    isOperational || env.NODE_ENV !== 'production' ? err.message || 'Error interno del servidor' : 'Algo salió mal';

  res.status(statusCode).json({ error: message, requestId: req.id });
}
