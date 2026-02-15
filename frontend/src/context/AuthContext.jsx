import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../lib/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const loadUser = useCallback(async () => {
    if (!authApi.hasStoredSession()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.getMe();
      setUser(me ?? null);
    } catch (e) {
      if (e?.status === 401) {
        const refreshed = await authApi.refreshToken();
        if (refreshed?.user) {
          setUser(refreshed.user);
          setIsLoading(false);
          return;
        }
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email, password) => {
      setError(null);
      try {
        const data = await authApi.login({ email, password });
        setUser(data?.user ?? null);
        return { success: true, data };
      } catch (e) {
        const message = e?.message ?? "Error al iniciar sesión";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const register = useCallback(
    async (username, email, password, role = null) => {
      setError(null);
      try {
        const data = await authApi.register({ username, email, password, role });
        // El backend no devuelve tokens en registro; hacemos login para obtener sesión
        if (data?.user && !data?.accessToken) {
          const loginData = await authApi.login({ email, password });
          setUser(loginData?.user ?? data.user);
          return { success: true, data: loginData ?? data };
        }
        setUser(data?.user ?? null);
        return { success: true, data };
      } catch (e) {
        const message = e?.message ?? "Error al registrarse";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setError(null);
    await authApi.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isLoading,
    error,
    clearError,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
};
