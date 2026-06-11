import { hasPreferenceConsent } from "./cookieConsent";

const PREFIX = "apiarena_tutorial_v1_";
const SESSION_PREFIX = "apiarena_tutorial_sess_v1_";

/** In-tab dismiss so Skip works even when storage is blocked. */
const memoryDone = new Set();

function storageKey(tourKey, userId) {
  const base = PREFIX + tourKey;
  return userId != null ? `${base}_u${userId}` : base;
}

function sessionStorageKey(tourKey, userId) {
  const base = SESSION_PREFIX + tourKey;
  return userId != null ? `${base}_u${userId}` : base;
}

function markMemoryDone(...keys) {
  keys.forEach((k) => memoryDone.add(k));
}

function readDone(key, sessionKey) {
  if (memoryDone.has(key) || memoryDone.has(sessionKey)) {
    return true;
  }
  try {
    if (localStorage.getItem(key) != null) return true;
    if (sessionStorage.getItem(sessionKey) != null) return true;
  } catch {
    return true;
  }
  return false;
}

export function isTutorialDone(tourKey, userId = null) {
  const key = storageKey(tourKey, userId);
  const sessKey = sessionStorageKey(tourKey, userId);
  if (readDone(key, sessKey)) {
    return true;
  }
  // Skip may have been saved before auth user id was ready.
  if (userId != null) {
    const anonKey = storageKey(tourKey, null);
    const anonSess = sessionStorageKey(tourKey, null);
    return readDone(anonKey, anonSess);
  }
  return false;
}

/**
 * Persist completion or skip.
 * Session storage always (dismiss must work without preference consent).
 * localStorage only when preference consent was given (cross-session).
 */
export function finishTutorial(tourKey, reason = "done", userId = null) {
  const key = storageKey(tourKey, userId);
  const sessKey = sessionStorageKey(tourKey, userId);
  markMemoryDone(key, sessKey);
  if (userId != null) {
    markMemoryDone(storageKey(tourKey, null), sessionStorageKey(tourKey, null));
  }
  try {
    sessionStorage.setItem(sessKey, reason);
    if (hasPreferenceConsent()) {
      localStorage.setItem(key, reason);
    }
  } catch {
    /* ignore */
  }
}

export function resetTutorialForDev(tourKey, userId = null) {
  const key = storageKey(tourKey, userId);
  const sessKey = sessionStorageKey(tourKey, userId);
  memoryDone.delete(key);
  memoryDone.delete(sessKey);
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(sessKey);
  } catch {
    /* ignore */
  }
}
