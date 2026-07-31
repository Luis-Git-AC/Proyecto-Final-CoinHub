import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import type { Types } from 'mongoose';
import type { UserRole } from '../types/models';

// No se importa `env` de `../config/env` deliberadamente: ese módulo exige
// (con `requireEnv`) también MONGODB_URI/Cloudinary de forma síncrona al
// cargarse, y firmar/verificar JWT no debería acoplarse a esa validación.
const JWT_SECRET = process.env['JWT_SECRET'] as string;
const isProd = process.env['NODE_ENV'] === 'production';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

interface AccessTokenPayload {
  type: 'access';
  userId: string;
  role: UserRole;
  tokenVersion: number;
}

interface RefreshTokenPayload {
  type: 'refresh';
  userId: string;
  tokenVersion: number;
}

interface TokenSubject {
  _id: Types.ObjectId;
  role: UserRole;
  tokenVersion: number;
}

function baseCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge,
  };
}

export function signAccessToken(user: TokenSubject): string {
  const payload: AccessTokenPayload = {
    type: 'access',
    userId: user._id.toString(),
    role: user.role,
    tokenVersion: user.tokenVersion,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(user: TokenSubject): string {
  const payload: RefreshTokenPayload = {
    type: 'refresh',
    userId: user._id.toString(),
    tokenVersion: user.tokenVersion,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Token no es de tipo access');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Token no es de tipo refresh');
  }
  return decoded;
}

/** Emite y fija en cookies httpOnly el par access+refresh para el usuario. */
export function setAuthCookies(res: Response, user: TokenSubject): void {
  res.cookie(ACCESS_COOKIE, signAccessToken(user), baseCookieOptions(ACCESS_TOKEN_TTL_MS));
  res.cookie(REFRESH_COOKIE, signRefreshToken(user), baseCookieOptions(REFRESH_TOKEN_TTL_MS));
}

export function clearAuthCookies(res: Response): void {
  const clearOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie(ACCESS_COOKIE, clearOptions);
  res.clearCookie(REFRESH_COOKIE, clearOptions);
}
