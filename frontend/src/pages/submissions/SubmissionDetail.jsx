import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMySubmissions,
  getSubmissionById,
  getSubmissionLogs,
  applyTeacherManualScores,
  confirmTeacherPenalties,
  revokeTeacherPenalty,
  saveTeacherSubmissionReview,
} from '../../lib/submissionsApi';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import '../challenges/challenges.css';
import './submissions.css';

const TIMELINE_STEPS = ['PENDING', 'BUILDING', 'TESTING', 'COMPLETED'];

const TEACHER_PENALTY_PRESETS = [
  { key: 'WRONG_DELIVERABLE_NAME', label: 'Wrong deliverable / archive name', points: 40 },
  { key: 'SPELLING_AND_DOCS', label: 'Spelling and documentation issues', points: 15 },
  { key: 'CODE_DISORGANIZATION', label: 'Code disorganization / structure', points: 25 },
  { key: 'MISSING_README', label: 'Missing or broken README', points: 20 },
  { key: 'STYLE_AND_NAMING', label: 'Style and naming inconsistencies', points: 15 },
];

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

const PENALTY_REVOCATION_MS = 2 * 60 * 60 * 1000;

function penaltyRevocationDeadlineMs(p) {
  const iso = p?.confirmedAt || p?.appliedAt;
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t + PENALTY_REVOCATION_MS : null;
}

