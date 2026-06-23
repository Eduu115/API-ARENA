import { getStoredTokens } from "./authApi.js";
import { getApiBaseUrl } from "./apiBase.js";

// ws(s):// origin for the notifications socket. When the API base is relative
// (same-origin nginx/Vite proxy), derive it from the current page location.
function getWsOrigin() {
  const base = getApiBaseUrl();
  if (base) return base.replace(/^http/, "ws"); // http->ws, https->wss
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

/**
 * Opens a WebSocket to notification-service. JWT via query param (validated at handshake).
 * @param {{ onEvent?: (msg: { event?: string, notification?: unknown, unreadCount?: number }) => void }} [callbacks]
 * @returns {() => void} disconnect
 */
export function connectNotificationsWs(callbacks = {}) {
  const { onEvent } = callbacks;
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    return () => {};
  }
  const wsUrl =
    getWsOrigin() +
    "/ws/notifications?access_token=" +
    encodeURIComponent(tokens.accessToken);
  let ws;
  try {
    ws = new WebSocket(wsUrl);
  } catch {
    return () => {};
  }
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      onEvent?.(data);
    } catch {
      /* ignore */
    }
  };
  ws.onerror = () => {};
  return () => {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  };
}
