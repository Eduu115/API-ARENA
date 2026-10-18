import { useEffect } from "react";
import i18n from "../i18n/index.js";
import { useAppLocale } from "../routes/LocaleLayout.jsx";
import { buildHeadMeta, graph, siteNodes } from "../seo/site.js";

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

function upsertJsonLd(data) {
  let el = document.getElementById("seo-jsonld");
  if (!el) {
    el = document.createElement("script");
    el.id = "seo-jsonld";
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Per-route SEO meta. `path` is the logical path without a locale prefix.
 * Canonical and hreflang follow the URL locale (`/en` and `/es`), not a hardcoded default.
 */
export function usePageMeta({ title, description, path = "/", locale, jsonLd = null } = {}) {
  const { locale: routeLocale } = useAppLocale();
  const lang = (locale || routeLocale || i18n.language || "en").startsWith("es") ? "es" : "en";
  const jsonLdJson = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const meta = buildHeadMeta({ title, description, path, locale: lang });
    document.title = meta.title;
    document.documentElement.lang = meta.htmlLang;
    if (meta.description) upsertMeta("name", "description", meta.description);
    upsertMeta("name", "robots", meta.robots);
    upsertCanonical(meta.canonical);

    clearHreflangAlternates();
    Object.entries(meta.hreflang).forEach(([hreflang, href]) => upsertHreflang(hreflang, href));
    Object.entries(meta.openGraph).forEach(([key, value]) => {
      if (value) upsertMeta("property", key, value);
    });
    Object.entries(meta.twitter).forEach(([key, value]) => {
      if (value) upsertMeta("name", key, value);
    });

    upsertJsonLd(jsonLdJson ? JSON.parse(jsonLdJson) : graph(siteNodes(lang)));
  }, [title, description, path, lang, jsonLdJson]);
}
