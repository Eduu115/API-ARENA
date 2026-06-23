import { useState, useMemo, useEffect } from 'react';
import { useNavigateLocalized } from '../../routes/LocaleLayout';
import { useTranslation } from 'react-i18next';
import { getMySubmissions } from '../../lib/submissionsApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import { usePageMeta } from '../../lib/usePageMeta';
import '../challenges/challenges.css';
import './submissions.css';

function formatDate(d, locale) {
  if (!d) return '—';
  const loc = locale?.startsWith('es') ? 'es-ES' : 'en-GB';
  return new Date(d).toLocaleDateString(loc, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const { t } = useTranslation('submissions');
  const label = t(`my.status.${status}`, { defaultValue: status });
  return (
    <span className={`sub-status-badge sub-status-${status.toLowerCase()}`}>
      <span className="sub-status-dot" />
      {label}
    </span>
  );
}

const FILTER_VALUES = ['all', 'COMPLETED', 'FAILED', 'TESTING', 'BUILDING', 'PENDING'];

export default function MySubmissions() {
  const { t, i18n } = useTranslation('submissions');
  const navigate = useNavigateLocalized();
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageMeta({ title: t('my.pageTitle'), path: '/submissions' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getMySubmissions();
        if (!cancelled) setSubmissions(data || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || t('my.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    let list = [...submissions];
    if (filter !== 'all') list = list.filter((s) => s.status === filter);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filter, submissions]);

  const attemptBySubmissionId = useMemo(() => {
    const byChallenge = new Map();
    const sorted = [...submissions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    for (const s of sorted) {
      const challengeId = Number(s.challengeId);
      const current = byChallenge.get(challengeId) || 0;
      byChallenge.set(challengeId, current + 1);
      byChallenge.set(`sub-${s.id}`, current + 1);
    }
    const map = new Map();
    for (const [key, val] of byChallenge.entries()) {
      if (typeof key === 'string' && key.startsWith('sub-')) {
        map.set(Number(key.replace('sub-', '')), val);
      }
    }
    return map;
  }, [submissions]);

  const completed = submissions.filter((s) => s.status === 'COMPLETED');
  const avgScore =
    completed.length > 0
      ? (completed.reduce((acc, s) => acc + (Number(s.totalScore) || 0), 0) / completed.length).toFixed(1)
      : '0';
  const bestScore =
    completed.length > 0
      ? Math.max(...completed.map((s) => Number(s.totalScore) || 0)).toFixed(1)
      : '0';

  const kpis = [
    {
      icon: '◎',
      label: t('my.kpiTotal'),
      value: submissions.length,
      color: 'var(--cyan)',
      bar: '100%',
    },
    {
      icon: '✓',
      label: t('my.kpiCompleted'),
      value: completed.length,
      color: 'var(--green)',
      bar: submissions.length > 0 ? `${(completed.length / submissions.length) * 100}%` : '0%',
    },
    {
      icon: '★',
      label: t('my.kpiAvgScore'),
      value: avgScore,
      color: 'var(--warn)',
      bar: `${(avgScore / 1000) * 100}%`,
    },
    {
      icon: '⬆',
      label: t('my.kpiBestScore'),
      value: bestScore,
      color: 'var(--purple)',
      bar: `${(bestScore / 1000) * 100}%`,
    },
  ];

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="ch-page-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="ch-page-eyebrow">{t('my.eyebrow')}</div>
              <h1 className="ch-page-title">
                {t('my.titleBefore')}
                <em>{t('my.titleEm')}</em>
              </h1>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: 60,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--muted)',
                letterSpacing: 1,
              }}
            >
              {t('my.loading')}
            </div>
          ) : error ? (
            <div
              style={{
                padding: 60,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--red)',
                letterSpacing: 1,
              }}
            >
              {error}
            </div>
          ) : (
            <>
              <div className="sub-kpi-grid">
                {kpis.map((k) => (
                  <div key={k.label} className="sub-kpi-card" style={{ '--kpi-color': k.color }}>
                    <div className="sub-kpi-icon">{k.icon}</div>
                    <div className="sub-kpi-val">{k.value}</div>
                    <div className="sub-kpi-label">{k.label}</div>
                    <div className="sub-kpi-bar" style={{ width: k.bar }} />
                  </div>
                ))}
              </div>

              <div className="sub-filters">
                {FILTER_VALUES.map((val) => (
                  <button
                    key={val}
                    className={`sub-filter-btn${filter === val ? ' active' : ''}`}
                    onClick={() => setFilter(val)}
                  >
                    {val === 'all' ? t('my.filterAll') : t(`my.status.${val}`, { defaultValue: val })}
                  </button>
                ))}
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--muted)',
                    letterSpacing: 1,
                  }}
                >
                  {t('my.resultsCount', { count: filtered.length })}
                </span>
              </div>

              <div className="sub-table">
                <div className="sub-table-head">
                  <div className="sub-th">{t('my.colAttempt')}</div>
                  <div className="sub-th">{t('my.colChallenge')}</div>
                  <div className="sub-th">{t('my.colScore')}</div>
                  <div className="sub-th">{t('my.colStatus')}</div>
                  <div className="sub-th sub-th-right">{t('my.colTime')}</div>
                  <div className="sub-th sub-th-right">{t('my.colActions')}</div>
                </div>
                {filtered.length === 0 ? (
                  <div
                    style={{
                      padding: 40,
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--muted)',
                    }}
                  >
                    {submissions.length === 0 ? t('my.emptyNone') : t('my.emptyFilter')}
                  </div>
                ) : (
                  filtered.map((sub, i) => {
                    const score = Number(sub.totalScore) || 0;
                    const maxScore = 1000;
                    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                    const sc =
                      pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--warn)' : pct > 0 ? 'var(--red)' : 'var(--muted)';
                    const challengeTitle =
                      (sub.challengeTitle && String(sub.challengeTitle).trim()) ||
                      t('my.challengeFallback', { id: sub.challengeId });
                    const attempt = attemptBySubmissionId.get(Number(sub.id));
                    return (
                      <div
                        key={sub.id}
                        className="sub-row"
                        style={{ animationDelay: `${i * 0.04}s` }}
                        onClick={() => navigate(`/submissions/${sub.id}`)}
                      >
                        <div className="sub-row-id">{attempt ? `A${attempt}` : '—'}</div>
                        <div>
                          <div className="sub-row-challenge-title">{challengeTitle}</div>
                          <div className="sub-row-challenge-meta">
                            <span>ID {sub.challengeId}</span>
                            <span>·</span>
                            <span>{t('my.submissionId', { id: sub.id })}</span>
                          </div>
                        </div>
                        <div className="sub-row-score">
                          <div className="sub-row-score-val" style={{ color: sc }}>
                            {score > 0 ? score.toFixed(1) : '—'}
                          </div>
                          <div className="sub-row-score-bar">
                            <div className="sub-row-score-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div>
                          <StatusBadge status={sub.status} />
                        </div>
                        <div className="sub-row-time">{formatDate(sub.createdAt, i18n.language)}</div>
                        <div className="sub-row-actions">
                          <button
                            className="sub-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/submissions/${sub.id}`);
                            }}
                          >
                            {t('my.view')}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
