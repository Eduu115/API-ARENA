import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, getSubmissionLogs } from '../../lib/submissionsApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import '../challenges/challenges.css';
import './submissions.css';

const TIMELINE_STEPS = ['PENDING', 'BUILDING', 'TESTING', 'COMPLETED'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-ES');
}

function parseTestLines(testLogs) {
  if (!testLogs) return [];
  return testLogs.split('\n')
    .filter(l => l.startsWith('[TEST]'))
    .map(line => {
      const pass = /PASS/i.test(line);
      const fail = /FAIL/i.test(line);
      const msMatch = line.match(/\((\d+)ms\)/);
      return {
        name: line.replace('[TEST] ', '').replace(/ PASS$| FAIL$/i, '').trim(),
        passed: pass && !fail,
        time: msMatch ? parseInt(msMatch[1]) : null,
      };
    });
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let pollTimer = null;

    async function load() {
      try {
        const [detail, logsData] = await Promise.all([
          getSubmissionById(id),
          getSubmissionLogs(id).catch(() => null),
        ]);
        if (cancelled) return;
        setSub(detail);
        setLogs(logsData);
        setLoading(false);

        if (detail.status !== 'COMPLETED' && detail.status !== 'FAILED') {
          pollTimer = setTimeout(load, 2000);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load submission');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; clearTimeout(pollTimer); };
  }, [id]);

  const tests = useMemo(() => parseTestLines(logs?.testLogs || sub?.testLogs), [logs, sub]);

  const scoreBreakdown = useMemo(() => {
    if (!sub) return [];
    return [
      { label: 'Correctness', value: Number(sub.correctnessScore) || 0, max: 500, color: 'var(--green)' },
      { label: 'Performance', value: Number(sub.performanceScore) || 0, max: 300, color: 'var(--cyan)' },
      { label: 'Design', value: Number(sub.designScore) || 0, max: 200, color: 'var(--purple)' },
    ];
  }, [sub]);

  const perfMetrics = useMemo(() => {
    if (!sub) return [];
    return [
      { label: 'Avg Response', value: sub.avgResponseMs != null ? `${sub.avgResponseMs}ms` : '—' },
      { label: 'P95 Response', value: sub.p95ResponseMs != null ? `${sub.p95ResponseMs}ms` : '—' },
      { label: 'P99 Response', value: sub.p99ResponseMs != null ? `${sub.p99ResponseMs}ms` : '—' },
      { label: 'Requests/sec', value: sub.rps != null ? sub.rps.toLocaleString() : '—' },
      { label: 'Total Requests', value: sub.totalRequests != null ? sub.totalRequests.toLocaleString() : '—' },
      { label: 'Failed Requests', value: sub.failedRequests != null ? String(sub.failedRequests) : '—' },
      { label: 'REST Compliance', value: sub.restComplianceScore != null ? `${Number(sub.restComplianceScore).toFixed(1)}%` : '—' },
    ];
  }, [sub]);

  if (loading) {
    return (
      <div className="challenges-page">
        <CustomCursor />
        <div className="ch-grid-bg" />
        <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
          <main className="ch-main">
            <div className="sd-container" style={{ padding: '60px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
              Loading submission...
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="challenges-page">
        <CustomCursor />
        <div className="ch-grid-bg" />
        <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
          <main className="ch-main">
            <div className="sd-container">
              <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error || 'Submission not found'}</p>
              <button className="sd-back-btn" onClick={() => navigate('/submissions')}>← BACK TO SUBMISSIONS</button>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  const stepIndex = TIMELINE_STEPS.indexOf(sub.status);
  const isFailed = sub.status === 'FAILED';
  const isProcessing = sub.status !== 'COMPLETED' && sub.status !== 'FAILED';
  const totalScore = Number(sub.totalScore) || 0;
  const buildLogs = logs?.buildLogs || '';
  const testLogs = logs?.testLogs || '';

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
        <main className="ch-main">
          <div className="sd-container">
            <button className="sd-back-btn" onClick={() => navigate('/submissions')}>
              ← BACK TO SUBMISSIONS
            </button>

            {/* Timeline */}
            <div className="sd-timeline">
              {TIMELINE_STEPS.map((step, i) => {
                const isDone = i < stepIndex || (i === stepIndex && sub.status === 'COMPLETED');
                const isActive = i === stepIndex && !isDone && !isFailed;
                const isFail = isFailed && i === stepIndex;
                return (
                  <div key={step} style={{ display: 'contents' }}>
                    <div className="sd-timeline-step">
                      <div className={`sd-timeline-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFail ? 'failed' : ''}`} />
                      <span className={`sd-timeline-label ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFail ? 'failed' : ''}`}>{step}</span>
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`sd-timeline-line ${isDone ? 'done' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hero */}
            <div className="sd-hero">
              <div className="sd-hero-top">
                <div>
                  <h1 className="sd-hero-title">Submission #{sub.id}</h1>
                  <div className="sd-hero-meta">
                    <span>Challenge #{sub.challengeId}</span>
                    <span>·</span>
                    <span>Created {formatDate(sub.createdAt)}</span>
                    {sub.completedAt && <><span>·</span><span>Completed {formatDate(sub.completedAt)}</span></>}
                  </div>
                </div>
                <div className="sd-total-score">
                  <div className="sd-total-score-val">{isProcessing ? '...' : totalScore.toFixed(1)}</div>
                  <div className="sd-total-score-label">/ 1000 POINTS</div>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            {!isProcessing && (
              <div className="sd-score-grid" style={{ marginBottom: 20 }}>
                {scoreBreakdown.map(s => {
                  const pct = s.max > 0 ? (s.value / s.max) * 100 : 0;
                  return (
                    <div key={s.label} className="sd-score-cell">
                      <div className="sd-score-cell-val" style={{ color: s.color }}>{s.value.toFixed(1)}</div>
                      <div className="sd-score-cell-label">{s.label}</div>
                      <div className="sd-score-cell-bar">
                        <div className="sd-score-cell-fill" style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                    </div>
                  );
                })}
                <div className="sd-score-cell">
                  <div className="sd-score-cell-val" style={{ color: 'var(--warn)' }}>{totalScore.toFixed(1)}</div>
                  <div className="sd-score-cell-label">Total</div>
                  <div className="sd-score-cell-bar">
                    <div className="sd-score-cell-fill" style={{ width: `${(totalScore / 1000) * 100}%`, background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Panels */}
            {!isProcessing && (
              <div className="sd-panels-grid">
                {/* Performance */}
                <div className="sd-panel">
                  <div className="sd-panel-head">
                    <div className="sd-panel-title">⚡ Performance Metrics</div>
                  </div>
                  <div className="sd-panel-body">
                    {perfMetrics.map(m => (
                      <div key={m.label} className="sd-perf-row">
                        <span className="sd-perf-label">{m.label}</span>
                        <span className="sd-perf-val">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test results */}
                <div className="sd-panel">
                  <div className="sd-panel-head">
                    <div className="sd-panel-title">✓ Test Results</div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {tests.filter(t => t.passed).length}/{tests.length} passed
                    </span>
                  </div>
                  <div className="sd-panel-body">
                    {tests.length > 0 ? tests.map((t, i) => (
                      <div key={i} className="sd-test-row">
                        <span className="sd-test-icon" style={{ color: t.passed ? 'var(--green)' : 'var(--red)' }}>
                          {t.passed ? '✓' : '✗'}
                        </span>
                        <span className="sd-test-name">{t.name}</span>
                        {t.time != null && <span className="sd-test-time">{t.time}ms</span>}
                      </div>
                    )) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>No test data available</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Logs */}
            {(buildLogs || testLogs || sub.errorMessage) && (
              <div className="sd-panels-grid" style={{ marginBottom: 20 }}>
                {buildLogs && (
                  <div className="sd-panel">
                    <div className="sd-panel-head">
                      <div className="sd-panel-title">🔨 Build Logs</div>
                    </div>
                    <div className="sd-panel-body">
                      <div className="sd-logs">{buildLogs}</div>
                    </div>
                  </div>
                )}
                {testLogs && (
                  <div className="sd-panel">
                    <div className="sd-panel-head">
                      <div className="sd-panel-title">🧪 Test Logs</div>
                    </div>
                    <div className="sd-panel-body">
                      <div className="sd-logs">{testLogs}</div>
                    </div>
                  </div>
                )}
                {sub.errorMessage && (
                  <div className="sd-panel sd-full-width">
                    <div className="sd-panel-head">
                      <div className="sd-panel-title" style={{ color: 'var(--red)' }}>⚠ Error</div>
                    </div>
                    <div className="sd-panel-body">
                      <div className="sd-logs" style={{ color: 'var(--red)' }}>{sub.errorMessage}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div style={{
                textAlign: 'center', padding: '40px 0',
                fontFamily: 'var(--font-mono)', fontSize: 14,
                color: 'var(--cyan)', letterSpacing: 2
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, animation: 'db-blink 1s ease-in-out infinite' }}>⚙</div>
                {sub.status === 'PENDING' && 'Waiting in queue...'}
                {sub.status === 'BUILDING' && 'Building your project...'}
                {sub.status === 'TESTING' && 'Running tests against your API...'}
              </div>
            )}

            {sub.status === 'COMPLETED' && (
              <div className="sd-continue-wrap">
                <button className="sd-continue-btn" onClick={() => navigate(`/submissions/${id}/results`)}>
                  CONTINUE
                  <span className="sd-continue-arrow">→</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
