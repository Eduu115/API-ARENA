/**
 * First-party storage consent (LSSI-CE art. 22.2 / GDPR).
 *
 * API Arena uses no third-party tracking or advertising. We only use:
 *  - necessary: auth session, in-progress challenge session/timer, tab lock (never optional).
 *  - preferences: theme and tutorial/onboarding state (opt-in).
 *  - analytics: reserved for future product analytics (currently unused; opt-in).
 *
 * The consent record itself is exempt from consent (needed to honor the law).
 */

const KEY = "apiarena_cookie_consent";
export const CONSENT_VERSION = "1.0";

export const CONSENT_CHANGED_EVENT = "apiarena:cookie-consent-changed";
export const OPEN_CONSENT_EVENT = "apiarena:open-cookie-consent";

const THEME_KEY = "apiarena_theme";
const TUTORIAL_PREFIX = "apiarena_tutorial_v1_";

export function getConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Re-ask if the policy/consent version changed.
    if (!data || data.version !== CONSENT_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function hasDecision() {
  return getConsent() != null;
}

export function hasPreferenceConsent() {
  const c = getConsent();
  return !!(c && c.preferences);
}

export function hasAnalyticsConsent() {
  const c = getConsent();
  return !!(c && c.analytics);
}

export function setConsent({ preferences = false, analytics = false } = {}) {
  const data = {
    version: CONSENT_VERSION,
    necessary: true,
    preferences: !!preferences,
    analytics: !!analytics,
    ts: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
  // Withdrawn preference consent: remove preference-scoped storage.
  if (!data.preferences) {
    clearPreferenceStorage();
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: data }));
  } catch {
    /* ignore */
  }
  return data;
}

export function acceptAll() {
  return setConsent({ preferences: true, analytics: true });
}

export function rejectNonEssential() {
  return setConsent({ preferences: false, analytics: false });
}

export function openConsentManager() {
  try {
    window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
  } catch {
    /* ignore */
  }
}

function clearPreferenceStorage() {
  try {
    localStorage.removeItem(THEME_KEY);
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(TUTORIAL_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    /* ignore */
  }
}
