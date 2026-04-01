import { getStoredTokens } from "./authApi.js";

function getBaseUrl() {
  const url = import.meta.env.VITE_SUBMISSIONS_API_URL;
  if (!url) {
    return "http://localhost:8083";
  }
  return url.replace(/\/$/, "");
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
  const ct = res.headers.get("Content-Type") || "";
  let body = null;
  if (ct.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      /* vacío */
    }
  }
  if (!res.ok) {
    const message = body?.message || res.statusText || "Error en la petición";
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/** Lista de envíos del usuario actual (requiere JWT). */
export async function getMySubmissions() {
  return request("/api/submissions/my");
}

/** Logs de build y tests de un envío. */
export async function getSubmissionLogs(id) {
  return request(`/api/submissions/${id}/logs`);
}

/** Detalle de un envío (puntuación, estado, etc.). */
export async function getSubmissionById(id) {
  return request(`/api/submissions/${id}`);
}
