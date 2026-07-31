import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types/models';

/**
 * Middleware de control de roles.
 * Debe usarse DESPUÉS del middleware auth.
 * @example router.delete('/users/:id', auth, checkRole('admin', 'owner'), controller)
 */
const checkRole =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Autenticación requerida. Use middleware auth antes de checkRole.',
      });
      return;
    }

    const hasRole = allowedRoles.includes(req.user.role);

    if (!hasRole) {
      res.status(403).json({
        error: 'Acceso denegado. Permisos insuficientes.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };

export default checkRole;
