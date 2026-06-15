import { DOC_DOCUMENTS as DOC_DOCUMENTS_EN } from './docsContent.en.js';
import { DOC_DOCUMENTS as DOC_DOCUMENTS_ES } from './docsContent.es.js';

const DOCS_BY_LOCALE = {
  en: DOC_DOCUMENTS_EN,
  es: DOC_DOCUMENTS_ES,
};

/** @param {'en'|'es'} locale */
export function getDocDocuments(locale) {
  return DOCS_BY_LOCALE[locale === 'es' ? 'es' : 'en'] || DOC_DOCUMENTS_EN;
}

/** @param {'en'|'es'} locale */
export function getDocByIdMap(locale) {
  const docs = getDocDocuments(locale);
  return docs.reduce((acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {});
}

/** Default export for backward compatibility (English). */
export const DOC_DOCUMENTS = DOC_DOCUMENTS_EN;
export const DOC_BY_ID = getDocByIdMap('en');
