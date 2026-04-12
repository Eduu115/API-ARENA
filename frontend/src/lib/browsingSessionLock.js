/**
 * Single-tab leader lock for browsing metrics (same origin).
 * Uses localStorage lease + per-tab id in sessionStorage so only one tab renews the lock.
 * Not a security boundary (localStorage is user-controlled); server caps still apply.
 */

const LOCK_KEY = 'apiarena_browsing_lock_v1';
const LOCK_TTL_MS = 4500;

function getTabId() {
  if (typeof sessionStorage === 'undefined') return 'no-session';
  let id = sessionStorage.getItem('apiarena_tab_id');
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('apiarena_tab_id', id);
  }
  return id;
}

const TAB_ID = getTabId();

function writeLock(obj) {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(obj));
  } catch {
    /* private mode / quota */
  }
}

/**
 * Acquires the lock if expired, or renews if this tab already owns it.
 * Returns false if another tab holds a valid lease.
 */
export function tryRenewBrowsingLock() {
  const now = Date.now();
  let raw = null;
  try {
    raw = localStorage.getItem(LOCK_KEY);
  } catch {
    return false;
  }
  let lock = null;
  try {
    lock = raw ? JSON.parse(raw) : null;
  } catch {
    return false;
  }
  if (!lock || typeof lock.expiresAt !== 'number' || lock.expiresAt < now) {
    writeLock({ tabId: TAB_ID, expiresAt: now + LOCK_TTL_MS });
    return true;
  }
  if (lock.tabId === TAB_ID) {
    writeLock({ tabId: TAB_ID, expiresAt: now + LOCK_TTL_MS });
    return true;
  }
  return false;
}

/** Call when this tab hides or unloads so another tab can take the lock immediately. */
export function releaseBrowsingLock() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return;
    const lock = JSON.parse(raw);
    if (lock.tabId === TAB_ID) {
      localStorage.removeItem(LOCK_KEY);
    }
  } catch {
    /* */
  }
}

export function isBrowsingLeader() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return false;
    const lock = JSON.parse(raw);
    const now = Date.now();
    return lock.tabId === TAB_ID && lock.expiresAt >= now;
  } catch {
    return false;
  }
}

export function browsingLockSupported() {
  return typeof window !== 'undefined' && window.self === window.top;
}
