// TODO(content): official Gubia logo kit. URL is https://gubiadigital.es
export const GUBIA_URL = "https://gubiadigital.es";

export const GUBIA_NAME = "Gubia";
export const GUBIA_WORDMARK = "/brand/gubia/wordmark.svg";
export const GUBIA_WORDMARK_WIDTH = 72;
export const GUBIA_WORDMARK_HEIGHT = 18;

/** Placeholder href until GUBIA_URL is an absolute site. */
export function gubiaHref() {
  const url = typeof GUBIA_URL === "string" ? GUBIA_URL.trim() : "";
  return url || "#";
}

/** Absolute URL for JSON-LD, or null while the official site is unknown. */
export function gubiaUrlOrNull() {
  const url = typeof GUBIA_URL === "string" ? GUBIA_URL.trim() : "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : null;
}
