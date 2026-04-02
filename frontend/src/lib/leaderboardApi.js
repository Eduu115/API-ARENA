import { getStoredTokens } from "./authApi.js";

function getBaseUrl() {
  const url = import.meta.env.VITE_LEADERBOARD_API_URL;
  if (!url) return "http://localhost:8087";
  return url.replace(/\/$/, "");
}

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
