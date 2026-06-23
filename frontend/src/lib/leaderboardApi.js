import { getStoredTokens } from "./authApi.js";
import { getApiBaseUrl as getBaseUrl } from "./apiBase.js";

async function request(path) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = { "Content-Type": "application/json" };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}

export function getGlobalLeaderboard() {
  return request("/api/leaderboard/global");
}

export function getChallengeLeaderboard(challengeId) {
  return request(`/api/leaderboard/challenge/${challengeId}`);
}

export function getUserPosition(challengeId, userId) {
  return request(`/api/leaderboard/challenge/${challengeId}/user/${userId}`);
}

/** Global leaderboard position for a user (404 if no entries). */
export async function getGlobalUserRank(userId) {
  const base = getBaseUrl();
  const url = `${base}/api/leaderboard/global/user/${userId}`;
  const tokens = getStoredTokens();
  const headers = { "Content-Type": "application/json" };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
