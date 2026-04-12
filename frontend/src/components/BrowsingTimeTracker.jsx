import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { postBrowsingUsage } from '../lib/authApi';
import {
  browsingLockSupported,
  isBrowsingLeader,
  releaseBrowsingLock,
  tryRenewBrowsingLock,
} from '../lib/browsingSessionLock';

const IDLE_MS = 5 * 60 * 1000;
const FLUSH_MS = 30_000;
const RENEW_MS = 500;

/**
 * Counts active time in at most one tab (leader lock). Only top-level window.
 * Visible tab + not idle + this tab holds the browsing lock.
 */
export default function BrowsingTimeTracker() {
  const { isAuthenticated, user } = useAuth();
  const pendingRef = useRef(0);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return undefined;
    if (!browsingLockSupported()) return undefined;

    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    /** Keep lease fresh while this tab is visible (even if user is idle / reading). */
    const renewIv = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        releaseBrowsingLock();
        return;
      }
      tryRenewBrowsingLock();
    }, RENEW_MS);

    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (!isBrowsingLeader()) return;
      if (Date.now() - lastActivityRef.current > IDLE_MS) return;
      pendingRef.current += 1;
    }, 1000);

    const flush = () => {
      let n = pendingRef.current;
      if (n <= 0) return;
      pendingRef.current = 0;
      const run = async () => {
        let left = n;
        while (left > 0) {
          const chunk = Math.min(120, left);
          left -= chunk;
          try {
            await postBrowsingUsage(chunk);
          } catch {
            pendingRef.current += left + chunk;
            return;
          }
        }
      };
      void run();
    };

    const flushIv = setInterval(flush, FLUSH_MS);

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        releaseBrowsingLock();
        flush();
      } else {
        tryRenewBrowsingLock();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);

    tryRenewBrowsingLock();

    return () => {
      clearInterval(renewIv);
      clearInterval(tick);
      clearInterval(flushIv);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
      releaseBrowsingLock();
      flush();
    };
  }, [isAuthenticated, user?.id]);

  return null;
}
