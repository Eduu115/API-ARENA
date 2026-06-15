import { CONSENT_CHANGED_EVENT, hasPreferenceConsent } from './cookieConsent.js';

export const DOCS_LOCALE_KEY = 'apiarena_docs_locale';
export const DOCS_LOCALE_CHANGED = 'apiarena:docs-locale-changed';

/** @typedef {'en' | 'es'} DocsLocale */

/** @returns {DocsLocale | null} */
export function readStoredDocsLocale() {
  if (!hasPreferenceConsent()) {
    return null;
  }
  try {
    const stored = localStorage.getItem(DOCS_LOCALE_KEY);
    if (stored === 'es') return 'es';
    if (stored === 'en') return 'en';
    return null;
  } catch {
    return null;
  }
}

/** @param {DocsLocale} locale */
export function persistDocsLocale(locale) {
  if (!hasPreferenceConsent()) {
    return;
  }
  try {
    localStorage.setItem(DOCS_LOCALE_KEY, locale === 'es' ? 'es' : 'en');
  } catch {
    /* ignore */
  }
}

export function clearDocsLocaleStorage() {
  try {
    localStorage.removeItem(DOCS_LOCALE_KEY);
  } catch {
    /* ignore */
  }
}
