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

/** Teacher: list submissions from one student limited to teacher-owned challenges. */
export async function getTeacherStudentSubmissions(studentId) {
  return request(`/api/submissions/teacher/students/${studentId}`);
}

/** Teacher: all submissions for one challenge (any student), if the challenge belongs to the teacher. */
export async function getTeacherChallengeSubmissions(challengeId) {
  return request(`/api/submissions/teacher/challenges/${challengeId}/submissions`);
}

/** Teacher: count submissions by student IDs limited to teacher-owned challenges. */
export async function getTeacherStudentsSubmissionCounts(studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) return {};
  const params = new URLSearchParams();
  studentIds.forEach((id) => {
    if (id != null) params.append("studentIds", String(id));
  });
  return request(`/api/submissions/teacher/students/counts?${params.toString()}`);
}

/** Download submission ZIP (current user must have access). */
export async function downloadSubmissionZip(submissionId) {
  const base = getBaseUrl();
  const tokens = getStoredTokens();
  const headers = {};
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(`${base}/api/submissions/${submissionId}/download`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Download failed (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/i);
  const filename = match?.[1] || `submission-${submissionId}.zip`;
  const zipDownloadExpiresAt = res.headers.get("X-Zip-Download-Expires-At") || null;
  return { blob, filename, zipDownloadExpiresAt };
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

/** Teacher: apply a single score penalty (predefined or OTHER). Prefer {@link confirmTeacherPenalties} for draft batch. */
export async function applyTeacherPenalty(submissionId, body) {
  return request(`/api/submissions/${submissionId}/teacher/penalty`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Teacher: confirm multiple penalties in one request (same confirmation timestamp). */
export async function confirmTeacherPenalties(submissionId, body) {
  return request(`/api/submissions/${submissionId}/teacher/penalties/confirm`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Teacher: revoke a penalty within the 2h window after it was confirmed (requires penalty `id` from API). */
export async function revokeTeacherPenalty(submissionId, penaltyId) {
  return request(`/api/submissions/${submissionId}/teacher/penalty/${encodeURIComponent(penaltyId)}`, {
    method: "DELETE",
  });
}

/** Teacher: set manual scores by part (only for students in your groups). */
export async function applyTeacherManualScores(submissionId, body) {
  return request(`/api/submissions/${submissionId}/teacher/manual-scores`, {
    method: "POST",
    body: JSON.stringify(body),
  });
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
