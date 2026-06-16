import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/notificationsApi';
import { connectNotificationsWs } from '../lib/notificationsWs';
import { notificationActionLabel, notificationActionPath } from '../lib/notificationDisplay';
import { usePageMeta } from '../lib/usePageMeta';
import './challenges/challenges.css';
import './notifications.css';

const IMPORTANCE_ORDER = ['INFO', 'REMINDER', 'ALERTS', 'IMPORTANT'];

function importanceClass(imp) {
  const key = typeof imp === 'string' ? imp.toUpperCase() : 'INFO';
  if (!IMPORTANCE_ORDER.includes(key)) return 'notif-importance--info';
  return `notif-importance--${key.toLowerCase()}`;
}

function formatDate(iso, locale) {
  if (!iso) return '—';
  const loc = locale?.startsWith('es') ? 'es-ES' : 'en-GB';
  return new Date(iso).toLocaleString(loc, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Notifications() {
  const { t, i18n } = useTranslation('notifications');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [importanceFilter, setImportanceFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('all');
  const cancelledRef = useRef(false);

  usePageMeta({ title: t('pageTitle'), path: '/notifications' });

  const importanceFilters = [
    { id: 'ALL', label: t('filters.allLevels') },
    { id: 'INFO', label: t('filters.info') },
    { id: 'REMINDER', label: t('filters.reminder') },
    { id: 'ALERTS', label: t('filters.alerts') },
    { id: 'IMPORTANT', label: t('filters.important') },
  ];

  const readFilters = [
    { id: 'all', label: t('filters.all') },
    { id: 'unread', label: t('filters.unread') },
    { id: 'read', label: t('filters.read') },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { page: 0, size: 50 };
    if (readFilter === 'unread') params.unreadOnly = true;
    else if (readFilter === 'read') params.unreadOnly = false;
    if (importanceFilter !== 'ALL') params.minImportance = importanceFilter;

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
      if (!cancelledRef.current) setError(e?.message || t('loadError'));
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [importanceFilter, readFilter, t]);

  useEffect(() => {
    cancelledRef.current = false;
    load();
    const disconnect = connectNotificationsWs({
      onEvent: (msg) => {
        if (msg?.event === 'NEW_NOTIFICATION') {
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
      setError(e?.message || t('updateError'));
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      await load();
    } catch (e) {
      setError(e?.message || t('updateError'));
    }
  }

  const items = page?.content ?? [];
  const hasFilters = importanceFilter !== 'ALL' || readFilter !== 'all';

  return (
    <div className="challenges-page notif-page">
      <CustomCursor />
      <div className="ch-grid-bg" aria-hidden />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />
        <main className="ch-main notif-main">
          <div className="ch-page-header notif-page-header">
            <div>
              <div className="ch-page-eyebrow">{t('eyebrow')}</div>
              <h1 className="ch-page-title">
                {t('titleBefore')}
                <em>{t('titleEm')}</em>
              </h1>
              <p className="notif-page-lead">{t('lead')}</p>
            </div>
            {unreadTotal > 0 && (
              <button type="button" className="notif-mark-all" onClick={handleMarkAll}>
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="notif-filter-panel">
            <div className="notif-filter-row">
              <span className="notif-filter-heading" aria-hidden>
                {t('priority')}
              </span>
              <div className="notif-filter-chips" role="group" aria-label={t('priorityAria')}>
                {importanceFilters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`notif-filter-chip${importanceFilter === f.id ? ' is-active' : ''}`}
                    onClick={() => setImportanceFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="notif-filter-row">
              <span className="notif-filter-heading" aria-hidden>
                {t('status')}
              </span>
              <div className="notif-filter-chips" role="group" aria-label={t('statusAria')}>
                {readFilters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`notif-filter-chip${readFilter === f.id ? ' is-active' : ''}`}
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
              {t('loading')}
            </p>
          )}

          {!loading && items.length === 0 && (
            <p className="notif-muted">
              {hasFilters ? t('emptyFiltered') : t('emptyNone')}
            </p>
          )}

          {!loading && items.length > 0 && (
            <ul className="notif-list">
              {items.map((n) => {
                const actionPath = notificationActionPath(n);
                const actionLabel = notificationActionLabel(n);
                const showAction = actionPath !== '/notifications' || n.type === 'ACHIEVEMENT_UNLOCKED';
                return (
                  <li key={n.id} className={`notif-card${n.read ? ' notif-read' : ''}`}>
                    <div className="notif-card-head">
                      <div className="notif-card-title-row">
                        <span
                          className={`notif-importance ${importanceClass(n.importance)}`}
                          title={t('importanceTitle')}
                        >
                          {n.importance || 'INFO'}
                        </span>
                        <span className="notif-card-title">{n.title}</span>
                      </div>
                      <time className="notif-time" dateTime={n.createdAt}>
                        {formatDate(n.createdAt, i18n.language)}
                      </time>
                    </div>
                    <p className="notif-body">{n.body}</p>
                    <div className="notif-actions">
                      {!n.read && (
                        <button type="button" className="notif-btn" onClick={() => handleMarkRead(n.id)}>
                          {t('markRead')}
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
