import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import BottomNav from "../components/BottomNav";
import CustomCursor from "../components/CustomCursor";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/notificationsApi";
import { connectNotificationsWs } from "../lib/notificationsWs";
import { notificationActionLabel, notificationActionPath } from "../lib/notificationDisplay";
import "./challenges/challenges.css";
import "./notifications.css";

const IMPORTANCE_ORDER = ["INFO", "REMINDER", "ALERTS", "IMPORTANT"];

const IMPORTANCE_FILTERS = [
  { id: "ALL", label: "All levels" },
  { id: "INFO", label: "Info" },
  { id: "REMINDER", label: "Reminder" },
  { id: "ALERTS", label: "Alerts" },
  { id: "IMPORTANT", label: "Important" },
];

const READ_FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

function importanceClass(imp) {
  const key = typeof imp === "string" ? imp.toUpperCase() : "INFO";
  if (!IMPORTANCE_ORDER.includes(key)) return "notif-importance--info";
  return `notif-importance--${key.toLowerCase()}`;
}

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
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [importanceFilter, setImportanceFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("all");
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { page: 0, size: 50 };
    if (readFilter === "unread") params.unreadOnly = true;
    else if (readFilter === "read") params.unreadOnly = false;
    if (importanceFilter !== "ALL") params.minImportance = importanceFilter;

    try {
      const [data, unreadRes] = await Promise.all([
        getMyNotifications(params),
        getUnreadNotificationCount().catch(() => ({ count: 0 })),
      ]);
      if (!cancelledRef.current) {
        setPage(data);
        setUnreadTotal(Number(unreadRes?.count) || 0);
      }
    } catch (e) {
      if (!cancelledRef.current) setError(e?.message || "Failed to load notifications");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [importanceFilter, readFilter]);

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
  const hasFilters = importanceFilter !== "ALL" || readFilter !== "all";

  return (
    <div className="challenges-page notif-page">
      <CustomCursor />
      <div className="ch-grid-bg" aria-hidden />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />
        <main className="ch-main notif-main">
          <div className="ch-page-header notif-page-header">
            <div>
              <div className="ch-page-eyebrow">// Inbox</div>
              <h1 className="ch-page-title">
                My<em>Notifications</em>
              </h1>
              <p className="notif-page-lead">
                Submission results and system messages. Filter by priority or read status.
              </p>
            </div>
            {unreadTotal > 0 && (
              <button type="button" className="notif-mark-all" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-filter-panel">
            <div className="notif-filter-row">
              <span className="notif-filter-heading" aria-hidden>
                Priority
              </span>
              <div className="notif-filter-chips" role="group" aria-label="Filter by priority">
                {IMPORTANCE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`notif-filter-chip${importanceFilter === f.id ? " is-active" : ""}`}
                    onClick={() => setImportanceFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="notif-filter-row">
              <span className="notif-filter-heading" aria-hidden>
                Status
              </span>
              <div className="notif-filter-chips" role="group" aria-label="Filter by read status">
                {READ_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`notif-filter-chip${readFilter === f.id ? " is-active" : ""}`}
                    onClick={() => setReadFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="notif-error">{error}</p>}

          {loading && (
            <p className="notif-loading" role="status">
              Loading…
            </p>
          )}

          {!loading && items.length === 0 && (
            <p className="notif-muted">
              {hasFilters
                ? "No notifications match these filters. Try changing priority or status."
                : "No notifications yet. Complete a submission to see results here."}
            </p>
          )}

          {!loading && items.length > 0 && (
            <ul className="notif-list">
              {items.map((n) => {
                const actionPath = notificationActionPath(n);
                const actionLabel = notificationActionLabel(n);
                const showAction = actionPath !== "/notifications" || n.type === "ACHIEVEMENT_UNLOCKED";
                return (
                  <li key={n.id} className={`notif-card${n.read ? " notif-read" : ""}`}>
                    <div className="notif-card-head">
                      <div className="notif-card-title-row">
                        <span
                          className={`notif-importance ${importanceClass(n.importance)}`}
                          title="Priority (low → high): Info, Reminder, Alerts, Important"
                        >
                          {n.importance || "INFO"}
                        </span>
                        <span className="notif-card-title">{n.title}</span>
                      </div>
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
                      {showAction && (
                        <Link className="notif-link" to={actionPath}>
                          {actionLabel}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
