import { getStoredTokens } from "./authApi.js";

function getBaseUrl() {
  const url = import.meta.env.VITE_AUTH_API_URL;
  if (!url) return "http://localhost:8081";
  return url.replace(/\/$/, "");
}

async function request(path, options = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = { "Content-Type": "application/json", ...options.headers };
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

export function getMyGroups() {
  return request("/api/groups");
}

export function getGroupById(id) {
  return request(`/api/groups/${id}`);
}

export function createGroup(data) {
  return request("/api/groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGroup(id, data) {
  return request(`/api/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteGroup(id) {
  return request(`/api/groups/${id}`, { method: "DELETE" });
}

export function addMember(groupId, userId) {
  return request(`/api/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function removeMember(groupId, userId) {
  return request(`/api/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function searchStudents(query) {
  if (!query || query.trim().length < 2) return Promise.resolve([]);
  return request(`/api/groups/search-students?q=${encodeURIComponent(query.trim())}`);
}
