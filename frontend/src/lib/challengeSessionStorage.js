/**
 * Sesión de challenge: el timer usa `deadlineAt` (epoch ms) para que el tiempo
 * siga corriendo aunque cierres la pestaña o cambies de vista.
 */

export function notifyChallengeSessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("apiarena-challenge-session-change"));
}

export function challengeSessionKey(userId) {
  return `apiarena_challenge_progress_${userId}`;
}

/** Resuelve deadline desde JSON guardado (incluye migración de formato antiguo). */
export function resolveDeadlineAtMs(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.deadlineAt != null && !Number.isNaN(Number(raw.deadlineAt))) {
    return Number(raw.deadlineAt);
  }
  if (raw.secondsLeft != null) {
    const sec = Math.max(0, Number(raw.secondsLeft));
    return Date.now() + sec * 1000;
  }
  return null;
}

/** Segundos restantes ahora mismo (reloj en marcha). */
export function computeSecondsLeftFromDeadline(deadlineAtMs) {
  if (deadlineAtMs == null || Number.isNaN(deadlineAtMs)) return 0;
  return Math.max(0, Math.floor((deadlineAtMs - Date.now()) / 1000));
}

export function getChallengeSession(userId) {
  if (userId == null) return null;
  try {
    const raw = localStorage.getItem(challengeSessionKey(userId));
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.challengeId == null) return null;
    const deadlineAt = resolveDeadlineAtMs(s);
    const totalSeconds = Number(s.totalSeconds) || 0;
    const secondsLeft = computeSecondsLeftFromDeadline(deadlineAt);
    const timerDone = secondsLeft <= 0;
    return {
      challengeId: String(s.challengeId),
      deadlineAt,
      totalSeconds,
      secondsLeft,
      timerDone,
      challengeTitle: typeof s.challengeTitle === "string" ? s.challengeTitle : "",
      savedAt: typeof s.savedAt === "number" ? s.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/** Persiste sesión; `deadlineAt` es fijo hasta que termina el challenge o se abandona. */
export function setChallengeSession(userId, payload) {
  if (userId == null) return;
  localStorage.setItem(challengeSessionKey(userId), JSON.stringify(payload));
}

export function clearChallengeSession(userId) {
  if (userId == null) return;
  localStorage.removeItem(challengeSessionKey(userId));
  notifyChallengeSessionChanged();
}
