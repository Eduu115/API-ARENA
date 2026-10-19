import { lazy } from "react";

const RELOAD_KEY = "aa-chunk-reload";

/**
 * React.lazy that recovers from a stale hashed chunk (404 after a deploy).
 * One automatic full reload per tab; after that the error bubbles to the boundary.
 */
export function lazyWithRetry(importer) {
  return lazy(() =>
    importer()
      .then((mod) => {
        try {
          sessionStorage.removeItem(RELOAD_KEY);
        } catch {
          /* ignore */
        }
        return mod;
      })
      .catch((err) => {
        let already = false;
        try {
          already = sessionStorage.getItem(RELOAD_KEY) === "1";
        } catch {
          already = true;
        }
        if (!already) {
          try {
            sessionStorage.setItem(RELOAD_KEY, "1");
          } catch {
            /* ignore */
          }
          window.location.reload();
          return new Promise(() => {});
        }
        throw err;
      }),
  );
}
