import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import BottomNav from "../components/BottomNav";
import CustomCursor from "../components/CustomCursor";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/notificationsApi";
import { connectNotificationsWs } from "../lib/notificationsWs";
import "./challenges/challenges.css";
import "./notifications.css";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyNotifications({ page: 0, size: 50 });
      if (!cancelledRef.current) setPage(data);
    } catch (e) {
      if (!cancelledRef.current) setError(e?.message || "Failed to load notifications");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    load();
    const disconnect = connectNotificationsWs({
      onEvent: (msg) => {
        if (msg?.event === "NEW_NOTIFICATION") {
          load();
        }
      },
    });
    return () => {
      cancelledRef.current = true;
      disconnect();
    };
  }, [load]);

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      await load();
    } catch (e) {
      setError(e?.message || "Could not update");
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      await load();
    } catch (e) {
      setError(e?.message || "Could not update");
    }
  }

  const items = page?.content ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="challenges-page notif-page">
      <CustomCursor />
      <Topbar onMenuToggle={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />

      <main className="challenges-main notif-main">
        <header className="notif-header">
          <h1 className="challenges-title">Notifications</h1>
          {items.length > 0 && unread > 0 && (
            <button type="button" className="notif-mark-all" onClick={handleMarkAll}>
              Mark all read
            </button>
          )}
        </header>

        {error && <p className="notif-error">{error}</p>}

        {loading && <p className="notif-muted">Loading…</p>}

        {!loading && items.length === 0 && (
          <p className="notif-muted">No notifications yet. Complete a submission to see results here.</p>
        )}

        <ul className="notif-list">
          {items.map((n) => {
            const sid = n.metadata?.submissionId;
            return (
              <li key={n.id} className={`notif-card${n.read ? " notif-read" : ""}`}>
                <div className="notif-card-head">
                  <span className="notif-card-title">{n.title}</span>
                  <time className="notif-time" dateTime={n.createdAt}>
                    {formatDate(n.createdAt)}
                  </time>
                </div>
                <p className="notif-body">{n.body}</p>
                <div className="notif-actions">
                  {!n.read && (
                    <button type="button" className="notif-btn" onClick={() => handleMarkRead(n.id)}>
                      Mark read
                    </button>
                  )}
                  {sid != null && (
                    <Link className="notif-link" to={`/submissions/${sid}`}>
                      View submission →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      <BottomNav />
    </div>
  );
}
