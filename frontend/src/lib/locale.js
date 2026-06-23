import { hasPreferenceConsent } from './cookieConsent.js';

export const APP_LOCALE_KEY = 'apiarena_locale';
/** @deprecated Legacy key — migrated on read */
const LEGACY_DOCS_LOCALE_KEY = 'apiarena_docs_locale';
export const APP_LOCALE_CHANGED = 'apiarena:locale-changed';

/** @typedef {'en' | 'es'} AppLocale */

/** @returns {AppLocale} */
export function detectBrowserLocale() {
  try {
    const langs = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    for (const lang of langs) {
      const code = String(lang || '').toLowerCase().split('-')[0];
      if (code === 'es') return 'es';
    }
  } catch {
    /* ignore */
  }
  return 'en';
}

/** @param {string | null | undefined} value @returns {AppLocale | null} */
function normalizeLocale(value) {
  if (value === 'es') return 'es';
  if (value === 'en') return 'en';
  return null;
}

/** @returns {AppLocale | null} */
export function readStoredAppLocale() {
  if (!hasPreferenceConsent()) {
    return null;
  }
  try {
    const stored = normalizeLocale(localStorage.getItem(APP_LOCALE_KEY));
    if (stored) return stored;

    const legacy = normalizeLocale(localStorage.getItem(LEGACY_DOCS_LOCALE_KEY));
    if (legacy) {
      localStorage.setItem(APP_LOCALE_KEY, legacy);
      localStorage.removeItem(LEGACY_DOCS_LOCALE_KEY);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Initial locale: stored preference, else browser detection. */
export function resolveInitialLocale() {
  return readStoredAppLocale() ?? detectBrowserLocale();
}

/** @param {AppLocale} locale */
export function persistAppLocale(locale) {
  if (!hasPreferenceConsent()) {
    return;
  }
  try {
    localStorage.setItem(APP_LOCALE_KEY, locale === 'es' ? 'es' : 'en');
    localStorage.removeItem(LEGACY_DOCS_LOCALE_KEY);
  } catch {
    /* ignore */
  }
}

/** @param {AppLocale} locale */
export function setAppLocale(locale) {
  const next = locale === 'es' ? 'es' : 'en';
  persistAppLocale(next);
  try {
    document.documentElement.lang = next;
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(APP_LOCALE_CHANGED, { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearAppLocaleStorage() {
  try {
    localStorage.removeItem(APP_LOCALE_KEY);
    localStorage.removeItem(LEGACY_DOCS_LOCALE_KEY);
  } catch {
    /* ignore */
  }
}
