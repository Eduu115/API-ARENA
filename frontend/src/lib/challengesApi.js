import { getStoredTokens } from "./authApi.js";

// esta lib es oara abstraer el backend pero sobre todo, no tener que repetir las llamadas a la API en cada componente
// y asi tener un solo lugar para las llamadas a la API y el auth centralizado

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
    const message = body?.message || res.statusText || "Error en la petición";
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

export async function getChallengeBySlug(slug) {
  return request(`/api/challenges/slug/${slug}`);
}

export async function getFeaturedChallenges() {
  return request("/api/challenges/featured");
}

export async function getAllCategories() {
  return request("/api/challenges/categories");
}