function formatMsAsCountdown(msLeft) {
  if (msLeft <= 0) return '0m';
  const totalMin = Math.ceil(msLeft / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function draftLabel(d) {
  const preset = TEACHER_PENALTY_PRESETS.find((x) => x.key === d.presetKey);
  if (d.presetKey === 'OTHER') {
    const pts = d.penaltyPoints != null ? Number(d.penaltyPoints) : '—';
    const desc = (d.customDescription || '').slice(0, 48) || '—';
    return `Other (−${pts} pts): ${desc}`;
  }
  if (preset) return `${preset.label} (−${preset.points} pts)`;
  return d.presetKey;
}

function normalizeAiReview(rawSuggestions, aiScoreRaw) {
  const aiScore = Number(aiScoreRaw) || 0;
  const source = rawSuggestions && typeof rawSuggestions === 'object' ? rawSuggestions : {};
  const summary = typeof source.summary === 'string' ? source.summary : 'No AI summary available for this submission.';
  const provider = typeof source.provider === 'string' ? source.provider : 'heuristic';
  const strengths = Array.isArray(source.strengths) ? source.strengths.filter(Boolean) : [];
  const suggestions = Array.isArray(source.suggestions) ? source.suggestions.filter(Boolean) : [];
  return { aiScore, summary, provider, strengths, suggestions };
}

function newBonusDraftRow() {
  const clientKey =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `bk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return { clientKey, id: '', points: '', label: '', note: '' };
}

function teacherReviewViewFromSubmission(s) {
  if (!s) return null;
  const zn = s.teacherZoneNotes && typeof s.teacherZoneNotes === 'object' ? s.teacherZoneNotes : {};
  const sf = s.teacherStructuredFeedback && typeof s.teacherStructuredFeedback === 'object'
    ? s.teacherStructuredFeedback
    : {};
  const personal = s.teacherPersonalNote && String(s.teacherPersonalNote).trim();
  const zoneList = [
    { key: 'correctness', label: 'Correctness' },
    { key: 'performance', label: 'Performance' },
    { key: 'design', label: 'Design' },
    { key: 'aiReview', label: 'AI review' },
  ]
    .map(({ key, label }) => ({ label, text: zn[key] ? String(zn[key]).trim() : '' }))
    .filter((z) => z.text);
  const summary = typeof sf.summary === 'string' ? sf.summary.trim() : '';
  const strengths = Array.isArray(sf.strengths) ? sf.strengths.filter(Boolean) : [];
  const suggestions = Array.isArray(sf.suggestions) ? sf.suggestions.filter(Boolean) : [];
  const bonusRows = Array.isArray(s.teacherScoreBonuses) ? s.teacherScoreBonuses : [];
  return { personal, zoneList, summary, strengths, suggestions, bonusRows };
}

function sumTeacherBonusPointsFromApiRows(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, b) => acc + (Number(b?.pointsAdded) || 0), 0);
}

function sumTeacherBonusPointsFromDraftRows(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, r) => {
    const p = Number(r?.points);
    return acc + (Number.isFinite(p) && p > 0 ? p : 0);
  }, 0);
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sub, setSub] = useState(null);
  const [submissionLabel, setSubmissionLabel] = useState('');
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [penaltyPresetKey, setPenaltyPresetKey] = useState('WRONG_DELIVERABLE_NAME');
  const [penaltyNote, setPenaltyNote] = useState('');
  const [otherPenaltyPoints, setOtherPenaltyPoints] = useState('');
  const [otherPenaltyDescription, setOtherPenaltyDescription] = useState('');
  const [manualC, setManualC] = useState('');
  const [manualP, setManualP] = useState('');
  const [manualD, setManualD] = useState('');
  const [manualA, setManualA] = useState('');
  const [teacherBusy, setTeacherBusy] = useState(false);
  const [teacherErr, setTeacherErr] = useState(null);
  const [penaltyDrafts, setPenaltyDrafts] = useState([]);
  const [penaltyClock, setPenaltyClock] = useState(() => Date.now());

  const [reviewPersonalNote, setReviewPersonalNote] = useState('');
  const [reviewZoneC, setReviewZoneC] = useState('');
  const [reviewZoneP, setReviewZoneP] = useState('');
  const [reviewZoneD, setReviewZoneD] = useState('');
  const [reviewZoneAi, setReviewZoneAi] = useState('');
  const [reviewSummary, setReviewSummary] = useState('');
  const [reviewStrengths, setReviewStrengths] = useState('');
  const [reviewSuggestions, setReviewSuggestions] = useState('');
  const [reviewBonuses, setReviewBonuses] = useState([]);
  const [reviewNotifyStudent, setReviewNotifyStudent] = useState(true);

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
        getMySubmissions()
          .then(items => {
            if (cancelled) return;
            const list = Array.isArray(items) ? items : [];
            const sameChallenge = list
              .filter(s => Number(s.challengeId) === Number(detail.challengeId))
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const idx = sameChallenge.findIndex(s => Number(s.id) === Number(detail.id));
            const attempt = idx >= 0 ? idx + 1 : null;
            const challengeName = (
              sameChallenge.find(s => Number(s.id) === Number(detail.id))?.challengeTitle ||
              `Challenge #${detail.challengeId}`
            );
            setSubmissionLabel(attempt ? `${challengeName} · Attempt ${attempt}` : challengeName);
          })
          .catch(() => {
            if (!cancelled) {
              setSubmissionLabel(`Challenge #${detail.challengeId}`);
            }
          });

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

  useEffect(() => {
    if (!sub) return;
    setManualC(String(Number(sub.correctnessScore) || 0));
    setManualP(String(Number(sub.performanceScore) || 0));
    setManualD(String(Number(sub.designScore) || 0));
    setManualA(String(Number(sub.aiReviewScore) || 0));
  }, [sub?.id, sub?.correctnessScore, sub?.performanceScore, sub?.designScore, sub?.aiReviewScore]);

  const tests = useMemo(() => parseTestLines(logs?.testLogs || sub?.testLogs), [logs, sub]);
  const aiReview = useMemo(
    () => normalizeAiReview(sub?.aiSuggestions, sub?.aiReviewScore),
    [sub]
  );

  const scoreBreakdown = useMemo(() => {
    if (!sub) return [];
    return [
      { label: 'Correctness', value: Number(sub.correctnessScore) || 0, max: 300, color: 'var(--green)' },
      { label: 'Performance', value: Number(sub.performanceScore) || 0, max: 300, color: 'var(--cyan)' },
      { label: 'Design', value: Number(sub.designScore) || 0, max: 200, color: 'var(--purple)' },
      { label: 'AI Review', value: aiReview.aiScore, max: 200, color: 'var(--warn)' },
    ];
  }, [sub, aiReview.aiScore]);

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

  const showTeacherTools = useMemo(() => {
    if (!sub || sub.status !== 'COMPLETED') return false;
    if (user?.role !== 'TEACHER') return false;
    return Boolean(sub.teacherCanEditSubmissionReview);
  }, [sub, user?.role]);

  const teacherReviewReader = useMemo(() => teacherReviewViewFromSubmission(sub), [sub]);

  const showTeacherReviewReader = useMemo(() => {
    if (!sub || !teacherReviewReader) return false;
    if (sub.status !== 'COMPLETED' && sub.status !== 'FAILED') return false;
    const v = teacherReviewReader;
    const has =
      v.personal ||
      v.zoneList.length > 0 ||
      v.summary ||
      v.strengths.length > 0 ||
      v.suggestions.length > 0 ||
      v.bonusRows.length > 0;
    if (!has) return false;
    if (user?.role === 'TEACHER' && sub.teacherCanEditSubmissionReview) return false;
    return true;
  }, [sub, teacherReviewReader, user?.role]);

  const reviewProjectedTotal = useMemo(() => {
    if (!sub) return null;
    const base = Number(sub.totalScore) || 0;
    const oldB = sumTeacherBonusPointsFromApiRows(sub.teacherScoreBonuses);
    const newB = sumTeacherBonusPointsFromDraftRows(reviewBonuses);
    return Math.round((base - oldB + newB) * 100) / 100;
  }, [sub, reviewBonuses]);

  useEffect(() => {
    const t = setInterval(() => setPenaltyClock(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setPenaltyDrafts([]);
  }, [id]);

  const teacherReviewHydrateKey = useMemo(() => {
    if (!sub) return '';
    return [
      sub.id,
      sub.teacherPersonalNote ?? '',
      JSON.stringify(sub.teacherZoneNotes ?? {}),
      JSON.stringify(sub.teacherStructuredFeedback ?? {}),
      JSON.stringify(sub.teacherScoreBonuses ?? []),
      Boolean(sub.teacherCanEditSubmissionReview),
    ].join('|');
  }, [sub]);

  useEffect(() => {
    if (!sub || user?.role !== 'TEACHER' || !sub.teacherCanEditSubmissionReview) {
      return;
    }
    const zn = sub.teacherZoneNotes && typeof sub.teacherZoneNotes === 'object' ? sub.teacherZoneNotes : {};
    setReviewPersonalNote(sub.teacherPersonalNote ? String(sub.teacherPersonalNote) : '');
    setReviewZoneC(zn.correctness ? String(zn.correctness) : '');
    setReviewZoneP(zn.performance ? String(zn.performance) : '');
    setReviewZoneD(zn.design ? String(zn.design) : '');
    setReviewZoneAi(zn.aiReview ? String(zn.aiReview) : '');
    const sf = sub.teacherStructuredFeedback && typeof sub.teacherStructuredFeedback === 'object'
      ? sub.teacherStructuredFeedback
      : {};
    setReviewSummary(typeof sf.summary === 'string' ? sf.summary : '');
    setReviewStrengths(Array.isArray(sf.strengths) ? sf.strengths.join('\n') : '');
    setReviewSuggestions(Array.isArray(sf.suggestions) ? sf.suggestions.join('\n') : '');
    const apiRows = Array.isArray(sub.teacherScoreBonuses) ? sub.teacherScoreBonuses : [];
    if (apiRows.length === 0) {
      setReviewBonuses([newBonusDraftRow()]);
    } else {
      setReviewBonuses(
        apiRows.map((b) => ({
          clientKey:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `bk-${b?.id || Math.random()}`,
          id: b?.id ? String(b.id) : '',
          points: b?.pointsAdded != null ? String(b.pointsAdded) : '',
          label: b?.label != null ? String(b.label) : '',
          note: b?.note != null ? String(b.note) : '',
        })),
      );
    }
    setReviewNotifyStudent(true);
  }, [teacherReviewHydrateKey, user?.role]);

  function buildPenaltyBodyFromForm() {
    const body = { presetKey: penaltyPresetKey, customNote: penaltyNote.trim() || undefined };
    if (penaltyPresetKey === 'OTHER') {
      body.penaltyPoints = Number(otherPenaltyPoints);
      body.customDescription = otherPenaltyDescription.trim();
    }
    return body;
  }

  function handleAddPenaltyDraft(ev) {
    ev.preventDefault();
    setTeacherErr(null);
    if (penaltyPresetKey === 'OTHER') {
      const pts = Number(otherPenaltyPoints);
      if (!Number.isFinite(pts) || pts <= 0) {
        setTeacherErr('Enter a valid number of points to deduct for “Other”.');
        return;
      }
      if (!otherPenaltyDescription.trim()) {
        setTeacherErr('Short description is required for “Other”.');
        return;
      }
    }
    const b = buildPenaltyBodyFromForm();
    const localId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `d-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setPenaltyDrafts((rows) => [...rows, { localId, ...b }]);
    setPenaltyNote('');
    setOtherPenaltyPoints('');
    setOtherPenaltyDescription('');
  }

  function handleRemovePenaltyDraft(localId) {
    setPenaltyDrafts((rows) => rows.filter((r) => r.localId !== localId));
  }

  async function handleConfirmPenaltyDrafts() {
    if (!id || penaltyDrafts.length === 0) return;
    setTeacherErr(null);
    setTeacherBusy(true);
    try {
      const penalties = penaltyDrafts.map(({ localId, ...rest }) => rest);
      const updated = await confirmTeacherPenalties(id, { penalties });
      setSub(updated);
      setPenaltyDrafts([]);
    } catch (err) {
      setTeacherErr(err?.message || 'Could not confirm penalties');
    } finally {
      setTeacherBusy(false);
    }
  }

  async function handleRevokePenalty(penaltyId) {
    if (!id || !penaltyId) return;
    setTeacherErr(null);
    setTeacherBusy(true);
    try {
      const updated = await revokeTeacherPenalty(id, penaltyId);
      setSub(updated);
    } catch (err) {
      setTeacherErr(err?.message || 'Could not remove penalty');
    } finally {
      setTeacherBusy(false);
    }
  }

  function canRevokeStoredPenalty(p) {
    if (!p?.id || !sub?.teacherCanApplyPenalty) return false;
    const end = penaltyRevocationDeadlineMs(p);
    if (end == null) return false;
    return penaltyClock < end;
  }

  async function handleManualSubmit(ev) {
    ev.preventDefault();
    if (!id) return;
    setTeacherErr(null);
    setTeacherBusy(true);
    try {
      const updated = await applyTeacherManualScores(id, {
        correctnessScore: Number(manualC),
        performanceScore: Number(manualP),
        designScore: Number(manualD),
        aiReviewScore: Number(manualA),
      });
      setSub(updated);
    } catch (err) {
      setTeacherErr(err?.message || 'Could not save manual scores');
    } finally {
      setTeacherBusy(false);
    }
  }

  function handleAddBonusRow() {
    setReviewBonuses((rows) => [...rows, newBonusDraftRow()]);
  }

  function handleRemoveBonusRow(clientKey) {
    setReviewBonuses((rows) => {
      const next = rows.filter((r) => r.clientKey !== clientKey);
      return next.length ? next : [newBonusDraftRow()];
    });
  }

  function buildTeacherReviewPayload() {
    const zoneNotes = {};
    if (reviewZoneC.trim()) zoneNotes.correctness = reviewZoneC.trim();
    if (reviewZoneP.trim()) zoneNotes.performance = reviewZoneP.trim();
    if (reviewZoneD.trim()) zoneNotes.design = reviewZoneD.trim();
    if (reviewZoneAi.trim()) zoneNotes.aiReview = reviewZoneAi.trim();

    const strengths = reviewStrengths
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const suggestions = reviewSuggestions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    let structuredFeedback;
    if (reviewSummary.trim() || strengths.length || suggestions.length) {
      structuredFeedback = {};
      if (reviewSummary.trim()) structuredFeedback.summary = reviewSummary.trim();
      if (strengths.length) structuredFeedback.strengths = strengths;
      if (suggestions.length) structuredFeedback.suggestions = suggestions;
    }

    const bonuses = reviewBonuses
      .map((r) => {
        const pts = Number(r.points);
        if (!Number.isFinite(pts) || pts <= 0) return null;
        const line = { points: pts };
        if (r.id && String(r.id).trim()) line.id = String(r.id).trim();
        if (r.label && r.label.trim()) line.label = r.label.trim();
        if (r.note && r.note.trim()) line.note = r.note.trim();
        return line;
      })
      .filter(Boolean);

    return {
      personalNote: reviewPersonalNote.trim() || undefined,
      zoneNotes: Object.keys(zoneNotes).length ? zoneNotes : undefined,
      structuredFeedback,
      bonuses,
      notifyStudent: reviewNotifyStudent,
    };
  }

  async function handleSaveTeacherReview(ev) {
    ev.preventDefault();
    if (!id || !sub?.teacherCanEditSubmissionReview) return;
    const projected = reviewProjectedTotal;
    if (projected != null && projected > 1000 + 1e-6) {
      setTeacherErr('Total score after bonuses cannot exceed 1000. Reduce bonus points or remove lines.');
      return;
    }
    setTeacherErr(null);
    setTeacherBusy(true);
    try {
      const updated = await saveTeacherSubmissionReview(id, buildTeacherReviewPayload());
      setSub(updated);
    } catch (err) {
      setTeacherErr(err?.message || 'Could not save teacher review');
    } finally {
      setTeacherBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="challenges-page">
        <CustomCursor />
        <div className="ch-grid-bg" />
        <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
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
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
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
  const headerLabel = submissionLabel || `Challenge #${sub.challengeId}`;

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
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
                  <Fragment key={step}>
                    <div className="sd-timeline-step">
                      <div className={`sd-timeline-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFail ? 'failed' : ''}`} />
                      <span className={`sd-timeline-label ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFail ? 'failed' : ''}`}>{step}</span>
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`sd-timeline-line ${isDone ? 'done' : ''}`} />
                    )}
                  </Fragment>
                );
              })}
            </div>

            {/* Hero */}
            <div className="sd-hero">
              <div className="sd-hero-top">
                <div>
                  <h1 className="sd-hero-title">{headerLabel}</h1>
                  <div className="sd-hero-meta">
                    <span>Submission #{sub.id}</span>
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
              </div>
            )}

            {!isProcessing && Array.isArray(sub.teacherPenalties) && sub.teacherPenalties.length > 0 && (
              <div className="sd-panel" style={{ marginBottom: 20 }}>
                <div className="sd-panel-head">
                  <div className="sd-panel-title">Teacher score adjustments</div>
                </div>
                <div className="sd-panel-body" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  <ul className="sd-teacher-applied-list">
                    {sub.teacherPenalties.map((p, idx) => {
                      const end = penaltyRevocationDeadlineMs(p);
                      const canRev = canRevokeStoredPenalty(p);
                      const msLeft = end != null ? end - penaltyClock : 0;
                      return (
                        <li key={p.id || `pen-${idx}`} className="sd-teacher-applied-row">
                          <div className="sd-teacher-applied-main">
                            <span style={{ color: 'var(--warn)' }}>
                              −{p.pointsDeducted != null ? Number(p.pointsDeducted).toFixed(1) : '—'} pts
                            </span>
                            {' · '}
                            {typeof p.label === 'string' ? p.label : p.presetKey}
                            {p.customDescription ? ` — ${p.customDescription}` : ''}
                            {p.note ? ` (note: ${p.note})` : ''}
                            {p.appliedAt ? (
                              <span style={{ color: 'var(--dim)' }}> · {formatDate(p.appliedAt)}</span>
                            ) : null}
                            {p.id && end != null && user?.role === 'TEACHER' && sub.teacherCanApplyPenalty && (
                              <span className="sd-teacher-lock-hint">
                                {canRev
                                  ? ` · removable for ${formatMsAsCountdown(msLeft)}`
                                  : ' · locked (2h window ended)'}
                              </span>
                            )}
                          </div>
                          {canRev && (
                            <button
                              type="button"
                              className="sd-teacher-revoke-btn"
                              disabled={teacherBusy}
                              onClick={() => handleRevokePenalty(p.id)}
                            >
                              Remove
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            {showTeacherTools && (
              <div className="sd-panel sd-teacher-panel" style={{ marginBottom: 20 }}>
                <div className="sd-panel-head">
                  <div className="sd-panel-title">Teacher grading</div>
                </div>
                <div className="sd-panel-body sd-teacher-panel-body">
                  {teacherErr && (
                    <div className="sd-teacher-alert">{teacherErr}</div>
                  )}
                  {sub.teacherManualGrading && (
                    <div className="sd-teacher-warn">
                      Manual scores have been applied to this submission (totals reflect teacher grading).
                    </div>
                  )}
                  <div className="sd-teacher-grade-shell">
                    {sub.teacherCanApplyPenalty && (
                      <div className="sd-teacher-form">
                        <div className="sd-teacher-section">
                          <h3 className="sd-teacher-section-title">Penalize score</h3>
                          <p className="sd-teacher-hint">
                            Add issues to your draft and remove any line before you confirm. Once confirmed, each line
                            can be removed for <strong>2 hours</strong> only; after that it is locked. You can always read the
                            history above.
                          </p>
                          <div className="sd-teacher-field">
                            <span className="sd-teacher-label" id="sd-penalty-type-label">Issue type</span>
                            <select
                              className="sd-teacher-select"
                              aria-labelledby="sd-penalty-type-label"
                              value={penaltyPresetKey}
                              onChange={(e) => setPenaltyPresetKey(e.target.value)}
                            >
                              {TEACHER_PENALTY_PRESETS.map((p) => (
                                <option key={p.key} value={p.key}>
                                  {p.label} (−{p.points} pts)
                                </option>
                              ))}
                              <option value="OTHER">Other (custom description &amp; points)</option>
                            </select>
                          </div>
                          {penaltyPresetKey === 'OTHER' && (
                            <div className="sd-teacher-other-grid">
                              <div className="sd-teacher-field">
                                <span className="sd-teacher-label">Points to deduct</span>
                                <input
                                  type="number"
                                  className="sd-teacher-input"
                                  min="0.01"
                                  step="0.01"
                                  max="300"
                                  placeholder="e.g. 25"
                                  value={otherPenaltyPoints}
                                  onChange={(e) => setOtherPenaltyPoints(e.target.value)}
                                />
                              </div>
                              <div className="sd-teacher-field sd-teacher-field--grow">
                                <span className="sd-teacher-label">Short description</span>
                                <textarea
                                  className="sd-teacher-textarea"
                                  placeholder="What went wrong (visible on the adjustment record)"
                                  value={otherPenaltyDescription}
                                  onChange={(e) => setOtherPenaltyDescription(e.target.value)}
                                  rows={4}
                                />
                              </div>
                            </div>
                          )}
                          <div className="sd-teacher-field">
                            <span className="sd-teacher-label" id="sd-penalty-note-label">Optional note</span>
                            <input
                              type="text"
                              className="sd-teacher-input"
                              placeholder="Internal note (stored on the penalty record)"
                              value={penaltyNote}
                              onChange={(e) => setPenaltyNote(e.target.value)}
                              aria-labelledby="sd-penalty-note-label"
                            />
                          </div>
                        </div>
                        <div className="sd-teacher-actions sd-teacher-actions--start">
                          <button
                            type="button"
                            className="sd-teacher-primary-btn sd-teacher-primary-btn--secondary"
                            disabled={teacherBusy}
                            onClick={handleAddPenaltyDraft}
                          >
                            Add to draft
                          </button>
                        </div>
                        {penaltyDrafts.length > 0 && (
                          <>
                            <ul className="sd-teacher-draft-list" aria-label="Penalty draft">
                              {penaltyDrafts.map((d) => (
                                <li key={d.localId} className="sd-teacher-draft-row">
                                  <span className="sd-teacher-draft-text">{draftLabel(d)}</span>
                                  <button
                                    type="button"
                                    className="sd-teacher-ghost-btn"
                                    disabled={teacherBusy}
                                    onClick={() => handleRemovePenaltyDraft(d.localId)}
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                            <div className="sd-teacher-actions">
                              <button
                                type="button"
                                className="sd-teacher-primary-btn"
                                disabled={teacherBusy}
                                onClick={handleConfirmPenaltyDrafts}
                              >
                                {penaltyDrafts.length === 1
                                  ? 'Confirm 1 penalty'
                                  : `Confirm ${penaltyDrafts.length} penalties`}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {sub.teacherCanManualGrade && (
                      <form className="sd-teacher-form" onSubmit={handleManualSubmit}>
                        <div className={`sd-teacher-section${sub.teacherCanApplyPenalty ? ' sd-teacher-section--divider' : ''}`}>
                          <h3 className="sd-teacher-section-title">Manual grading (group student)</h3>
                          <div className="sd-teacher-manual-grid">
                            {[
                              ['Correctness (0–300)', manualC, setManualC],
                              ['Performance (0–300)', manualP, setManualP],
                              ['Design (0–200)', manualD, setManualD],
                              ['AI review (0–200)', manualA, setManualA],
                            ].map(([label, val, setVal]) => (
                              <label key={label} className="sd-teacher-field">
                                <span className="sd-teacher-label">{label}</span>
                                <input
                                  type="number"
                                  className="sd-teacher-input"
                                  step="0.01"
                                  min="0"
                                  value={val}
                                  onChange={(e) => setVal(e.target.value)}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="sd-teacher-actions">
                          <button
                            type="submit"
                            className="sd-teacher-primary-btn sd-teacher-primary-btn--secondary"
                            disabled={teacherBusy}
                          >
                            Save manual scores
                          </button>
                        </div>
                      </form>
                    )}
                    {sub.teacherCanEditSubmissionReview && (
                      <form className="sd-teacher-form" onSubmit={handleSaveTeacherReview}>
                        <div
                          className={`sd-teacher-section${
                            sub.teacherCanApplyPenalty || sub.teacherCanManualGrade
                              ? ' sd-teacher-section--divider'
                              : ''
                          }`}
                        >
                          <h3 className="sd-teacher-section-title">Submission review &amp; score bonuses</h3>
                          <p className="sd-teacher-hint">
                            Notes and structured feedback are visible to the student. Bonus lines add points (max 1000
                            total); you can change or remove lines anytime—unlike penalties, there is no 2-hour lock.
                          </p>
                          {reviewProjectedTotal != null && (
                            <p
                              className="sd-teacher-hint"
                              style={{
                                color: reviewProjectedTotal > 1000 ? 'var(--red)' : 'var(--cyan)',
                              }}
                            >
                              Projected total score:{' '}
                              <strong>{reviewProjectedTotal.toFixed(2)}</strong> / 1000
                            </p>
                          )}
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">Personal note to student</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={4}
                              value={reviewPersonalNote}
                              onChange={(e) => setReviewPersonalNote(e.target.value)}
                              placeholder="Overall comment for this submission"
                            />
                          </label>
                          <div className="sd-teacher-manual-grid">
                            {[
                              ['Correctness (note)', reviewZoneC, setReviewZoneC],
                              ['Performance (note)', reviewZoneP, setReviewZoneP],
                              ['Design (note)', reviewZoneD, setReviewZoneD],
                              ['AI review (note)', reviewZoneAi, setReviewZoneAi],
                            ].map(([label, val, setVal]) => (
                              <label key={label} className="sd-teacher-field">
                                <span className="sd-teacher-label">{label}</span>
                                <textarea
                                  className="sd-teacher-textarea"
                                  rows={3}
                                  value={val}
                                  onChange={(e) => setVal(e.target.value)}
                                  placeholder="Short feedback for this scoring area"
                                />
                              </label>
                            ))}
                          </div>
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">Structured summary</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={3}
                              value={reviewSummary}
                              onChange={(e) => setReviewSummary(e.target.value)}
                              placeholder="High-level summary (similar to AI review)"
                            />
                          </label>
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">Strengths (one per line)</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={4}
                              value={reviewStrengths}
                              onChange={(e) => setReviewStrengths(e.target.value)}
                              placeholder="Bullet-style strengths"
                            />
                          </label>
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">Suggestions (one per line)</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={4}
                              value={reviewSuggestions}
                              onChange={(e) => setReviewSuggestions(e.target.value)}
                              placeholder="What to improve next"
                            />
                          </label>
                          <div className="sd-teacher-section" style={{ marginTop: 12 }}>
                            <span className="sd-teacher-label">Positive score lines (optional)</span>
                            <ul className="sd-teacher-bonus-list" aria-label="Bonus lines">
                              {reviewBonuses.map((row) => (
                                <li key={row.clientKey} className="sd-teacher-bonus-row">
                                  <input
                                    type="number"
                                    className="sd-teacher-input"
                                    min="0.01"
                                    max="100"
                                    step="0.01"
                                    placeholder="Pts"
                                    value={row.points}
                                    onChange={(e) =>
                                      setReviewBonuses((prev) =>
                                        prev.map((r) =>
                                          r.clientKey === row.clientKey
                                            ? { ...r, points: e.target.value }
                                            : r,
                                        ),
                                      )
                                    }
                                  />
                                  <input
                                    type="text"
                                    className="sd-teacher-input"
                                    placeholder="Label"
                                    value={row.label}
                                    onChange={(e) =>
                                      setReviewBonuses((prev) =>
                                        prev.map((r) =>
                                          r.clientKey === row.clientKey
                                            ? { ...r, label: e.target.value }
                                            : r,
                                        ),
                                      )
                                    }
                                  />
                                  <input
                                    type="text"
                                    className="sd-teacher-input sd-teacher-input--grow"
                                    placeholder="Note (optional)"
                                    value={row.note}
                                    onChange={(e) =>
                                      setReviewBonuses((prev) =>
                                        prev.map((r) =>
                                          r.clientKey === row.clientKey
                                            ? { ...r, note: e.target.value }
                                            : r,
                                        ),
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="sd-teacher-ghost-btn"
                                    disabled={teacherBusy}
                                    onClick={() => handleRemoveBonusRow(row.clientKey)}
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                            <div className="sd-teacher-actions sd-teacher-actions--start">
                              <button
                                type="button"
                                className="sd-teacher-primary-btn sd-teacher-primary-btn--secondary"
                                disabled={teacherBusy}
                                onClick={handleAddBonusRow}
                              >
                                Add bonus line
                              </button>
                            </div>
                          </div>
                          <label className="sd-teacher-field sd-teacher-field--inline">
                            <input
                              type="checkbox"
                              checked={reviewNotifyStudent}
                              onChange={(e) => setReviewNotifyStudent(e.target.checked)}
                            />
                            <span className="sd-teacher-label" style={{ marginBottom: 0 }}>
                              Notify student in-app when saving
                            </span>
                          </label>
                        </div>
                        <div className="sd-teacher-actions">
                          <button type="submit" className="sd-teacher-primary-btn" disabled={teacherBusy}>
                            Save review &amp; bonuses
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && (
              <div className="sd-panel sd-ai-panel">
                <div className="sd-panel-head">
                  <div className="sd-panel-title">AI Review</div>
                  <span className="sd-ai-provider">Provider: {aiReview.provider}</span>
                </div>
                <div className="sd-panel-body">
                  <div className="sd-ai-score-wrap">
                    <div className="sd-ai-score-label">AI SCORE</div>
                    <div className="sd-ai-score-value">{aiReview.aiScore.toFixed(1)} / 200</div>
                  </div>
                  <p className="sd-ai-summary">{aiReview.summary}</p>
                  <div className="sd-ai-columns">
                    <div>
                      <div className="sd-ai-col-title">Strengths</div>
                      {aiReview.strengths.length ? (
                        <ul className="sd-ai-list">
                          {aiReview.strengths.map((item, idx) => <li key={`str-${idx}`}>{item}</li>)}
                        </ul>
                      ) : (
                        <div className="sd-ai-empty">No strengths provided.</div>
                      )}
                    </div>
                    <div>
                      <div className="sd-ai-col-title">Suggestions</div>
                      {aiReview.suggestions.length ? (
                        <ul className="sd-ai-list">
                          {aiReview.suggestions.map((item, idx) => <li key={`sug-${idx}`}>{item}</li>)}
                        </ul>
                      ) : (
                        <div className="sd-ai-empty">No suggestions provided.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && showTeacherReviewReader && teacherReviewReader && (
              <div className="sd-panel sd-ai-panel sd-teacher-feedback-panel" style={{ marginBottom: 20 }}>
                <div className="sd-panel-head">
                  <div className="sd-panel-title">Teacher review</div>
                </div>
                <div className="sd-panel-body">
                  {teacherReviewReader.personal && (
                    <p className="sd-ai-summary">{teacherReviewReader.personal}</p>
                  )}
                  {teacherReviewReader.zoneList.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      {teacherReviewReader.zoneList.map((z) => (
                        <div key={z.label} style={{ marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          <div style={{ color: 'var(--cyan)' }}>{z.label}</div>
                          <p style={{ margin: '4px 0 0', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{z.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {teacherReviewReader.summary && (
                    <p
                      className="sd-ai-summary"
                      style={{
                        marginTop:
                          teacherReviewReader.personal || teacherReviewReader.zoneList.length > 0 ? 12 : 0,
                      }}
                    >
                      {teacherReviewReader.summary}
                    </p>
                  )}
                  {(teacherReviewReader.strengths.length > 0 || teacherReviewReader.suggestions.length > 0) && (
                    <div className="sd-ai-columns">
                      <div>
                        <div className="sd-ai-col-title">Strengths</div>
                        {teacherReviewReader.strengths.length ? (
                          <ul className="sd-ai-list">
                            {teacherReviewReader.strengths.map((item, idx) => (
                              <li key={`tstr-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="sd-ai-empty">—</div>
                        )}
                      </div>
                      <div>
                        <div className="sd-ai-col-title">Suggestions</div>
                        {teacherReviewReader.suggestions.length ? (
                          <ul className="sd-ai-list">
                            {teacherReviewReader.suggestions.map((item, idx) => (
                              <li key={`tsug-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="sd-ai-empty">—</div>
                        )}
                      </div>
                    </div>
                  )}
                  {teacherReviewReader.bonusRows.length > 0 && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                    >
                      <div style={{ color: 'var(--green)', marginBottom: 8 }}>Score bonuses</div>
                      <ul className="sd-teacher-applied-list">
                        {teacherReviewReader.bonusRows.map((b, idx) => (
                          <li key={b.id || `tb-${idx}`} className="sd-teacher-applied-row">
                            <div className="sd-teacher-applied-main">
                              <span style={{ color: 'var(--green)' }}>
                                +{b.pointsAdded != null ? Number(b.pointsAdded).toFixed(1) : '—'} pts
                              </span>
                              {b.label ? ` · ${b.label}` : ''}
                              {b.note ? ` — ${b.note}` : ''}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div style={{ color: 'var(--dim)', marginTop: 8 }}>
                        Total bonus: +
                        {sumTeacherBonusPointsFromApiRows(teacherReviewReader.bonusRows).toFixed(1)} pts
                      </div>
                    </div>
                  )}
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
