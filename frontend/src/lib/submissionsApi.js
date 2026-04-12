import { getStoredTokens } from "./authApi.js";

function getBaseUrl() {
  const url = import.meta.env.VITE_SUBMISSIONS_API_URL;
  if (!url) {
    return "http://localhost:8083";
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
    } catch {
      /* empty */
    }
  }
  if (!res.ok) {
    const message =
      body?.detail ||
      body?.message ||
      (typeof body?.error === "string" ? body.error : null) ||
      res.statusText ||
      "Request error";
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/** Attempt policy (cooldown + max per UTC day) for a challenge. */
export async function getChallengeAttemptStatus(challengeId) {
  return request(`/api/submissions/challenge/${challengeId}/attempt-status`);
}

/** Current user submission list (requires JWT). */
export async function getMySubmissions() {
  return request("/api/submissions/my");
}

/** Build and test logs for a submission. */
export async function getSubmissionLogs(id) {
  return request(`/api/submissions/${id}/logs`);
}

/** Structured replay timeline for a submission. */
export async function getSubmissionReplay(id) {
  return request(`/api/submissions/${id}/replay`);
}

/** Submission detail (score, status, etc.). */
export async function getSubmissionById(id) {
  return request(`/api/submissions/${id}`);
}

/** Upload ZIP and create submission (multipart/form-data). */
export async function createSubmission(challengeId, file, developmentTimeSeconds) {
  const base = getBaseUrl();
  const tokens = getStoredTokens();
  const form = new FormData();
  form.append("challengeId", challengeId);
  form.append("file", file);
  const headers = {};
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const params = new URLSearchParams();
  params.set("challengeId", String(challengeId));
  if (developmentTimeSeconds != null && developmentTimeSeconds > 0) {
    params.set("developmentTimeSeconds", String(Math.floor(developmentTimeSeconds)));
  }
  const res = await fetch(`${base}/api/submissions?${params.toString()}`, {
    method: "POST",
    headers,
    body: form,
  });
  const ct = res.headers.get("Content-Type") || "";
  let body = null;
  if (ct.includes("application/json")) {
    try { body = await res.json(); } catch { /* */ }
  }
  if (!res.ok) {
    const message =
      body?.detail ||
      body?.message ||
      (typeof body?.error === "string" ? body.error : null) ||
      res.statusText ||
      "Submission failed";
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}
