import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import User from '../../API/models/User';
import type { RegisterPayload, LoginPayload } from '../schemas/authSchemas';
import { REFRESH_COOKIE, setAuthCookies, clearAuthCookies, verifyRefreshToken } from '../../utils/tokens';

type TypedRequest<Body> = Request<Record<string, string>, unknown, Body>;

export async function register(req: TypedRequest<RegisterPayload>, res: Response): Promise<void> {
  try {
    const { username, email, password, avatar, wallet_address } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ error: 'El email o username ya está registrado' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || `https://ui-avatars.com/api/?name=${username}&background=random`,
      wallet_address: wallet_address || '',
      role: 'user',
    });

    await newUser.save();
    setAuthCookies(res, newUser);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        wallet_address: newUser.wallet_address,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error en /register:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

export async function login(req: TypedRequest<LoginPayload>, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    setAuthCookies(res, user);

    res.status(200).json({
      message: 'Login exitoso',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        wallet_address: user.wallet_address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    res.status(200).json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        wallet_address: req.user.wallet_address,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ error: 'No se proporcionó refresh token' });
      return;
    }

    let decoded: ReturnType<typeof verifyRefreshToken>;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      console.error('Error al verificar refresh token:', (err as Error).message);
      clearAuthCookies(res);
      res.status(401).json({ error: 'Refresh token inválido o expirado' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user || decoded.tokenVersion !== user.tokenVersion) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Sesión revocada, inicia sesión de nuevo' });
      return;
    }

    setAuthCookies(res, user);
    res.status(200).json({ message: 'Token renovado' });
  } catch (error) {
    console.error('Error en /refresh:', error);
    res.status(500).json({ error: 'Error al renovar la sesión' });
  }
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookies(res);
  res.status(200).json({ message: 'Sesión cerrada' });
}
