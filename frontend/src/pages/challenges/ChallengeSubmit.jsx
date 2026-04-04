import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as challengesApi from '../../lib/challengesApi';
import { useAuth } from '../../context/AuthContext';
import {
  clearChallengeSession,
  setChallengeSession,
  challengeSessionKey,
} from '../../lib/challengeSessionStorage';
import { createSubmission, getChallengeAttemptStatus } from '../../lib/submissionsApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import './challenges.css';
import './ChallengeSubmit.css';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatUtcHint(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC`;
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
  const items = data?.items || (Array.isArray(data) ? data : null);
  if (!items?.length) return null;
  return (
    <table className="cs-ep-table">
      <thead>
        <tr><th>Method</th><th>Path</th><th>Description</th></tr>
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
        <tr><th>Metric</th><th>Threshold</th></tr>
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
            Hint {key}
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
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const staffBypass = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Fin del challenge en epoch ms — el tiempo sigue en marcha fuera de esta pantalla. */
  const [deadlineAt, setDeadlineAt] = useState(null);
  const [totalSeconds, setTotalSeconds] = useState(null);
  const [tick, setTick] = useState(0);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [attemptPolicy, setAttemptPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(true);

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
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await challengesApi.getChallengeById(id);
        if (!cancelled) {
          setChallenge(data);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Error loading challenge');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  /** Restaurar deadline desde localStorage o iniciar reloj. */
  useEffect(() => {
    if (!challenge || !id || !user?.id) return;
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
  }, [challenge, id, user?.id]);

  /** Persistir deadline (fija; no depende del tick). */
  useEffect(() => {
    if (!user?.id || !id || !challenge || deadlineAt == null || totalSeconds === null) return;
    setChallengeSession(user.id, {
      challengeId: id,
      deadlineAt,
      totalSeconds,
      challengeTitle: challenge.title || '',
      savedAt: Date.now(),
    });
  }, [user?.id, id, challenge?.id, challenge?.title, deadlineAt, totalSeconds]);

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
      setSubmitError('Only .zip files are accepted');
    }
  }, []);
  const handleFileChange = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.endsWith('.zip')) {
      setFile(selected);
      setSubmitError(null);
    } else if (selected) {
      setSubmitError('Only .zip files are accepted');
    }
  }, []);

  const policyBlocks = !staffBypass && attemptPolicy && attemptPolicy.allowed === false;

  const handleSubmit = async () => {
    if (!file || submitting || timerExpired || (!staffBypass && policyLoading) || policyBlocks) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createSubmission(id, file);
      if (user?.id) clearChallengeSession(user.id);
      const subId = result?.id || result?.submissionId;
      if (subId) {
        navigate(`/submissions/${subId}`);
      } else {
        navigate('/submissions');
      }
    } catch (e) {
      setSubmitError(e?.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  const diff = challenge?.difficulty?.toLowerCase() || 'easy';
  const diffBadge = {
    easy: 'ch-badge-easy', medium: 'ch-badge-medium',
    hard: 'ch-badge-hard', expert: 'ch-badge-expert',
  }[diff] ?? 'ch-badge-cat';

  if (loading) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
        <main className="chd-main"><div className="chd-loading">Loading challenge...</div></main>
        <BottomNav /><CustomCursor />
      </div>
    );
  }
  if (error || !challenge) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
        <main className="chd-main">
          <p className="chd-error">{error || 'Challenge not found'}</p>
          <button type="button" className="chd-btn-back" onClick={() => navigate('/challenges')}>
            Back to Challenges
          </button>
        </main>
        <BottomNav /><CustomCursor />
      </div>
    );
  }

  return (
    <div className="challenges-page chd-page">
      <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
      <main className="chd-main">
        <div className="chd-container">
          <button type="button" className="cs-back" onClick={() => navigate(`/challenges/${id}`)}>
            ← BACK TO CHALLENGE
          </button>

          {/* Límites de intentos — visibles de inmediato */}
          <section className="cs-attempts-hero" aria-labelledby="cs-attempts-title">
            <div className="cs-attempts-hero-head">
              <span className="cs-attempts-eyebrow">Fair play</span>
              <h2 id="cs-attempts-title" className="cs-attempts-title">
                Submission limits
              </h2>
              <p className="cs-attempts-lead">
                These rules apply to every student. They prevent XP farming and keep the leaderboard fair.
              </p>
            </div>
            {staffBypass && (
              <p className="cs-attempts-staff">Staff account: daily limits and cooldown are waived for your submissions.</p>
            )}
            {!staffBypass && policyLoading && (
              <p className="cs-attempts-loading">Loading your submission limits…</p>
            )}
            {!staffBypass && !policyLoading && attemptPolicy?.allowed && (
              <div className="cs-attempts-grid">
                <div className="cs-attempts-card">
                  <div className="cs-attempts-card-label">Daily submissions (UTC)</div>
                  <div className="cs-attempts-card-value" aria-live="polite">
                    <span className="cs-attempts-nums">{attemptPolicy.attemptsUsedToday}</span>
                    <span className="cs-attempts-slash">/</span>
                    <span className="cs-attempts-max">{attemptPolicy.maxAttemptsPerDay}</span>
                  </div>
                  <p className="cs-attempts-card-hint">
                    You can start at most {attemptPolicy.maxAttemptsPerDay} runs per challenge per calendar day (UTC).
                  </p>
                </div>
                <div className="cs-attempts-card">
                  <div className="cs-attempts-card-label">Cooldown between attempts</div>
                  <div className="cs-attempts-card-value cs-attempts-cooldown-val">
                    {challenge.timeLimitMinutes ?? 60}
                    <span className="cs-attempts-unit">min</span>
                  </div>
                  <p className="cs-attempts-card-hint">
                    After you start a run, you must wait this long before you can submit again for this challenge.
                  </p>
                </div>
              </div>
            )}
            {!staffBypass && !policyLoading && attemptPolicy && !attemptPolicy.allowed && attemptPolicy.blockReason === 'DAILY_LIMIT' && (
              <div className="cs-attempts-block cs-attempts-block-warn" role="alert">
                <strong>Daily limit reached</strong>
                <span>
                  You have used all {attemptPolicy.maxAttemptsPerDay} submissions for this challenge today (UTC).
                  Resets at {formatUtcHint(attemptPolicy.dailyLimitResetsAtIso)}.
                </span>
              </div>
            )}
            {!staffBypass && !policyLoading && attemptPolicy && !attemptPolicy.allowed && attemptPolicy.blockReason === 'COOLDOWN' && (
              <div className="cs-attempts-block cs-attempts-block-warn" role="alert">
                <strong>Cooldown active</strong>
                <span>
                  Wait until the cooldown window ends before submitting again. Next allowed:{' '}
                  {formatUtcHint(attemptPolicy.cooldownUntilIso)} (UTC).
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
                  {(challenge.origin || 'LEGACY') === 'COMMUNITY' ? 'Community' : 'Legacy'}
                </span>
                {challenge.featured && <span className="ch-badge ch-badge-new">Featured</span>}
              </div>

              <h1 className="cs-title">{challenge.title}</h1>
              <p className="cs-slug">/{challenge.slug}</p>

              <div className="cs-stats">
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.maxScore ?? 1000}</div>
                  <div className="cs-stat-label">MAX SCORE</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.timeLimitMinutes ?? 60}</div>
                  <div className="cs-stat-label">MINUTES</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.timesAttempted ?? 0}</div>
                  <div className="cs-stat-label">ATTEMPTS</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{challenge.timesCompleted ?? 0}</div>
                  <div className="cs-stat-label">COMPLETIONS</div>
                </div>
                <div className="cs-stat">
                  <div className="cs-stat-val">{Number(challenge.averageScore ?? 0).toFixed(1)}</div>
                  <div className="cs-stat-label">AVG SCORE</div>
                </div>
              </div>

              <Section title="Description">
                <p className="cs-desc">{challenge.description || 'No description available.'}</p>
              </Section>

              {hasContent(challenge.requiredEndpoints) && (
                <Section title="Required Endpoints">
                  <EndpointsTable data={challenge.requiredEndpoints} />
                </Section>
              )}

              {hasContent(challenge.requiredStatusCodes) && (
                <Section title="Required Status Codes">
                  <StatusCodesList data={challenge.requiredStatusCodes} />
                </Section>
              )}

              {hasContent(challenge.requiredHeaders) && (
                <Section title="Required Headers">
                  <GenericData data={challenge.requiredHeaders} />
                </Section>
              )}

              {hasContent(challenge.testSuite) && (
                <Section title="Test Suite">
                  <GenericData data={challenge.testSuite} />
                </Section>
              )}

              {hasContent(challenge.performanceRequirements) && (
                <Section title="Performance Requirements">
                  <PerformanceTable data={challenge.performanceRequirements} />
                </Section>
              )}

              {hasContent(challenge.designCriteria) && (
                <Section title="Design Criteria">
                  <GenericData data={challenge.designCriteria} />
                </Section>
              )}

              {hasContent(challenge.hints) && (
                <Section title="Hints">
                  <HintsAccordion hints={challenge.hints} />
                </Section>
              )}

              {hasContent(challenge.learningObjectives) && (
                <Section title="Learning Objectives">
                  <LearningObjectives data={challenge.learningObjectives} />
                </Section>
              )}
            </div>

            {/* Right column — Submit panel */}
            <div className="cs-panel">
              <div className="cs-panel-inner">
                {/* Timer */}
                <div className="cs-timer-section">
                  <div className="cs-timer-label">TIME REMAINING</div>
                  <div className={`cs-timer-display ${timerClass}`}>
                    {timerExpired ? "TIME'S UP" : formatTime(secondsLeft ?? 0)}
                  </div>
                  <div className="cs-timer-bar">
                    <div
                      className="cs-timer-fill"
                      style={{ width: `${timerPercent}%`, background: barColor }}
                    />
                  </div>
                  <p className="cs-timer-realtime-hint">
                    Timer runs in real time — even if you leave this page or close the tab.
                  </p>
                </div>

                {/* Dropzone */}
                <div className="cs-drop-section">
                  {!file ? (
                    <div
                      className={`cs-dropzone ${dragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="cs-dropzone-icon">📦</div>
                      <div className="cs-dropzone-text">Drop your .zip file here</div>
                      <div className="cs-dropzone-hint">or click to browse</div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                        tabIndex={-1}
                        aria-label="Choose ZIP file"
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
                <div className="cs-submit-section">
                  <button
                    type="button"
                    className="cs-submit-btn"
                    disabled={!file || submitting || timerExpired || (!staffBypass && policyLoading) || policyBlocks}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Submitting...' : 'Submit Solution'}
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
    </div>
  );
}
