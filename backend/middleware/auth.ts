import type { Request, Response, NextFunction } from 'express';
import User from '../API/models/User';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/tokens';

const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies[ACCESS_COOKIE] as string | undefined;

    if (!token) {
      res.status(401).json({ error: 'No se proporcionó token de autenticación' });
      return;
    }

    let decoded: ReturnType<typeof verifyAccessToken>;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const jwtErr = err as Error;
      console.error('Error en middleware auth:', jwtErr.message);
      if (jwtErr.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expirado' });
        return;
      }
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado o token inválido' });
      return;
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      res.status(401).json({ error: 'Token inválido o revocado' });
      return;
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error('Error en middleware auth:', (error as Error).message);
    res.status(500).json({ error: 'Error interno de autenticación' });
  }
};

export default auth;
