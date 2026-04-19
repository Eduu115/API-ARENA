import { useEffect, useMemo, useState } from 'react';

/**
 * Milliseconds until ISO instant (UTC). Updates every second while mounted.
 * @param {string | null | undefined} iso
 * @returns {number | null} null if no iso
 */
export function useMsUntilIso(iso) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!iso) return undefined;
    const iv = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [iso]);

  return useMemo(() => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return Math.max(0, t - Date.now());
  }, [iso, tick]);
}

/** HH:MM:SS or Nd HH:MM:SS for long windows. */
export function formatCountdownMs(ms) {
  const secTotal = Math.floor(ms / 1000);
  const days = Math.floor(secTotal / 86400);
  const h = Math.floor((secTotal % 86400) / 3600);
  const m = Math.floor((secTotal % 3600) / 60);
  const s = secTotal % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) {
    return `${days}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
