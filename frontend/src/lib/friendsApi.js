import { getStoredTokens } from "./authApi.js";
import { getApiBaseUrl as getBaseUrl } from "./apiBase.js";

async function request(path, options = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  const ct = res.headers.get("Content-Type") || "";
  const isJson = ct.includes("application/json");
  if (!res.ok) {
    if (isJson) {
      const j = await res.json().catch(() => ({}));
      const msg = j.error || j.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    return null;
  }
  if (isJson) return res.json();
  return null;
}

export function getFriends() {
  return request("/api/friends");
}

export function getPendingFriends() {
  return request("/api/friends/pending");
}

export function searchFriends(q) {
  if (!q || q.trim().length < 2) return Promise.resolve([]);
  return request(`/api/friends/search?q=${encodeURIComponent(q.trim())}`);
}

export function sendFriendRequest(userId) {
  return request("/api/friends/request", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function acceptFriendRequest(friendshipId) {
  return request(`/api/friends/request/${friendshipId}/accept`, {
    method: "POST",
  });
}

export function cancelFriendRequest(friendshipId) {
  return request(`/api/friends/request/${friendshipId}`, {
    method: "DELETE",
  });
}

export function removeFriend(peerUserId) {
  return request(`/api/friends/${peerUserId}`, {
    method: "DELETE",
  });
}

/** Relationship with another user: NONE | FRIEND | PENDING_OUTGOING | PENDING_INCOMING | SELF */
export function getFriendshipStatus(userId) {
  return request(`/api/friends/status/${userId}`);
}
