const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();

export function isTurnstileEnabled() {
  return SITE_KEY.length > 0;
}

export function getTurnstileSiteKey() {
  return SITE_KEY;
}
