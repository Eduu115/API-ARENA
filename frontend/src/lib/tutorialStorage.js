const PREFIX = "apiarena_tutorial_v1_";

export function isTutorialDone(tourKey) {
  try {
    return localStorage.getItem(PREFIX + tourKey) != null;
  } catch {
    return true;
  }
}

/** Persist completion (Next on last step) or skip. */
export function finishTutorial(tourKey, reason = "done") {
  try {
    localStorage.setItem(PREFIX + tourKey, reason);
  } catch {
    /* ignore */
  }
}

export function resetTutorialForDev(tourKey) {
  try {
    localStorage.removeItem(PREFIX + tourKey);
  } catch {
    /* ignore */
  }
}
