import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as challengesApi from '../../lib/challengesApi';
import { createSubmission } from '../../lib/submissionsApi';
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

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [totalSeconds, setTotalSeconds] = useState(null);
  const [timerDone, setTimerDone] = useState(false);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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
          const total = (data.timeLimitMinutes ?? 60) * 60;
          setTotalSeconds(total);
          setSecondsLeft(total);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Error loading challenge');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (secondsLeft === null || timerDone) return;
    if (secondsLeft <= 0) {
      setTimerDone(true);
      return;
    }
    const t = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { setTimerDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft, timerDone]);

  const timerClass = timerDone
    ? 'cs-timer-done'
    : secondsLeft <= 60
      ? 'cs-timer-danger'
      : secondsLeft <= 300
        ? 'cs-timer-warn'
        : 'cs-timer-normal';

  const timerPercent = totalSeconds ? ((secondsLeft ?? 0) / totalSeconds) * 100 : 100;
  const barColor = timerDone
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

  const handleSubmit = async () => {
    if (!file || submitting || timerDone) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createSubmission(id, file);
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
                    {timerDone ? "TIME'S UP" : formatTime(secondsLeft ?? 0)}
                  </div>
                  <div className="cs-timer-bar">
                    <div
                      className="cs-timer-fill"
                      style={{ width: `${timerPercent}%`, background: barColor }}
                    />
                  </div>
                </div>

                {/* Dropzone */}
                <div className="cs-drop-section">
                  {!file ? (
                    <div
                      className={`cs-dropzone ${dragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
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
                        onClick={() => { setFile(null); setSubmitError(null); }}
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
                    disabled={!file || submitting || timerDone}
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
