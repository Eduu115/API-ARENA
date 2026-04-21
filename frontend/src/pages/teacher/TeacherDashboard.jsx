import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TeacherLayout from "./TeacherLayout";
import { formatTeacherDate } from "./teacher.mock";
import * as groupsApi from "../../lib/groupsApi";
import * as challengesApi from "../../lib/challengesApi";
import * as submissionsApi from "../../lib/submissionsApi";
import SubmissionZipDownloadBlock from "../../components/teacher/SubmissionZipDownloadBlock";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [expandedChallengeId, setExpandedChallengeId] = useState(null);
  const [challengeSubmissions, setChallengeSubmissions] = useState({});
  const [challengeSubsLoading, setChallengeSubsLoading] = useState({});
  const [challengeSubsError, setChallengeSubsError] = useState({});
  const [downloadingSubmissionId, setDownloadingSubmissionId] = useState(null);
  const [correctionQueue, setCorrectionQueue] = useState([]);
  const [correctionQueueLoading, setCorrectionQueueLoading] = useState(true);

  useEffect(() => {
    groupsApi.getMyGroups().then((data) => setGroups(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  async function refreshCorrectionQueue() {
    try {
      const data = await submissionsApi.getTeacherCorrectionsQueue(60);
      setCorrectionQueue(Array.isArray(data) ? data : []);
    } catch {
      setCorrectionQueue([]);
    } finally {
      setCorrectionQueueLoading(false);
    }
  }

  useEffect(() => {
    refreshCorrectionQueue();
    const onVis = () => {
      if (!document.hidden) refreshCorrectionQueue();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChallengesLoading(true);
      try {
        const data = await challengesApi.getMyChallenges({ includeInactive: true });
        if (!cancelled) setChallenges(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setChallenges([]);
      } finally {
        if (!cancelled) setChallengesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadChallengeSubmissionsIfNeeded(challengeId) {
    setChallengeSubsLoading((m) => ({ ...m, [challengeId]: true }));
    setChallengeSubsError((m) => ({ ...m, [challengeId]: null }));
    try {
      const data = await submissionsApi.getTeacherChallengeSubmissions(challengeId);
      setChallengeSubmissions((m) => ({ ...m, [challengeId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      setChallengeSubsError((m) => ({
        ...m,
        [challengeId]: err?.message || "Could not load submissions",
      }));
      setChallengeSubmissions((m) => ({ ...m, [challengeId]: [] }));
    } finally {
      setChallengeSubsLoading((m) => ({ ...m, [challengeId]: false }));
    }
  }

  async function toggleChallenge(challengeId) {
    if (expandedChallengeId === challengeId) {
      setExpandedChallengeId(null);
      return;
    }
    setExpandedChallengeId(challengeId);
    await loadChallengeSubmissionsIfNeeded(challengeId);
    refreshCorrectionQueue();
  }

  async function handleDownloadSubmission(submissionId) {
    setDownloadingSubmissionId(submissionId);
    try {
      const { blob, filename } = await submissionsApi.downloadSubmissionZip(submissionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.message || "Error downloading submission");
    } finally {
      setDownloadingSubmissionId(null);
    }
  }

  const pendingCorrectionsCount = useMemo(
    () => correctionQueue.filter((r) => !r.teacherCorrectionComplete).length,
    [correctionQueue],
  );
  const groupCount = groups.length;
  const challengeCount = challenges.length;
  const publishedCount = challenges.filter((c) => c?.isActive !== false).length;

  const kpis = [
    { icon: "◎", label: "Pending corrections", value: String(pendingCorrectionsCount), color: "var(--warn)", barWidth: "70%" },
    { icon: "◇", label: "Groups", value: String(groupCount), color: "var(--cyan)", barWidth: "45%" },
    { icon: "⊕", label: "Challenges created", value: String(challengeCount), color: "var(--purple)", barWidth: "55%" },
    { icon: "✓", label: "Published", value: String(publishedCount), color: "var(--green)", barWidth: "40%" },
  ];

  const dashboardChallenges = challenges.slice(0, 12);

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 28 }}>
        <div>
          <div className="db-page-eyebrow">// Teacher Command Center</div>
          <h1 className="db-page-title">
            Teacher<em>Panel</em>
          </h1>
          <div className="db-page-sub">
            Quick access to corrections, groups, your challenges, and every submission to them.
          </div>
        </div>
        <div className="db-header-actions">
          <Link to="/teacher/corrections" className="db-btn db-btn-primary">
            Go to corrections
          </Link>
          <Link to="/teacher/challenges/new" className="db-btn">
            Create challenge
          </Link>
        </div>
      </div>

      <div className="db-kpi-grid">
        {kpis.map((card) => (
          <div key={card.label} className="db-kpi-card" style={{ "--kpi-color": card.color }}>
            <div className="db-kpi-top">
              <span className="db-kpi-icon">{card.icon}</span>
            </div>
            <div className="db-kpi-val">{card.value}</div>
            <div className="db-kpi-label">{card.label}</div>
            <div className="db-kpi-bar" style={{ width: card.barWidth }} />
          </div>
        ))}
      </div>

      <div className="db-content-grid">
        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">My challenges & submissions</div>
            <Link to="/teacher/challenges" className="db-panel-action">
              Full list →
            </Link>
          </div>
          <div style={{ padding: "6px 18px 14px", maxHeight: 520, overflowY: "auto" }}>
              {challengesLoading ? (
                <div style={{ padding: 20, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  Loading challenges...
                </div>
              ) : dashboardChallenges.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  No challenges yet. Create one from the header.
                </div>
              ) : (
                dashboardChallenges.map((ch) => {
                  const expanded = expandedChallengeId === ch.id;
                  const subs = challengeSubmissions[ch.id];
                  const subsLoading = challengeSubsLoading[ch.id];
                  const subsErr = challengeSubsError[ch.id];
                  return (
                    <div
                      key={ch.id}
                      style={{
                        borderBottom: "1px solid var(--dim)",
                        padding: "8px 0",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleChallenge(ch.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                          background: "none",
                          border: "none",
                          padding: "4px 0",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--text)" }}>{ch.title}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                            id {ch.id}
                            <span style={{ color: "var(--dim)", margin: "0 6px" }}>·</span>
                            {ch.isActive === false ? "DRAFT" : "PUBLISHED"}
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--cyan)", flexShrink: 0 }}>
                          {expanded ? "▾ Hide" : "▸ All submissions"}
                        </span>
                      </button>
                      {expanded && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingLeft: 10,
                            borderLeft: "2px solid rgba(0,217,255,0.35)",
                          }}
                        >
                          {subsLoading ? (
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", padding: "8px 0" }}>
                              Loading submissions...
                            </div>
                          ) : subsErr ? (
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", padding: "8px 0" }}>
                              {subsErr}
                            </div>
                          ) : !subs || subs.length === 0 ? (
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", padding: "8px 0" }}>
                              No submissions yet for this challenge.
                            </div>
                          ) : (
                            subs.map((sub) => {
                              const who =
                                (sub.submitterUsername && String(sub.submitterUsername).trim()) ||
                                (sub.userId != null ? `user #${sub.userId}` : "—");
                              const score = Number(sub.totalScore) || 0;
                              const corrected = Boolean(sub.teacherCorrectionComplete);
                              return (
                                <div
                                  key={sub.id}
                                  className={`td-submission-row ${
                                    corrected ? "td-submission-row--corrected" : "td-submission-row--pending"
                                  }`}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr auto",
                                    gap: 8,
                                    padding: "8px 6px",
                                    marginBottom: 6,
                                    borderBottom: "1px solid var(--dim)",
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        flexWrap: "wrap",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 12,
                                        color: "var(--text)",
                                      }}
                                    >
                                      <span
                                        className={`td-correction-pill ${
                                          corrected ? "td-correction-pill--ok" : "td-correction-pill--todo"
                                        }`}
                                      >
                                        {corrected ? "CORRECTED" : "TODO"}
                                      </span>
                                      <span>@{who}</span>
                                    </div>
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
                                      #{sub.id} · {sub.status} · score {score > 0 ? score.toFixed(1) : "—"}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/submissions/${sub.id}`)}
                                      style={{
                                        background: "rgba(0,255,163,0.1)",
                                        border: "1px solid rgba(0,255,163,0.3)",
                                        color: "var(--green)",
                                        borderRadius: 4,
                                        padding: "3px 8px",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 10,
                                        cursor: "pointer",
                                      }}
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/submissions/${sub.id}/results`)}
                                      style={{
                                        background: "rgba(189,102,255,0.1)",
                                        border: "1px solid rgba(189,102,255,0.3)",
                                        color: "var(--purple)",
                                        borderRadius: 4,
                                        padding: "3px 8px",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 10,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Results
                                    </button>
                                    <SubmissionZipDownloadBlock
                                      zipDownloadExpiresAt={sub.zipDownloadExpiresAt}
                                      downloading={downloadingSubmissionId === sub.id}
                                      onDownload={() => handleDownloadSubmission(sub.id)}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
        </div>

        <div className="db-right-stack">
          <div className="db-panel">
            <div className="db-panel-head">
              <div className="db-panel-title">Groups</div>
              <Link to="/teacher/groups" className="db-panel-action">
                Manage →
              </Link>
            </div>
            <div style={{ padding: "12px 18px" }}>
              {groups.length === 0 ? (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 10 }}>
                  No groups yet
                </div>
              ) : (
                groups.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 0",
                      borderBottom: "1px solid var(--dim)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                      <span>{g.name}</span>
                      {g.shared && (
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 10,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            color: "var(--purple)",
                            border: "1px solid rgba(189,102,255,0.45)",
                            borderRadius: 4,
                            padding: "2px 7px",
                          }}
                        >
                          Shared
                        </span>
                      )}
                    </span>
                    <span style={{ color: "var(--text)", flexShrink: 0 }}>{g.studentCount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="db-panel">
            <div className="db-panel-head">
              <div className="db-panel-title">
                <span className="db-live-dot" />
                Recent corrections
              </div>
              <Link to="/teacher/corrections" className="db-panel-action">
                View all →
              </Link>
            </div>

            <div style={{ padding: "4px 0 10px" }}>
              {correctionQueueLoading ? (
                <div style={{ padding: 16, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  Loading recent submissions…
                </div>
              ) : correctionQueue.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  No completed submissions on your challenges yet.
                </div>
              ) : (
                correctionQueue.slice(0, 6).map((c) => {
                  const done = Boolean(c.teacherCorrectionComplete);
                  const who =
                    (c.submitterUsername && String(c.submitterUsername).trim()) ||
                    (c.userId != null ? `user #${c.userId}` : "—");
                  const title = c.challengeTitle || `Challenge #${c.challengeId}`;
                  const score = Number(c.totalScore) || 0;
                  const when = c.completedAt || c.createdAt;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`db-activity-row ${done ? "db-activity-row--corrected" : "db-activity-row--pending"}`}
                      onClick={() => navigate(`/submissions/${c.id}`)}
                    >
                      <div
                        className="db-row-dot"
                        style={{
                          background: done ? "var(--green)" : "var(--warn)",
                          boxShadow: done ? "0 0 6px var(--green)" : "0 0 5px var(--warn)",
                        }}
                      />
                      <div className="db-row-info">
                        <div className="db-row-title">{title}</div>
                        <div className="db-row-meta">
                          <span>@{who}</span>
                          <span style={{ color: "var(--dim)" }}>·</span>
                          <span>{done ? "CORRECTED" : "NEEDS REVIEW"}</span>
                          <span style={{ color: "var(--dim)" }}>·</span>
                          <span>{formatTeacherDate(when)}</span>
                        </div>
                      </div>
                      <div className="db-row-status" style={{ color: done ? "var(--green)" : "var(--warn)" }}>
                        {score > 0 ? score.toFixed(1) : "—"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
