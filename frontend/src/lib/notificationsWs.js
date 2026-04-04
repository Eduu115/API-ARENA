import { getStoredTokens } from "./authApi.js";

function getBaseUrl() {
  const url = import.meta.env.VITE_NOTIFICATIONS_API_URL;
  if (!url) return "http://localhost:8090";
  return url.replace(/\/$/, "");
}

function httpToWsUrl(base) {
  if (base.startsWith("https://")) return "wss://" + base.slice(8);
  if (base.startsWith("http://")) return "ws://" + base.slice(7);
  return base;
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
    httpToWsUrl(getBaseUrl()) +
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
