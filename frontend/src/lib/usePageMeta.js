import { useEffect } from "react";
import i18n from "../i18n/index.js";
import { localePath } from "./localeRoutes.js";

const SITE_NAME = "API Arena";
const SITE_URL = "https://apiarena.net";

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertHreflang(hreflang, href) {
  let el = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function clearHreflangAlternates() {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
}

/**
 * Per-route SEO meta for public pages (SPA — crawlers that execute JS pick these up).
 * `path` should start with "/" without locale prefix (e.g. "/challenges").
 */
export function usePageMeta({ title, description, path = "/", locale = "en" } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Compete. Build. Conquer.`;
    document.title = fullTitle;
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
    }
    upsertMeta("property", "og:title", fullTitle);

    const loc = (locale || i18n.language)?.startsWith("es") ? "es" : "en";
    const logicalPath = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
    const url = `${SITE_URL}${localePath(loc, logicalPath)}`;
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:locale", loc === "es" ? "es_ES" : "en_US");
    upsertMeta("property", "og:locale:alternate", loc === "es" ? "en_US" : "es_ES");
    upsertCanonical(url);

    clearHreflangAlternates();
    upsertHreflang("en", `${SITE_URL}${localePath("en", logicalPath)}`);
    upsertHreflang("es", `${SITE_URL}${localePath("es", logicalPath)}`);
    upsertHreflang("x-default", `${SITE_URL}${localePath("en", logicalPath)}`);
  }, [title, description, path, locale]);
}
