import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodType } from 'zod';

/**
 * Valida y parsea `req.body` contra un esquema Zod. En caso de éxito, sustituye
 * `req.body` por los datos ya parseados (con las transformaciones del esquema
 * aplicadas: trim, toLowerCase, etc.), de modo que el controlador puede leerlo
 * sin castear manualmente.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
