/**
 * Cliente API para el auth-service (backend Java).
 * Base: /api/auth — login, register, refresh, logout, me.
 */

const AUTH_STORAGE_KEY = "apiarena_auth";

function getBaseUrl() {
  const url = import.meta.env.VITE_AUTH_API_URL;
  if (!url) {
    console.warn("VITE_AUTH_API_URL no definida, usando http://localhost:8081");
    return "http://localhost:8081";
  }
  return url.replace(/\/$/, "");
}

function getStoredTokens() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.accessToken) return { accessToken: data.accessToken, refreshToken: data.refreshToken ?? null };
    return null;
  } catch {
    return null;
  }
}

function setStoredTokens(accessToken, refreshToken = null) {
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken, refreshToken })
    );
  } catch (e) {
    console.error("Error guardando tokens:", e);
  }
}

function clearStoredTokens() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

/**
 * Extrae mensaje de error del cuerpo de respuesta del backend.
 * - ErrorResponse: { status, message, timestamp }
 * - Validación: { fieldName: "mensaje", ... }
 */
async function getErrorMessage(res, body) {
  if (body?.message) return body.message;
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const first = Object.values(body)[0];
    if (typeof first === "string") return first;
    const parts = Object.entries(body).map(([k, v]) => `${k}: ${v}`);
    if (parts.length) return parts.join(". ");
  }
  return res.statusText || "Error en la petición";
}

async function request(path, options = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (tokens?.accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  let body = null;
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) {
    try {
      body = await res.json();
    } catch {}
  }
  if (!res.ok) {
    const message = await getErrorMessage(res, body);
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/**
 * Login. Body: { email, password }.
 * Devuelve { user, accessToken, refreshToken }.
 */
export async function login(credentials) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email?.trim(),
      password: credentials.password,
    }),
  });
  if (data?.accessToken) {
    setStoredTokens(data.accessToken, data.refreshToken ?? null);
  }
  return data;
}

/**
 * Registro. Body: { username, email, password, role? }.
 * Devuelve { user, accessToken, refreshToken }.
 */
export async function register(payload) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: payload.username?.trim(),
      email: payload.email?.trim(),
      password: payload.password,
      role: payload.role ?? null,
    }),
  });
  if (data?.accessToken) {
    setStoredTokens(data.accessToken, data.refreshToken ?? null);
  }
  return data;
}

/**
 * Refresca el access token usando el refresh token guardado.
 */
export async function refreshToken() {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    clearStoredTokens();
    return null;
  }
  try {
    const data = await request("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (data?.accessToken) {
      setStoredTokens(data.accessToken, data.refreshToken ?? tokens.refreshToken);
      return data;
    }
  } catch {
    clearStoredTokens();
  }
  return null;
}

/**
 * Logout. Revoca el refresh token en el backend y borra tokens locales.
 */
export async function logout() {
  const tokens = getStoredTokens();
  if (tokens?.refreshToken) {
    try {
      await request("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
    } catch (_) {
      // Ignorar error de red; igualmente limpiamos local
    }
  }
  clearStoredTokens();
}

/**
 * Obtiene el usuario actual (requiere access token válido).
 */
export async function getMe() {
  return request("/api/auth/me", { method: "GET" });
}

/**
 * Actualiza el perfil del usuario actual. Body según UpdateProfileRequest del backend.
 */
export async function updateProfile(profileData) {
  return request("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

/**
 * Comprueba si hay tokens guardados (sin validar en servidor).
 */
export function hasStoredSession() {
  return !!getStoredTokens()?.accessToken;
}

export {
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
  getBaseUrl,
};
