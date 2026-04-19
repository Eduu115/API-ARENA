import { getStoredTokens } from "./authApi.js";

// This client centralizes challenge API calls and auth headers.

function getBaseUrl() {
  const url = import.meta.env.VITE_CHALLENGES_API_URL;
  if (!url) {
    return "http://localhost:8082";
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
    } catch {}
  }
  if (!res.ok) {
    const message = body?.message || res.statusText || "Request error";
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function getChallenges(filters = {}) {
  const params = new URLSearchParams();
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return request(`/api/challenges${qs ? `?${qs}` : ""}`);
}

export async function getChallengeById(id) {
  return request(`/api/challenges/${id}`);
}

/** Public card / detail: no endpoints, test suite, or hints. */
export async function getChallengePreview(id) {
  return request(`/api/challenges/${id}/preview`);
}

/** Full specs for submit flow — requires JWT. */
export async function getChallengeSpecs(id) {
  return request(`/api/challenges/${id}/specs`);
}

export async function getChallengeBySlug(slug) {
  return request(`/api/challenges/slug/${slug}`);
}

export async function getChallengePreviewBySlug(slug) {
  return request(`/api/challenges/slug/${encodeURIComponent(slug)}/preview`);
}

export async function getFeaturedChallenges() {
  return request("/api/challenges/featured");
}

export async function getAllCategories() {
  return request("/api/challenges/categories");
}

export async function getCategories() {
  return request("/api/categories");
}

export async function createChallenge(payload) {
  return request("/api/challenges", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateChallenge(id, payload) {
  return request(`/api/challenges/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getMyChallenges({ includeInactive = true } = {}) {
  const qs = new URLSearchParams();
  qs.set("includeInactive", includeInactive ? "true" : "false");
  return request(`/api/challenges/mine?${qs.toString()}`);
}
