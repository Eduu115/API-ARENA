// Single API origin for every client.
// Prod/Docker: empty string => same-origin; nginx proxies /api/* and /ws/* to each service.
// Dev: empty too => Vite dev server proxies /api and /ws to localhost ports (see vite.config.js).
// Set VITE_API_BASE_URL only to hit a backend on another origin directly.
export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
}
