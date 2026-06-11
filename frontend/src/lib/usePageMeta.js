import { useEffect } from "react";

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

/**
 * Per-route SEO meta for public pages (SPA — crawlers that execute JS pick these up).
 * `path` should start with "/" (e.g. "/challenges"); omit for the homepage.
 */
export function usePageMeta({ title, description, path = "/" } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Compete. Build. Conquer.`;
    document.title = fullTitle;
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
    }
    upsertMeta("property", "og:title", fullTitle);
    const url = `${SITE_URL}${path === "/" ? "/" : path}`;
    upsertMeta("property", "og:url", url);
    upsertCanonical(url);
  }, [title, description, path]);
}
