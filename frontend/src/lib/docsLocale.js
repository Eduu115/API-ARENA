export {
  APP_LOCALE_KEY as DOCS_LOCALE_KEY,
  APP_LOCALE_CHANGED as DOCS_LOCALE_CHANGED,
  readStoredAppLocale as readStoredDocsLocale,
  persistAppLocale as persistDocsLocale,
  clearAppLocaleStorage as clearDocsLocaleStorage,
  detectBrowserLocale,
  resolveInitialLocale,
  setAppLocale,
} from './locale.js';
