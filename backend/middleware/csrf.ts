import type { Request, Response, NextFunction } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * La sesión viaja en cookies httpOnly con SameSite=None (necesario porque
 * frontend y backend están en subdominios distintos de vercel.app, es decir,
 * son cross-site). SameSite=None desactiva la protección CSRF implícita de
 * SameSite=Lax/Strict, así que la recuperamos exigiendo esta cabecera custom
 * en toda petición que mute estado: solo JavaScript de un origen ya permitido
 * por CORS puede añadirla (una petición cross-site "simple", como un
 * <form> o una imagen, no puede fijar cabeceras custom).
 */
export function csrfHeaderGuard(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (req.header('X-Requested-With') !== 'XMLHttpRequest') {
    res.status(403).json({ error: 'Petición bloqueada por protección CSRF' });
    return;
  }

  next();
}
