import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { getTurnstileSiteKey, isTurnstileEnabled } from '../lib/turnstile';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstileScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed'));
    document.head.appendChild(script);
  });
}

const TurnstileWidget = forwardRef(function TurnstileWidget({ onToken }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      onToken?.(null);
    },
  }));

  useEffect(() => {
    if (!isTurnstileEnabled()) return undefined;

    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current != null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: getTurnstileSiteKey(),
        theme: 'dark',
        callback: (token) => onToken?.(token),
        'expired-callback': () => onToken?.(null),
        'error-callback': () => onToken?.(null),
      });
    };

    loadTurnstileScript()
      .then(() => {
        if (!cancelled) render();
      })
      .catch(() => onToken?.(null));

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken]);

  if (!isTurnstileEnabled()) return null;

  return <div className="auth-turnstile" ref={containerRef} aria-hidden={false} />;
});

export default TurnstileWidget;
