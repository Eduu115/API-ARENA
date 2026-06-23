import { getStoredTokens } from "./authApi.js";
import { getApiBaseUrl as getBaseUrl } from "./apiBase.js";

async function request(path, options = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}

/** @param {{ page?: number, size?: number, unreadOnly?: boolean, minImportance?: 'INFO'|'REMINDER'|'ALERTS'|'IMPORTANT' }} [params] */
export function getMyNotifications(params = {}) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.size != null) sp.set("size", String(params.size));
  if (params.unreadOnly === true) sp.set("unreadOnly", "true");
  if (params.unreadOnly === false) sp.set("unreadOnly", "false");
  if (params.minImportance) sp.set("minImportance", params.minImportance);
  const q = sp.toString();
  return request(`/api/notifications/me${q ? `?${q}` : ""}`);
}

export function getUnreadNotificationCount() {
  return request("/api/notifications/unread-count");
}

export function markNotificationRead(id) {
  return request(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return request("/api/notifications/read-all", { method: "POST" });
}
