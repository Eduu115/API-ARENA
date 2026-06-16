import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
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

function IconBuildLogsTitle() {
  return (
    <svg className="sd-panel-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconTestLogsTitle() {
  return (
    <svg className="sd-panel-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 4.5h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 4.5h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

const TIMELINE_STEPS = ['PENDING', 'BUILDING', 'TESTING', 'COMPLETED'];

const PENALTY_PRESET_DEFS = [
  { key: 'WRONG_DELIVERABLE_NAME', points: 40 },
  { key: 'SPELLING_AND_DOCS', points: 15 },
  { key: 'CODE_DISORGANIZATION', points: 25 },
  { key: 'MISSING_README', points: 20 },
  { key: 'STYLE_AND_NAMING', points: 15 },
];

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

function buildPenaltyPresets(t) {
  return PENALTY_PRESET_DEFS.map(({ key, points }) => ({
    key,
    points,
    label: t(`detail.penalize.presets.${key}`),
  }));
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

function draftLabel(d, t, penaltyPresets) {
  const preset = penaltyPresets.find((x) => x.key === d.presetKey);
  if (d.presetKey === 'OTHER') {
    const pts = d.penaltyPoints != null ? Number(d.penaltyPoints) : '—';
    const desc = (d.customDescription || '').slice(0, 48) || '—';
    return t('detail.penalize.draftOther', { pts, desc });
  }
  if (preset) return t('detail.penalize.draftPreset', { label: preset.label, pts: preset.points });
  return d.presetKey;
}

function normalizeAiReview(rawSuggestions, aiScoreRaw, t) {
  const aiScore = Number(aiScoreRaw) || 0;
  const source = rawSuggestions && typeof rawSuggestions === 'object' ? rawSuggestions : {};
  const summary = typeof source.summary === 'string' ? source.summary : t('detail.ai.noSummary');
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

function teacherReviewViewFromSubmission(s, t) {
  if (!s) return null;
  const zn = s.teacherZoneNotes && typeof s.teacherZoneNotes === 'object' ? s.teacherZoneNotes : {};
  const sf = s.teacherStructuredFeedback && typeof s.teacherStructuredFeedback === 'object'
    ? s.teacherStructuredFeedback
    : {};
  const personal = s.teacherPersonalNote && String(s.teacherPersonalNote).trim();
  const zoneList = [
    { key: 'correctness', label: t('detail.teacherReview.zoneCorrectness') },
    { key: 'performance', label: t('detail.teacherReview.zonePerformance') },
    { key: 'design', label: t('detail.teacherReview.zoneDesign') },
    { key: 'aiReview', label: t('detail.teacherReview.zoneAi') },
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
  const { t, i18n } = useTranslation('submissions');

  const penaltyPresets = useMemo(() => buildPenaltyPresets(t), [t]);

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
              t('detail.challengeFallback', { id: detail.challengeId })
            );
            setSubmissionLabel(
              attempt
                ? t('detail.attemptLabel', { name: challengeName, n: attempt })
                : challengeName,
            );
          })
          .catch(() => {
            if (!cancelled) {
              setSubmissionLabel(t('detail.challengeFallback', { id: detail.challengeId }));
            }
          });

        if (detail.status !== 'COMPLETED' && detail.status !== 'FAILED') {
          pollTimer = setTimeout(load, 2000);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || t('detail.loadError'));
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; clearTimeout(pollTimer); };
  }, [id, t]);

  useEffect(() => {
    if (!sub) return;
    setManualC(String(Number(sub.correctnessScore) || 0));
    setManualP(String(Number(sub.performanceScore) || 0));
    setManualD(String(Number(sub.designScore) || 0));
    setManualA(String(Number(sub.aiReviewScore) || 0));
  }, [sub?.id, sub?.correctnessScore, sub?.performanceScore, sub?.designScore, sub?.aiReviewScore]);

  const tests = useMemo(() => parseTestLines(logs?.testLogs || sub?.testLogs), [logs, sub]);
  const aiReview = useMemo(
    () => normalizeAiReview(sub?.aiSuggestions, sub?.aiReviewScore, t),
    [sub, t],
  );

  const scoreBreakdown = useMemo(() => {
    if (!sub) return [];
    return [
      { label: t('detail.score.correctness'), value: Number(sub.correctnessScore) || 0, max: 300, color: 'var(--green)' },
      { label: t('detail.score.performance'), value: Number(sub.performanceScore) || 0, max: 300, color: 'var(--cyan)' },
      { label: t('detail.score.design'), value: Number(sub.designScore) || 0, max: 200, color: 'var(--purple)' },
      { label: t('detail.score.aiReview'), value: aiReview.aiScore, max: 200, color: 'var(--warn)' },
    ];
  }, [sub, aiReview.aiScore, t]);

  const perfMetrics = useMemo(() => {
    if (!sub) return [];
    return [
      { label: t('detail.perf.avgResponse'), value: sub.avgResponseMs != null ? `${sub.avgResponseMs}ms` : '—' },
      { label: t('detail.perf.p95Response'), value: sub.p95ResponseMs != null ? `${sub.p95ResponseMs}ms` : '—' },
      { label: t('detail.perf.p99Response'), value: sub.p99ResponseMs != null ? `${sub.p99ResponseMs}ms` : '—' },
      { label: t('detail.perf.rps'), value: sub.rps != null ? sub.rps.toLocaleString(i18n.language) : '—' },
      { label: t('detail.perf.totalRequests'), value: sub.totalRequests != null ? sub.totalRequests.toLocaleString(i18n.language) : '—' },
      { label: t('detail.perf.failedRequests'), value: sub.failedRequests != null ? String(sub.failedRequests) : '—' },
      { label: t('detail.perf.restCompliance'), value: sub.restComplianceScore != null ? `${Number(sub.restComplianceScore).toFixed(1)}%` : '—' },
    ];
  }, [sub, t, i18n.language]);

  const showTeacherTools = useMemo(() => {
    if (!sub || sub.status !== 'COMPLETED') return false;
    if (user?.role !== 'TEACHER') return false;
    return Boolean(sub.teacherCanEditSubmissionReview);
  }, [sub, user?.role]);

  const teacherReviewReader = useMemo(() => teacherReviewViewFromSubmission(sub, t), [sub, t]);

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
        setTeacherErr(t('detail.penalize.errOtherPoints'));
        return;
      }
      if (!otherPenaltyDescription.trim()) {
        setTeacherErr(t('detail.penalize.errOtherDesc'));
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
      setTeacherErr(err?.message || t('detail.penalize.errConfirm'));
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
      setTeacherErr(err?.message || t('detail.penalize.errRevoke'));
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
      setTeacherErr(err?.message || t('detail.manual.errSave'));
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
      setTeacherErr(t('detail.review.errMaxTotal'));
      return;
    }
    setTeacherErr(null);
    setTeacherBusy(true);
    try {
      const updated = await saveTeacherSubmissionReview(id, buildTeacherReviewPayload());
      setSub(updated);
    } catch (err) {
      setTeacherErr(err?.message || t('detail.review.errSave'));
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
              {t('detail.loading')}
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
              <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error || t('detail.notFound')}</p>
              <button className="sd-back-btn" onClick={() => navigate('/submissions')}>{t('detail.backToSubmissions')}</button>
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
  const headerLabel = submissionLabel || t('detail.challengeFallback', { id: sub.challengeId });

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main">
          <div className="sd-container">
            <button className="sd-back-btn" onClick={() => navigate('/submissions')}>
              {t('detail.backToSubmissions')}
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
                      <span className={`sd-timeline-label ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFail ? 'failed' : ''}`}>{t(`my.status.${step}`)}</span>
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
                    <span>{t('detail.submissionMeta', { id: sub.id })}</span>
                    <span>·</span>
                    <span>{t('detail.createdAt', { date: formatDate(sub.createdAt, i18n.language) })}</span>
                    {sub.completedAt && <><span>·</span><span>{t('detail.completedAt', { date: formatDate(sub.completedAt, i18n.language) })}</span></>}
                  </div>
                </div>
                <div className="sd-total-score">
                  <div className="sd-total-score-val">{isProcessing ? '...' : totalScore.toFixed(1)}</div>
                  <div className="sd-total-score-label">{t('detail.pointsSuffix')}</div>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            {!isProcessing && (
              <div className="sd-score-grid" style={{ marginBottom: 20 }}>
                {scoreBreakdown.map(s => {
                  const denom = Math.max(1, Number(s.max) || 0);
                  const rawPct = (Number(s.value) || 0) / denom * 100;
                  const pct = Math.max(0, Math.min(100, rawPct));
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
                  <div className="sd-panel-title">{t('detail.teacherAdjustments.title')}</div>
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
                              −{p.pointsDeducted != null ? Number(p.pointsDeducted).toFixed(1) : '—'} {t('detail.teacherAdjustments.pts')}
                            </span>
                            {' · '}
                            {typeof p.label === 'string' ? p.label : p.presetKey}
                            {p.customDescription ? ` — ${p.customDescription}` : ''}
                            {p.note ? ` (${t('detail.teacherAdjustments.notePrefix')} ${p.note})` : ''}
                            {p.appliedAt ? (
                              <span style={{ color: 'var(--dim)' }}> · {formatDate(p.appliedAt, i18n.language)}</span>
                            ) : null}
                            {p.id && end != null && user?.role === 'TEACHER' && sub.teacherCanApplyPenalty && (
                              <span className="sd-teacher-lock-hint">
                                {canRev
                                  ? ` · ${t('detail.teacherAdjustments.removable', { time: formatMsAsCountdown(msLeft) })}`
                                  : ` · ${t('detail.teacherAdjustments.locked')}`}
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
                              {t('detail.teacherAdjustments.remove')}
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
                  <div className="sd-panel-title">{t('detail.teacherGrading.title')}</div>
                </div>
                <div className="sd-panel-body sd-teacher-panel-body">
                  {teacherErr && (
                    <div className="sd-teacher-alert">{teacherErr}</div>
                  )}
                  {sub.teacherManualGrading && (
                    <div className="sd-teacher-warn">
                      {t('detail.teacherGrading.manualApplied')}
                    </div>
                  )}
                  <div className="sd-teacher-grade-shell">
                    {sub.teacherCanApplyPenalty && (
                      <div className="sd-teacher-form">
                        <div className="sd-teacher-section">
                          <h3 className="sd-teacher-section-title">{t('detail.penalize.title')}</h3>
                          <p className="sd-teacher-hint">
                            <Trans i18nKey="submissions:detail.penalize.hint" components={{ strong: <strong /> }} />
                          </p>
                          <div className="sd-teacher-field">
                            <span className="sd-teacher-label" id="sd-penalty-type-label">{t('detail.penalize.issueType')}</span>
                            <select
                              className="sd-teacher-select"
                              aria-labelledby="sd-penalty-type-label"
                              value={penaltyPresetKey}
                              onChange={(e) => setPenaltyPresetKey(e.target.value)}
                            >
                              {penaltyPresets.map((p) => (
                                <option key={p.key} value={p.key}>
                                  {p.label} (−{p.points} {t('detail.teacherAdjustments.pts')})
                                </option>
                              ))}
                              <option value="OTHER">{t('detail.penalize.otherOption')}</option>
                            </select>
                          </div>
                          {penaltyPresetKey === 'OTHER' && (
                            <div className="sd-teacher-other-grid">
                              <div className="sd-teacher-field">
                                <span className="sd-teacher-label">{t('detail.penalize.pointsToDeduct')}</span>
                                <input
                                  type="number"
                                  className="sd-teacher-input"
                                  min="0.01"
                                  step="0.01"
                                  max="300"
                                  placeholder={t('detail.penalize.pointsExample')}
                                  value={otherPenaltyPoints}
                                  onChange={(e) => setOtherPenaltyPoints(e.target.value)}
                                />
                              </div>
                              <div className="sd-teacher-field sd-teacher-field--grow">
                                <span className="sd-teacher-label">{t('detail.penalize.shortDescription')}</span>
                                <textarea
                                  className="sd-teacher-textarea"
                                  placeholder={t('detail.penalize.otherPlaceholder')}
                                  value={otherPenaltyDescription}
                                  onChange={(e) => setOtherPenaltyDescription(e.target.value)}
                                  rows={4}
                                />
                              </div>
                            </div>
                          )}
                          <div className="sd-teacher-field">
                            <span className="sd-teacher-label" id="sd-penalty-note-label">{t('detail.penalize.optionalNote')}</span>
                            <input
                              type="text"
                              className="sd-teacher-input"
                              placeholder={t('detail.penalize.notePlaceholder')}
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
                            {t('detail.penalize.addToDraft')}
                          </button>
                        </div>
                        {penaltyDrafts.length > 0 && (
                          <>
                            <ul className="sd-teacher-draft-list" aria-label={t('detail.penalize.draftAria')}>
                              {penaltyDrafts.map((d) => (
                                <li key={d.localId} className="sd-teacher-draft-row">
                                  <span className="sd-teacher-draft-text">{draftLabel(d, t, penaltyPresets)}</span>
                                  <button
                                    type="button"
                                    className="sd-teacher-ghost-btn"
                                    disabled={teacherBusy}
                                    onClick={() => handleRemovePenaltyDraft(d.localId)}
                                  >
                                    {t('detail.teacherAdjustments.remove')}
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
                                {t('detail.penalize.confirm', { count: penaltyDrafts.length })}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {sub.teacherCanManualGrade && (
                      <form className="sd-teacher-form" onSubmit={handleManualSubmit}>
                        <div className={`sd-teacher-section${sub.teacherCanApplyPenalty ? ' sd-teacher-section--divider' : ''}`}>
                          <h3 className="sd-teacher-section-title">{t('detail.manual.title')}</h3>
                          <div className="sd-teacher-manual-grid">
                            {[
                              [t('detail.manual.correctness'), manualC, setManualC],
                              [t('detail.manual.performance'), manualP, setManualP],
                              [t('detail.manual.design'), manualD, setManualD],
                              [t('detail.manual.aiReview'), manualA, setManualA],
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
                            {t('detail.manual.save')}
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
                          <h3 className="sd-teacher-section-title">{t('detail.review.title')}</h3>
                          <p className="sd-teacher-hint">
                            {t('detail.review.hint')}
                          </p>
                          {reviewProjectedTotal != null && (
                            <p
                              className="sd-teacher-hint"
                              style={{
                                color: reviewProjectedTotal > 1000 ? 'var(--red)' : 'var(--cyan)',
                              }}
                            >
                              {t('detail.review.projectedTotal')}{' '}
                              <strong>{reviewProjectedTotal.toFixed(2)}</strong> / 1000
                            </p>
                          )}
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">{t('detail.review.personalNote')}</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={4}
                              value={reviewPersonalNote}
                              onChange={(e) => setReviewPersonalNote(e.target.value)}
                              placeholder={t('detail.review.personalPlaceholder')}
                            />
                          </label>
                          <div className="sd-teacher-manual-grid">
                            {[
                              [t('detail.review.zoneCorrectness'), reviewZoneC, setReviewZoneC],
                              [t('detail.review.zonePerformance'), reviewZoneP, setReviewZoneP],
                              [t('detail.review.zoneDesign'), reviewZoneD, setReviewZoneD],
                              [t('detail.review.zoneAi'), reviewZoneAi, setReviewZoneAi],
                            ].map(([label, val, setVal]) => (
                              <label key={label} className="sd-teacher-field">
                                <span className="sd-teacher-label">{label}</span>
                                <textarea
                                  className="sd-teacher-textarea"
                                  rows={3}
                                  value={val}
                                  onChange={(e) => setVal(e.target.value)}
                                  placeholder={t('detail.review.zonePlaceholder')}
                                />
                              </label>
                            ))}
                          </div>
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">{t('detail.review.summary')}</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={3}
                              value={reviewSummary}
                              onChange={(e) => setReviewSummary(e.target.value)}
                              placeholder={t('detail.review.summaryPlaceholder')}
                            />
                          </label>
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">{t('detail.review.strengths')}</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={4}
                              value={reviewStrengths}
                              onChange={(e) => setReviewStrengths(e.target.value)}
                              placeholder={t('detail.review.strengthsPlaceholder')}
                            />
                          </label>
                          <label className="sd-teacher-field">
                            <span className="sd-teacher-label">{t('detail.review.suggestions')}</span>
                            <textarea
                              className="sd-teacher-textarea"
                              rows={4}
                              value={reviewSuggestions}
                              onChange={(e) => setReviewSuggestions(e.target.value)}
                              placeholder={t('detail.review.suggestionsPlaceholder')}
                            />
                          </label>
                          <div className="sd-teacher-section" style={{ marginTop: 12 }}>
                            <span className="sd-teacher-label">{t('detail.review.bonusLines')}</span>
                            <ul className="sd-teacher-bonus-list" aria-label={t('detail.review.bonusAria')}>
                              {reviewBonuses.map((row) => (
                                <li key={row.clientKey} className="sd-teacher-bonus-row">
                                  <input
                                    type="number"
                                    className="sd-teacher-input"
                                    min="0.01"
                                    max="100"
                                    step="0.01"
                                    placeholder={t('detail.review.bonusPts')}
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
                                    placeholder={t('detail.review.bonusLabel')}
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
                                    placeholder={t('detail.review.bonusNote')}
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
                                    {t('detail.teacherAdjustments.remove')}
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
                                {t('detail.review.addBonusLine')}
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
                              {t('detail.review.notifyStudent')}
                            </span>
                          </label>
                        </div>
                        <div className="sd-teacher-actions">
                          <button type="submit" className="sd-teacher-primary-btn" disabled={teacherBusy}>
                            {t('detail.review.save')}
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
                  <div className="sd-panel-title">{t('detail.ai.title')}</div>
                  <span className="sd-ai-provider">{t('detail.ai.provider', { name: aiReview.provider })}</span>
                </div>
                <div className="sd-panel-body">
                  <div className="sd-ai-score-wrap">
                    <div className="sd-ai-score-label">{t('detail.ai.score')}</div>
                    <div className="sd-ai-score-value">{aiReview.aiScore.toFixed(1)}{t('detail.ai.scoreMax')}</div>
                  </div>
                  <p className="sd-ai-summary">{aiReview.summary}</p>
                  <div className="sd-ai-columns">
                    <div>
                      <div className="sd-ai-col-title">{t('detail.ai.strengths')}</div>
                      {aiReview.strengths.length ? (
                        <ul className="sd-ai-list">
                          {aiReview.strengths.map((item, idx) => <li key={`str-${idx}`}>{item}</li>)}
                        </ul>
                      ) : (
                        <div className="sd-ai-empty">{t('detail.ai.noStrengths')}</div>
                      )}
                    </div>
                    <div>
                      <div className="sd-ai-col-title">{t('detail.ai.suggestions')}</div>
                      {aiReview.suggestions.length ? (
                        <ul className="sd-ai-list">
                          {aiReview.suggestions.map((item, idx) => <li key={`sug-${idx}`}>{item}</li>)}
                        </ul>
                      ) : (
                        <div className="sd-ai-empty">{t('detail.ai.noSuggestions')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && showTeacherReviewReader && teacherReviewReader && (
              <div className="sd-panel sd-ai-panel sd-teacher-feedback-panel" style={{ marginBottom: 20 }}>
                <div className="sd-panel-head">
                  <div className="sd-panel-title">{t('detail.teacherReview.title')}</div>
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
                        <div className="sd-ai-col-title">{t('detail.teacherReview.strengths')}</div>
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
                        <div className="sd-ai-col-title">{t('detail.teacherReview.suggestions')}</div>
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
                      <div style={{ color: 'var(--green)', marginBottom: 8 }}>{t('detail.teacherReview.scoreBonuses')}</div>
                      <ul className="sd-teacher-applied-list">
                        {teacherReviewReader.bonusRows.map((b, idx) => (
                          <li key={b.id || `tb-${idx}`} className="sd-teacher-applied-row">
                            <div className="sd-teacher-applied-main">
                              <span style={{ color: 'var(--green)' }}>
                                +{b.pointsAdded != null ? Number(b.pointsAdded).toFixed(1) : '—'} {t('detail.teacherAdjustments.pts')}
                              </span>
                              {b.label ? ` · ${b.label}` : ''}
                              {b.note ? ` — ${b.note}` : ''}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div style={{ color: 'var(--dim)', marginTop: 8 }}>
                        {t('detail.teacherReview.totalBonus')} +
                        {sumTeacherBonusPointsFromApiRows(teacherReviewReader.bonusRows).toFixed(1)} {t('detail.teacherAdjustments.pts')}
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
                    <div className="sd-panel-title">{t('detail.perf.title')}</div>
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
                    <div className="sd-panel-title">{t('detail.tests.title')}</div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {t('detail.tests.passed', {
                        passed: tests.filter((row) => row.passed).length,
                        total: tests.length,
                      })}
                    </span>
                  </div>
                  <div className="sd-panel-body">
                    {tests.length > 0 ? tests.map((testRow, i) => (
                      <div key={i} className="sd-test-row">
                        <span className="sd-test-icon" style={{ color: testRow.passed ? 'var(--green)' : 'var(--red)' }}>
                          {testRow.passed ? '✓' : '✗'}
                        </span>
                        <span className="sd-test-name">{testRow.name}</span>
                        {testRow.time != null && <span className="sd-test-time">{testRow.time}ms</span>}
                      </div>
                    )) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{t('detail.tests.noData')}</div>
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
                      <div className="sd-panel-title">
                        <IconBuildLogsTitle />
                        {t('detail.logs.build')}
                      </div>
                    </div>
                    <div className="sd-panel-body">
                      <div className="sd-logs">{buildLogs}</div>
                    </div>
                  </div>
                )}
                {testLogs && (
                  <div className="sd-panel">
                    <div className="sd-panel-head">
                      <div className="sd-panel-title">
                        <IconTestLogsTitle />
                        {t('detail.logs.test')}
                      </div>
                    </div>
                    <div className="sd-panel-body">
                      <div className="sd-logs">{testLogs}</div>
                    </div>
                  </div>
                )}
                {sub.errorMessage && (
                  <div className="sd-panel sd-full-width">
                    <div className="sd-panel-head">
                      <div className="sd-panel-title" style={{ color: 'var(--red)' }}>{t('detail.logs.error')}</div>
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
                {sub.status === 'PENDING' && t('detail.processing.pending')}
                {sub.status === 'BUILDING' && t('detail.processing.building')}
                {sub.status === 'TESTING' && t('detail.processing.testing')}
              </div>
            )}

            {sub.status === 'COMPLETED' && (
              <div className="sd-continue-wrap">
                <button className="sd-continue-btn" onClick={() => navigate(`/submissions/${id}/results`)}>
                  {t('detail.continue')}
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
