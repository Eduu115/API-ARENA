import { resolveInitialLocale } from './locale.js';

/** @typedef {'en' | 'es'} AppLocale */

export const LOCALES = /** @type {const} */ (['en', 'es']);
export const DEFAULT_LOCALE = 'en';

/** @param {string | null | undefined} value @returns {value is AppLocale} */
export function isValidLocale(value) {
  return value === 'en' || value === 'es';
}

/**
 * Split a pathname into locale prefix and logical app path (without locale).
 * @param {string} pathname
 * @returns {{ locale: AppLocale | null, path: string }}
 */
export function parsePathname(pathname) {
  const raw = pathname || '/';
  const match = raw.match(/^\/(en|es)(\/|$)/);
  if (!match) {
    return { locale: null, path: raw.startsWith('/') ? raw : `/${raw}` };
  }
  const locale = /** @type {AppLocale} */ (match[1]);
  const rest = raw.slice(match[0].length - 1) || '/';
  return { locale, path: rest.startsWith('/') ? rest : `/${rest}` };
}

/**
 * Build a locale-prefixed path for react-router.
 * @param {AppLocale | string} locale
 * @param {string} path logical path starting with /
 */
export function localePath(locale, path = '/') {
  const loc = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const raw = path.startsWith('/') ? path : `/${path}`;
  const qIndex = raw.search(/[?#]/);
  const pathname = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const suffix = qIndex === -1 ? '' : raw.slice(qIndex);
  if (pathname === '/') return `/${loc}${suffix}`;
  return `/${loc}${pathname}${suffix}`;
}

/** @returns {AppLocale} */
export function resolveEntryLocale() {
  return resolveInitialLocale();
}

/**
 * Strip locale prefix from pathname for active-link comparisons.
 * @param {string} pathname
 */
export function stripLocalePathname(pathname) {
  return parsePathname(pathname).path;
}
