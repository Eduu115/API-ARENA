import { getStoredTokens, setStoredTokens } from "./authApi.js";
import { getApiBaseUrl as getBaseUrl } from "./apiBase.js";

async function request(path, options = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = { "Content-Type": "application/json", ...options.headers };
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
      /* empty */
    }
  }
  if (!res.ok) {
    const err = new Error(body?.detail || body?.message || res.statusText || "Request error");
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function getStats() {
  return request("/api/auth/admin/stats");
}

export function getModerationStats() {
  return request("/api/auth/admin/moderation/stats");
}

export function searchUsers({ query = "", role = "", active = "", page = 0, size = 25 } = {}) {
  const p = new URLSearchParams();
  if (query) p.set("query", query);
  if (role) p.set("role", role);
  if (active !== "" && active != null) p.set("active", String(active));
  p.set("page", String(page));
  p.set("size", String(size));
  return request(`/api/auth/admin/users?${p.toString()}`);
}

export function getUser(id) {
  return request(`/api/auth/admin/users/${id}`);
}

export function banUser(id, payload) {
  return request(`/api/auth/admin/users/${id}/ban`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function unbanUser(id, payload) {
  return request(`/api/auth/admin/users/${id}/unban`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getModeration(id) {
  return request(`/api/auth/admin/users/${id}/moderation`);
}

export function warnUser(id, reason) {
  return request(`/api/auth/admin/users/${id}/warn`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function clearWarnings(id) {
  return request(`/api/auth/admin/users/${id}/clear-warnings`, { method: "POST" });
}

export function setUserRole(id, role, capabilities) {
  return request(`/api/auth/admin/users/${id}/role`, {
    method: "POST",
    body: JSON.stringify(capabilities ? { role, capabilities } : { role }),
  });
}

export function getMyCapabilities() {
  return request(`/api/auth/admin/me/capabilities`);
}

export function getUserCapabilities(id) {
  return request(`/api/auth/admin/users/${id}/capabilities`);
}

export function deactivateUser(id) {
  return request(`/api/auth/admin/users/${id}/deactivate`, { method: "POST" });
}

export function reactivateUser(id) {
  return request(`/api/auth/admin/users/${id}/reactivate`, { method: "POST" });
}

export function verifyEmail(id) {
  return request(`/api/auth/admin/users/${id}/verify-email`, { method: "POST" });
}

export function forceLogout(id) {
  return request(`/api/auth/admin/users/${id}/logout`, { method: "POST" });
}

export function reset2fa(id) {
  return request(`/api/auth/admin/users/${id}/reset-2fa`, { method: "POST" });
}

export function messageUser(id, title, body) {
  return request(`/api/auth/admin/users/${id}/message`, {
    method: "POST",
    body: JSON.stringify({ title, body }),
  });
}

export function deleteUser(id) {
  return request(`/api/auth/admin/users/${id}`, { method: "DELETE" });
}

export function adjustUser(id, ratingDelta, xpDelta) {
  return request(`/api/auth/admin/users/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify({ ratingDelta, xpDelta }),
  });
}

/** Impersonate: swaps the stored session for the target user's tokens. */
export async function impersonate(id) {
  const data = await request(`/api/auth/admin/users/${id}/impersonate`, { method: "POST" });
  if (data?.accessToken) setStoredTokens(data.accessToken, data.refreshToken ?? null);
  return data;
}

export function getAudit({ page = 0, size = 50 } = {}) {
  return request(`/api/auth/admin/audit?page=${page}&size=${size}`);
}

export function getUserSubmissions(userId) {
  return request(`/api/submissions/admin/users/${userId}`);
}
