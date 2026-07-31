import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextValue, LoginPayload, RegisterPayload } from './AuthContext';
import { login as apiLogin, register as apiRegister, me, refresh, logout as apiLogout } from '../services/auth';
import type { User } from '../types/user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // La sesión vive en cookies httpOnly: no hay token legible en JS para saber
  // si el usuario está autenticado, así que al montar siempre se pregunta al
  // backend vía /auth/me. Si el access token (15 min) ya expiró pero el
  // refresh token (7 días) sigue vigente, se intenta renovar una vez antes
  // de dar la sesión por cerrada.
  const loadCurrentUser = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await me();
      setUser(data.user);
      setError(null);
    } catch {
      try {
        await refresh();
        const data = await me();
        setUser(data.user);
        setError(null);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const loginUser = async (credentials: LoginPayload): Promise<User> => {
    setLoading(true);
    try {
      const data = await apiLogin(credentials);
      setUser(data.user);
      setError(null);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (payload: RegisterPayload): Promise<User> => {
    setLoading(true);
    try {
      const data = await apiRegister(payload);
      setUser(data.user);
      setError(null);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = (): void => {
    setUser(null);
    void apiLogout().catch(() => {
      // El estado local ya se limpió. Si la llamada de red falla, las
      // cookies httpOnly seguirán vivas hasta su expiración natural.
    });
  };

  const contextValue: AuthContextValue = {
    user,
    loading,
    error,
    clearError,
    loginUser,
    registerUser,
    logoutUser,
    loadCurrentUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
