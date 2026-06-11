import { hasPreferenceConsent } from "./cookieConsent";

const PREFIX = "apiarena_tutorial_v1_";

function storageKey(tourKey, userId) {
  const base = PREFIX + tourKey;
  return userId != null ? `${base}_u${userId}` : base;
}

export function isTutorialDone(tourKey, userId = null) {
  try {
    return localStorage.getItem(storageKey(tourKey, userId)) != null;
  } catch {
    return true;
  }
}

/** Persist completion (Next on last step) or skip. Only if preference consent was given. */
export function finishTutorial(tourKey, reason = "done", userId = null) {
  if (!hasPreferenceConsent()) {
    return;
  }
  try {
    localStorage.setItem(storageKey(tourKey, userId), reason);
  } catch {
    /* ignore */
  }
}

export function resetTutorialForDev(tourKey, userId = null) {
  try {
    localStorage.removeItem(storageKey(tourKey, userId));
  } catch {
    /* ignore */
  }
}
