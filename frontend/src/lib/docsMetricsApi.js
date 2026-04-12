import { getStoredTokens } from "./authApi.js";

function getMetricsBaseUrl() {
  const url = import.meta.env.VITE_METRICS_API_URL;
  if (!url) {
    return "http://localhost:8089";
  }
  return url.replace(/\/$/, "");
}

async function request(path, options = {}) {
  const base = getMetricsBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const tokens = getStoredTokens();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (tokens?.accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get("Content-Type") || "";
  let body = null;
  if (contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch {
      // ignore parse errors for non-json responses
    }
  }
  if (!response.ok) {
    const error = new Error(body?.message || response.statusText || "Request failed");
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export async function submitDocsFeedback(payload) {
  return request("/api/metrics/docs-feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDocsFeedbackSummary() {
  return request("/api/metrics/docs-feedback/summary");
}
