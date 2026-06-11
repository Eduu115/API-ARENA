import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearChallengeSession } from "../lib/challengeSessionStorage";
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
      /* Spring used to return 403 for unauthenticated /me; treat like 401 for refresh */
      if (e?.status === 401 || e?.status === 403) {
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
        let message = e?.message ?? "Sign-in error";
        if (
          e?.status === 403 &&
          typeof message === "string" &&
          message.toLowerCase().includes("email not verified")
        ) {
          message =
            "Email not verified. Check your inbox or request a new link on the email verification page.";
        }
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const register = useCallback(
    async (username, email, password, role = null, extra = {}) => {
      setError(null);
      try {
        const data = await authApi.register({ username, email, password, role, ...extra });
        if (data?.user && !data?.accessToken && data.user.emailVerified === false) {
          return { success: true, data, needsVerification: true };
        }
        setUser(data?.user ?? null);
        return { success: true, data };
      } catch (e) {
        const message = e?.message ?? "Registration error";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setError(null);
    const uid = user?.id;
    await authApi.logout();
    if (uid != null) clearChallengeSession(uid);
    setUser(null);
  }, [user?.id]);

  const value = {
    user,
    isLoading,
    error,
    clearError,
    login,
    register,
    logout,
    loadUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
