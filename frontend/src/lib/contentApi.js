import { getStoredTokens } from "./authApi.js";
import { getApiBaseUrl } from "./apiBase.js";

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const tokens = getStoredTokens();
  if (tokens?.accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
  const ct = res.headers.get("Content-Type") || "";
  let body = null;
  if (ct.includes("application/json")) {
    try { body = await res.json(); } catch { /* empty */ }
  } else if (!res.ok) {
    try { body = { message: await res.text() }; } catch { /* empty */ }
  }
  if (!res.ok) {
    const err = new Error(body?.message || body?.detail || res.statusText || "Request error");
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function listPosts(type, locale, page = 0) {
  const q = new URLSearchParams({ type, locale, page: String(page), size: "20" });
  return request(`/api/content/posts?${q}`);
}

export function getPost(slug, locale) {
  const q = new URLSearchParams({ locale });
  return request(`/api/content/posts/${encodeURIComponent(slug)}?${q}`);
}

export function getRoadmap(locale) {
  const q = new URLSearchParams({ locale });
  return request(`/api/content/roadmap?${q}`);
}

export function listAdminPosts({ type = "", status = "", page = 0 } = {}) {
  const q = new URLSearchParams({ page: String(page), size: "20" });
  if (type) q.set("type", type);
  if (status) q.set("status", status);
  return request(`/api/content/admin/posts?${q}`);
}

export function getAdminPost(id) {
  return request(`/api/content/admin/posts/${id}`);
}

export function createPost(payload) {
  return request("/api/content/admin/posts", { method: "POST", body: JSON.stringify(payload) });
}

export function updatePost(id, payload) {
  return request(`/api/content/admin/posts/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function publishPost(id) {
  return request(`/api/content/admin/posts/${id}/publish`, { method: "POST" });
}

export function archivePost(id) {
  return request(`/api/content/admin/posts/${id}/archive`, { method: "POST" });
}

export function retranslatePost(id) {
  return request(`/api/content/admin/posts/${id}/retranslate`, { method: "POST" });
}

export function importMarkdown(markdown) {
  return request("/api/content/admin/import", {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: markdown,
  });
}
