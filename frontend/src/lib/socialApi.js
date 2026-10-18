import { getStoredTokens } from "./authApi.js";
import { getApiBaseUrl as getBaseUrl } from "./apiBase.js";

async function request(path, options = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const error = new Error(text || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}

export function getSocialStatus() {
  return request("/api/social/status");
}

export function getFeed({ tab = "all", cursor, limit = 20 } = {}) {
  const sp = new URLSearchParams();
  sp.set("tab", tab);
  sp.set("limit", String(limit));
  if (cursor) sp.set("cursor", cursor);
  return request(`/api/social/feed?${sp.toString()}`);
}

export function publishPost(submissionId, caption) {
  return request("/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ submissionId, caption: caption || null }),
  });
}

export function deletePost(id) {
  return request(`/api/social/posts/${id}`, { method: "DELETE" });
}

export function toggleReaction(targetType, targetId, reaction) {
  return request("/api/social/reactions", {
    method: "POST",
    body: JSON.stringify({ targetType, targetId, reaction }),
  });
}

export function reportEntry(targetType, targetId, reason) {
  return request("/api/social/reports", {
    method: "POST",
    body: JSON.stringify({ targetType, targetId, reason: reason || null }),
  });
}

export function getSocialPrivacy() {
  return request("/api/social/me/privacy");
}

export function updateSocialPrivacy(body) {
  return request("/api/social/me/privacy", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function hideEntry(targetType, targetId) {
  return request("/api/social/admin/hide", {
    method: "POST",
    body: JSON.stringify({ targetType, targetId }),
  });
}

export function adminDeletePost(id) {
  return request(`/api/social/admin/posts/${id}`, { method: "DELETE" });
}
