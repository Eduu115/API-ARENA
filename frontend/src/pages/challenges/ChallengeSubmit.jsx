import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigateLocalized } from '../../routes/LocaleLayout';
import { useTranslation } from 'react-i18next';
import * as challengesApi from '../../lib/challengesApi';
import { useAuth } from '../../context/AuthContext';
import {
  clearChallengeSession,
  setChallengeSession,
  challengeSessionKey,
} from '../../lib/challengeSessionStorage';
import { createSubmission, getChallengeAttemptStatus, getMySubmissions, abandonChallengeAttempt } from '../../lib/submissionsApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import AttemptPolicyBlockModal from '../../components/AttemptPolicyBlockModal';
import './challenges.css';
import './ChallengeSubmit.css';
import TutorialTour from '../../components/tutorial/TutorialTour';
import { DOCS_PATHS } from '../../tutorial/tourDefinitions';
import { useTourSteps } from '../../lib/tourSteps';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatUtcHint(iso, locale) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const loc = locale?.startsWith('es') ? 'es-ES' : 'en-GB';
    return `${d.toLocaleString(loc, { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC`;
  } catch {
    return iso;
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EndpointsTable({ data }) {
  const { t } = useTranslation('submissions');
  const items = data?.items || (Array.isArray(data) ? data : null);
  if (!items?.length) return null;
  return (
    <table className="cs-ep-table">
      <thead>
        <tr>
          <th>{t('submit.tableMethod')}</th>
          <th>{t('submit.tablePath')}</th>
          <th>{t('submit.tableDescription')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((ep, i) => (
          <tr key={i}>
            <td className="cs-ep-method">{ep.method || '—'}</td>
            <td>{ep.path || ep.endpoint || '—'}</td>
            <td>{ep.description || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusCodesList({ data }) {
  const items = data?.items || (Array.isArray(data) ? data : null);
  if (!items?.length) return null;
  return (
    <ul className="cs-list">
      {items.map((sc, i) => (
        <li key={i}>
          <span className="cs-list-key">{sc.code || sc.status || sc}</span>
          <span>{sc.description || (typeof sc === 'string' ? '' : JSON.stringify(sc))}</span>
        </li>
      ))}
    </ul>
  );
}

function PerformanceTable({ data }) {
  const { t } = useTranslation('submissions');
  const items = data?.items || (Array.isArray(data) ? data : null);
  if (!items?.length) {
    if (data && typeof data === 'object' && !Array.isArray(data) && !data.items) {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        return (
          <ul className="cs-list">
            {entries.map(([k, v]) => (
              <li key={k}>
                <span className="cs-list-key">{k}</span>
                <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </li>
            ))}
          </ul>
        );
      }
    }
    return null;
  }
  return (
    <table className="cs-ep-table">
      <thead>
        <tr>
          <th>{t('submit.tableMetric')}</th>
          <th>{t('submit.tableThreshold')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((p, i) => (
          <tr key={i}>
            <td>{p.metric || p.name || '—'}</td>
            <td>{p.threshold || p.value || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GenericData({ data }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;
  const items = data?.items || (Array.isArray(data) ? data : null);
  if (items?.length) {
    return (
      <ul className="cs-list">
        {items.map((item, i) => (
          <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    return <pre className="cs-json">{JSON.stringify(data, null, 2)}</pre>;
  }
  return <pre className="cs-json">{String(data)}</pre>;
}

function HintsAccordion({ hints }) {
  const { t } = useTranslation('submissions');
  const [open, setOpen] = useState({});
  if (!hints || (typeof hints === 'object' && Object.keys(hints).length === 0)) return null;
  const entries = typeof hints === 'object' ? Object.entries(hints) : [];
  if (!entries.length) return null;
  return (
    <>
      {entries.map(([key, val]) => (
        <div className="cs-hint" key={key}>
          <button
            type="button"
            className="cs-hint-toggle"
            onClick={() => setOpen(prev => ({ ...prev, [key]: !prev[key] }))}
          >
            <span className={`cs-hint-arrow ${open[key] ? 'open' : ''}`}>▶</span>
            {t('submit.hintLabel', { key })}
          </button>
          {open[key] && (
            <div className="cs-hint-body">
              {typeof val === 'string' ? val : JSON.stringify(val)}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function LearningObjectives({ data }) {
  const items = data?.items || data?.objectives || (Array.isArray(data) ? data : null);
  if (!items?.length) return null;
  return (
    <ul className="cs-list">
      {items.map((item, i) => (
        <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}

function hasContent(data) {
  if (data == null) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    if (keys.length === 1 && keys[0] === 'items') return Array.isArray(data.items) && data.items.length > 0;
    return true;
  }
  return Boolean(data);
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <div className="cs-section">
      <h3 className="cs-section-title">{title}</h3>
      <div className="cs-section-body">{children}</div>
    </div>
  );
}

export default function ChallengeSubmit() {
  const { t, i18n } = useTranslation(['submissions', 'challenges']);
  const { id } = useParams();
  const navigate = useNavigateLocalized();
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const staffBypass = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const tourSteps = useTourSteps('challengeSubmit');

  // Abandon tracking: leaving an active session without submitting spends an attempt + cooldown.
  const submittedRef = useRef(false);
  const abandonInfoRef = useRef({ id, userId: user?.id, staffBypass });
  useEffect(() => {
    abandonInfoRef.current = { id, userId: user?.id, staffBypass };
  }, [id, user?.id, staffBypass]);
  useEffect(() => {
    // On real unmount only (in-app navigation away). A page refresh does not run this,
    // so refreshing keeps the session; closing the tab is the accepted miss.
    return () => {
      const { id: cid, userId, staffBypass: bypass } = abandonInfoRef.current;
      if (bypass || !userId || submittedRef.current || !cid) return;
      const raw = localStorage.getItem(challengeSessionKey(userId));
      if (!raw) return; // no active timed session → nothing was started
      try {
        if (String(JSON.parse(raw).challengeId) !== String(cid)) return;
      } catch {
        return;
      }
      abandonChallengeAttempt(cid).catch(() => {});
      clearChallengeSession(userId);
    };
  }, []);

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Challenge end in epoch ms — time keeps running off-screen. */
  const [deadlineAt, setDeadlineAt] = useState(null);
  const [totalSeconds, setTotalSeconds] = useState(null);
  const [tick, setTick] = useState(0);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [attemptPolicy, setAttemptPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [showFirstSubmitModal, setShowFirstSubmitModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setPolicyLoading(true);
    setAttemptPolicy(null);
    (async () => {
      try {
        const p = await getChallengeAttemptStatus(id);
        if (!cancelled) setAttemptPolicy(p);
      } catch {
        if (!cancelled) {
          setAttemptPolicy({ allowed: true, attemptsUsedToday: 0, maxAttemptsPerDay: 3 });
        }
      } finally {
        if (!cancelled) setPolicyLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!user?.id || staffBypass) return;
    if (!staffBypass && attemptPolicy && attemptPolicy.allowed === false) return;
    const confirmationKey = `apiarena:first-submit-check-confirmed:${user.id}`;
    if (localStorage.getItem(confirmationKey) === '1') {
      return;
    }

    const completed = Number(user.totalChallengesCompleted);
    if (Number.isFinite(completed) && completed > 0) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const submissions = await getMySubmissions();
        if (!cancelled && Array.isArray(submissions) && submissions.length === 0) {
          setShowFirstSubmitModal(true);
        }
      } catch {
        if (!cancelled) {
          // If we cannot verify history, keep a safe warning for first-time UX.
          setShowFirstSubmitModal(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.totalChallengesCompleted, staffBypass, attemptPolicy]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await challengesApi.getChallengeSpecs(id);
        if (!cancelled) {
          setChallenge(data);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || t('challenges:detail.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  /** Restore deadline from localStorage or start timer. */
  useEffect(() => {
    if (!challenge || !id || !user?.id) return;
    if (!staffBypass) {
      if (policyLoading) return;
      if (attemptPolicy && attemptPolicy.allowed === false) return;
    }
    const totalDefault = (challenge.timeLimitMinutes ?? 60) * 60;
    const raw = localStorage.getItem(challengeSessionKey(user.id));
    let restored = false;
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (String(s.challengeId) === String(id)) {
          setTotalSeconds(Number(s.totalSeconds) || totalDefault);
          let d = s.deadlineAt != null ? Number(s.deadlineAt) : null;
          if (d == null && s.secondsLeft != null) {
            d = Date.now() + Math.max(0, Number(s.secondsLeft)) * 1000;
          }
          if (d == null) {
            d = Date.now() + totalDefault * 1000;
          }
          setDeadlineAt(d);
          restored = true;
        }
      } catch {
        /* ignore */
      }
    }
    if (!restored) {
      setTotalSeconds(totalDefault);
      setDeadlineAt(Date.now() + totalDefault * 1000);
    }
  }, [challenge, id, user?.id, staffBypass, policyLoading, attemptPolicy]);

  /** Persist fixed deadline (does not depend on tick). */
  useEffect(() => {
    if (!user?.id || !id || !challenge || deadlineAt == null || totalSeconds === null) return;
    if (!staffBypass) {
      if (policyLoading) return;
      if (attemptPolicy && attemptPolicy.allowed === false) return;
    }
    setChallengeSession(user.id, {
      challengeId: id,
      deadlineAt,
      totalSeconds,
      challengeTitle: challenge.title || '',
      savedAt: Date.now(),
    });
  }, [user?.id, id, challenge?.id, challenge?.title, deadlineAt, totalSeconds, staffBypass, policyLoading, attemptPolicy]);

  /** When cooldown / daily window ends, refresh policy so the user can continue without reload. */
  useEffect(() => {
    if (staffBypass || !id || policyLoading) return;
    if (!attemptPolicy || attemptPolicy.allowed !== false) return;
    const iso =
      attemptPolicy.blockReason === 'COOLDOWN'
        ? attemptPolicy.cooldownUntilIso
        : attemptPolicy.blockReason === 'DAILY_LIMIT'
          ? attemptPolicy.dailyLimitResetsAtIso
          : null;
    if (!iso) return;
    const ms = new Date(iso).getTime() - Date.now();
    if (ms > 1500) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const p = await getChallengeAttemptStatus(id);
        if (!cancelled) setAttemptPolicy(p);
      } catch {
        /* keep current */
      }
    }, Math.max(500, ms + 400));
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [id, staffBypass, policyLoading, attemptPolicy, tick]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = useMemo(() => {
    if (deadlineAt == null) return null;
    return Math.max(0, Math.floor((deadlineAt - Date.now()) / 1000));
  }, [deadlineAt, tick]);

  const timerExpired = secondsLeft !== null && secondsLeft <= 0;

  const timerClass = timerExpired
    ? 'cs-timer-done'
    : secondsLeft <= 60
      ? 'cs-timer-danger'
      : secondsLeft <= 300
        ? 'cs-timer-warn'
        : 'cs-timer-normal';

  const timerPercent = totalSeconds ? ((secondsLeft ?? 0) / totalSeconds) * 100 : 100;
  const barColor = timerExpired
    ? 'var(--red)'
    : secondsLeft <= 60
      ? 'var(--red)'
      : secondsLeft <= 300
        ? 'var(--warn)'
        : 'var(--cyan)';

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback(() => setDragging(false), []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.endsWith('.zip')) {
      setFile(dropped);
      setSubmitError(null);
    } else {
      setSubmitError(t('submissions:submit.zipOnly'));
    }
  }, [t]);
  const handleFileChange = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.endsWith('.zip')) {
      setFile(selected);
      setSubmitError(null);
    } else if (selected) {
      setSubmitError(t('submissions:submit.zipOnly'));
    }
  }, [t]);

  const policyBlocks = !staffBypass && attemptPolicy && attemptPolicy.allowed === false;
  const submitBlockedByFirstTimeCheck = showFirstSubmitModal;

  useEffect(() => {
    if (policyBlocks) setShowFirstSubmitModal(false);
  }, [policyBlocks]);

  const handleSubmit = async () => {
    if (
      !file ||
      submitting ||
      timerExpired ||
      (!staffBypass && policyLoading) ||
      policyBlocks ||
      submitBlockedByFirstTimeCheck
    ) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const developmentTimeSeconds =
        secondsLeft != null && totalSeconds != null
          ? Math.max(0, Math.min(totalSeconds, totalSeconds - secondsLeft))
          : undefined;
      const result = await createSubmission(id, file, developmentTimeSeconds);
      submittedRef.current = true; // a real submission already spent the attempt — don't also record an abandon
      if (user?.id) clearChallengeSession(user.id);
      const subId = result?.id || result?.submissionId;
      if (subId) {
        navigate(`/submissions/${subId}`);
      } else {
        navigate('/submissions');
      }
    } catch (e) {
      setSubmitError(e?.message || t('submissions:submit.submitFailed'));
      setSubmitting(false);
    }
  };

  const diff = challenge?.difficulty?.toLowerCase() || 'easy';
  const diffBadge = {
    easy: 'ch-badge-easy', medium: 'ch-badge-medium',
    hard: 'ch-badge-hard', expert: 'ch-badge-expert',
    extreme: 'ch-badge-extreme',
  }[diff] ?? 'ch-badge-cat';

  if (loading) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="chd-main"><div className="chd-loading">{t('challenges:detail.loading')}</div></main>
        <BottomNav /><CustomCursor />
      </div>
    );
  }
  if (error || !challenge) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="chd-main">
          <p className="chd-error">{error || t('challenges:detail.notFound')}</p>
          <button type="button" className="chd-btn-back" onClick={() => navigate('/challenges')}>
            {t('challenges:detail.backToChallenges')}
          </button>
        </main>
        <BottomNav /><CustomCursor />
      </div>
    );
  }

  return (
    <div className="challenges-page chd-page">
      <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
      <AttemptPolicyBlockModal
        open={policyBlocks}
        blockReason={attemptPolicy?.blockReason}
        cooldownUntilIso={attemptPolicy?.cooldownUntilIso}
        dailyLimitResetsAtIso={attemptPolicy?.dailyLimitResetsAtIso}
        challengeTitle={challenge?.title}
        primaryLabelKey="backToOverview"
        onDismiss={() => navigate(`/challenges/${id}`)}
      />
      <main className="chd-main">
        <div className="chd-container">
          <button type="button" className="cs-back" onClick={() => navigate(`/challenges/${id}`)}>
            {t('submissions:submit.backToChallenge')}
          </button>

          {/* Attempt limits — visible immediately */}
          <section className="cs-attempts-hero" aria-labelledby="cs-attempts-title" data-tutorial="submit-limits">
            <div className="cs-attempts-hero-head">
              <span className="cs-attempts-eyebrow">{t('submissions:submit.fairPlay')}</span>
              <h2 id="cs-attempts-title" className="cs-attempts-title">
                {t('submissions:submit.limitsTitle')}
              </h2>
              <p className="cs-attempts-lead">
                {t('submissions:submit.limitsLead')}
              </p>
            </div>
            {staffBypass && (
              <p className="cs-attempts-staff">{t('submissions:submit.staffNote')}</p>
            )}
            {!staffBypass && policyLoading && (
              <p className="cs-attempts-loading">{t('submissions:submit.limitsLoading')}</p>
            )}
            {!staffBypass && !policyLoading && attemptPolicy?.allowed && (
              <div className="cs-attempts-grid">
                <div className="cs-attempts-card">
                  <div className="cs-attempts-card-label">{t('submissions:submit.dailyLabel')}</div>
                  <div className="cs-attempts-card-value" aria-live="polite">
                    <span className="cs-attempts-nums">{attemptPolicy.attemptsUsedToday}</span>
                    <span className="cs-attempts-slash">/</span>
                    <span className="cs-attempts-max">{attemptPolicy.maxAttemptsPerDay}</span>
                  </div>
                  <p className="cs-attempts-card-hint">
                    {t('submissions:submit.dailyHint', { max: attemptPolicy.maxAttemptsPerDay })}
                  </p>
                </div>
                <div className="cs-attempts-card">
                  <div className="cs-attempts-card-label">{t('submissions:submit.cooldownLabel')}</div>
                  <div className="cs-attempts-card-value cs-attempts-cooldown-val">
                    {challenge.timeLimitMinutes ?? 60}
                    <span className="cs-attempts-unit">{t('submissions:submit.minUnit')}</span>
                  </div>
                  <p className="cs-attempts-card-hint">
                    {t('submissions:submit.cooldownHint')}
                  </p>
                </div>
              </div>
            )}
            {!staffBypass && !policyLoading && attemptPolicy && !attemptPolicy.allowed && attemptPolicy.blockReason === 'DAILY_LIMIT' && (
              <div className="cs-attempts-block cs-attempts-block-warn" role="alert">
                <strong>{t('submissions:submit.dailyBlockTitle')}</strong>
                <span>
                  {t('submissions:submit.dailyBlockCopy', {
                    max: attemptPolicy.maxAttemptsPerDay,
                    time: formatUtcHint(attemptPolicy.dailyLimitResetsAtIso, i18n.language),
                  })}
                </span>
              </div>
            )}
            {!staffBypass && !policyLoading && attemptPolicy && !attemptPolicy.allowed && attemptPolicy.blockReason === 'COOLDOWN' && (
              <div className="cs-attempts-block cs-attempts-block-warn" role="alert">
                <strong>{t('submissions:submit.cooldownBlockTitle')}</strong>
                <span>
                  {t('submissions:submit.cooldownBlockCopy', {
                    time: formatUtcHint(attemptPolicy.cooldownUntilIso, i18n.language),
                  })}
                </span>
              </div>
            )}
          </section>

          <div className="cs-grid">
            {/* Left column — Challenge info */}
            <div className="cs-info">
              <div className="cs-hero-tags">
                <span className={`ch-badge ${diffBadge}`}>{challenge.difficulty}</span>
                <span className="ch-badge ch-badge-cat">{challenge.category}</span>
                <span className={`ch-badge ${(challenge.origin || 'LEGACY') === 'COMMUNITY' ? 'ch-badge-community' : 'ch-badge-legacy'}`}>
                  {(challenge.origin || 'LEGACY') === 'COMMUNITY' ? t('challenges:community') : t('challenges:legacy')}
                </span>
                {challenge.featured && <span className="ch-badge ch-badge-new">{t('challenges:featuredBadge')}</span>}
              </div>

              <h1 className="cs-title">{challenge.title}</h1>
              <p className="cs-slug">/{challenge.slug}</p>

              <div className="cs-stats">
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.maxScore ?? 1000}</div>
                  <div className="cs-stat-label">{t('submissions:submit.maxScore')}</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.timeLimitMinutes ?? 60}</div>
                  <div className="cs-stat-label">{t('submissions:submit.minutes')}</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.timesAttempted ?? 0}</div>
                  <div className="cs-stat-label">{t('submissions:submit.attempts')}</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.timesCompleted ?? 0}</div>
                  <div className="cs-stat-label">{t('submissions:submit.completions')}</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{Number(challenge.averageScore ?? 0).toFixed(1)}</div>
                  <div className="cs-stat-label">{t('submissions:submit.avgScore')}</div>
                </div>
              </div>

              <Section title={t('submissions:submit.description')}>
                <p className="cs-desc">{challenge.description || t('submissions:submit.noDescription')}</p>
              </Section>

              {hasContent(challenge.requiredEndpoints) && (
                <Section title={t('submissions:submit.requiredEndpoints')}>
                  <EndpointsTable data={challenge.requiredEndpoints} />
                </Section>
              )}

              {hasContent(challenge.requiredStatusCodes) && (
                <Section title={t('submissions:submit.requiredStatusCodes')}>
                  <StatusCodesList data={challenge.requiredStatusCodes} />
                </Section>
              )}

              {hasContent(challenge.requiredHeaders) && (
                <Section title={t('submissions:submit.requiredHeaders')}>
                  <GenericData data={challenge.requiredHeaders} />
                </Section>
              )}

              {hasContent(challenge.testSuite) && (
                <Section title={t('submissions:submit.testSuite')}>
                  <GenericData data={challenge.testSuite} />
                </Section>
              )}

              {hasContent(challenge.performanceRequirements) && (
                <Section title={t('submissions:submit.performanceRequirements')}>
                  <PerformanceTable data={challenge.performanceRequirements} />
                </Section>
              )}

              {hasContent(challenge.designCriteria) && (
                <Section title={t('submissions:submit.designCriteria')}>
                  <GenericData data={challenge.designCriteria} />
                </Section>
              )}

              {hasContent(challenge.hints) && (
                <Section title={t('submissions:submit.hints')}>
                  <HintsAccordion hints={challenge.hints} />
                </Section>
              )}

              {hasContent(challenge.learningObjectives) && (
                <Section title={t('submissions:submit.learningObjectives')}>
                  <LearningObjectives data={challenge.learningObjectives} />
                </Section>
              )}
            </div>

            {/* Right column — Submit panel */}
            <div className="cs-panel">
              <div className="cs-panel-inner">
              {/* Timer */}
                <div className="cs-timer-section" data-tutorial="submit-timer">
                  <div className="cs-timer-label">{t('submissions:submit.timerLabel')}</div>
                  <div className={`cs-timer-display ${timerClass}`}>
                    {timerExpired ? t('submissions:submit.timesUp') : formatTime(secondsLeft ?? 0)}
                  </div>
                  <div className="cs-timer-bar">
                    <div
                      className="cs-timer-fill"
                      style={{ width: `${timerPercent}%`, background: barColor }}
                    />
                  </div>
                  <p className="cs-timer-realtime-hint">
                    {t('submissions:submit.timerHint')}
                  </p>
                </div>

              {/* Dropzone */}
                <div className="cs-drop-section" data-tutorial="submit-zip">
                  {!file ? (
                    <div
                      className={`cs-dropzone ${dragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="cs-dropzone-icon">📦</div>
                      <div className="cs-dropzone-text">{t('submissions:submit.dropText')}</div>
                      <div className="cs-dropzone-hint">{t('submissions:submit.dropHint')}</div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                        tabIndex={-1}
                        aria-label={t('submissions:submit.chooseZip')}
                      />
                    </div>
                  ) : (
                    <div className="cs-file-info">
                      <span className="cs-file-icon">📁</span>
                      <div className="cs-file-details">
                        <div className="cs-file-name">{file.name}</div>
                        <div className="cs-file-size">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        type="button"
                        className="cs-file-remove"
                        onClick={() => {
                          setFile(null);
                          setSubmitError(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

              {/* Submit */}
                <div className="cs-submit-section" data-tutorial="submit-button">
                  <button
                    type="button"
                    className="cs-submit-btn"
                    disabled={
                      !file ||
                      submitting ||
                      timerExpired ||
                      (!staffBypass && policyLoading) ||
                      policyBlocks ||
                      submitBlockedByFirstTimeCheck
                    }
                    onClick={handleSubmit}
                  >
                    {submitting ? t('submissions:submit.submitting') : t('submissions:submit.submitSolution')}
                  </button>
                  {submitError && <div className="cs-submit-status error">{submitError}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
      <CustomCursor />
      {submitting && (
        <div className="cs-submit-modal-backdrop" role="status" aria-live="assertive" aria-label={t('submissions:submit.modalLabel')}>
          <div className="cs-submit-modal">
            <div className="cs-submit-modal-eyebrow">{t('submissions:submit.modalEyebrow')}</div>
            <h2 className="cs-submit-modal-title">{t('submissions:submit.modalTitle')}</h2>
            <p className="cs-submit-modal-copy">
              {t('submissions:submit.modalCopy')}
            </p>
            <div className="cs-submit-modal-spinner" aria-hidden />
            <div className="cs-submit-modal-hint">{t('submissions:submit.modalHint')}</div>
          </div>
        </div>
      )}
      <TutorialTour
        tourKey="challengeSubmit"
        steps={tourSteps}
        docsHref={DOCS_PATHS.challengeSubmit}
        when={!showFirstSubmitModal && !policyBlocks}
      />
      {showFirstSubmitModal && !policyBlocks && (
        <div className="cs-onboard-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cs-onboard-title">
          <div className="cs-onboard-modal">
            <div className="cs-onboard-eyebrow">{t('submissions:submit.onboardEyebrow')}</div>
            <h2 id="cs-onboard-title" className="cs-onboard-title">
              {t('submissions:submit.onboardTitle')}
            </h2>
            <p className="cs-onboard-copy">
              {t('submissions:submit.onboardCopy')}
            </p>
            <ul className="cs-onboard-list">
              <li>{t('submissions:submit.onboardLi1')}</li>
              <li>{t('submissions:submit.onboardLi2')}</li>
              <li>{t('submissions:submit.onboardLi3')}</li>
            </ul>
            <div className="cs-onboard-actions">
              <button
                type="button"
                className="cs-onboard-btn"
                onClick={() => navigate('/docs/preconfiguracion-proyecto')}
              >
                {t('submissions:submit.onboardGuide')}
              </button>
              <button
                type="button"
                className="cs-onboard-btn cs-onboard-btn-primary"
                onClick={() => {
                  localStorage.setItem(`apiarena:first-submit-check-confirmed:${user.id}`, '1');
                  setShowFirstSubmitModal(false);
                }}
              >
                {t('submissions:submit.onboardConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
