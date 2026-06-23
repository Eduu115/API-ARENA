import { useState, useEffect, useRef, useMemo } from "react";
import LocaleLink from "../components/LocaleLink";
import { useTranslation } from "react-i18next";
import Topbar from "../components/Topbar";
import BottomNav from "../components/BottomNav";
import CustomCursor from "../components/CustomCursor";
import { getMySubmissions, getSubmissionReplay } from "../lib/submissionsApi.js";
import { getChallengePreview } from "../lib/challengesApi.js";
import { usePageMeta } from "../lib/usePageMeta";
import "./challenges/challenges.css";
import "./replay.css";

const METHOD_CLASS = {
  GET: "rp-method-get",
  POST: "rp-method-post",
  PUT: "rp-method-put",
  PATCH: "rp-method-put",
  DELETE: "rp-method-delete",
  OPTIONS: "rp-method-get",
};

function statusClass(s) {
  if (s >= 200 && s < 300) return "rp-status-2xx";
  if (s >= 400 && s < 500) return "rp-status-4xx";
  return "rp-status-5xx";
}

function formatScore(v) {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : parseFloat(String(v), 10);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(1);
}

function formatDate(iso, locale) {
  if (!iso) return "—";
  const loc = locale?.startsWith("es") ? "es-ES" : undefined;
  try {
    return new Date(iso).toLocaleString(loc, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

function formatElapsed(msTotal) {
  const totalSec = msTotal / 1000;
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, "0")}:${ss.toFixed(1).padStart(4, "0")}`;
}

function stageToTag(stage, severity) {
  if (severity === "error") return "err";
  if (stage === "TESTING") return "test";
  if (stage === "BUILD" || stage === "CLEANUP") return "sys";
  if (stage === "RESULT") return "res";
  return "req";
}

function toPlayerEvents(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const startMs = new Date(raw[0].occurredAt || Date.now()).getTime();
  return raw.map((e) => {
    const nowMs = new Date(e.occurredAt || Date.now()).getTime();
    const elapsed = Math.max(0, nowMs - startMs);
    const metadata = e.metadata || {};
    const method = metadata.requestMethod || null;
    const path = metadata.requestPath || null;
    const status = metadata.responseStatus ?? null;
    const time = metadata.executionTimeMs ?? null;
    const eventType = e.eventType || "";
    const isHttpLike = !!(method || path || status != null);
    const eventId = e.id != null ? e.id : null;
    return {
      eventId,
      ts: formatElapsed(elapsed),
      stage: e.stage || "UNKNOWN",
      tag: stageToTag(e.stage, e.severity),
      content: e.message || eventType || "event",
      method,
      path,
      status,
      time,
      severity: e.severity || "info",
      eventType,
      metadata,
      testIndex: metadata.testIndex,
      isHttpLike,
    };
  });
}

export default function Replay() {
  const { t, i18n } = useTranslation("replay");
  usePageMeta({ title: t("pageTitle"), path: "/replay" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);
  const [rawEvents, setRawEvents] = useState([]);
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [filterMode, setFilterMode] = useState("ALL");
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [detailEvent, setDetailEvent] = useState(null);
  const termRef = useRef(null);
  const timerRef = useRef(null);

  const playerEvents = useMemo(() => toPlayerEvents(rawEvents), [rawEvents]);

  const completedSubs = useMemo(
    () => (allSubs || []).filter((s) => s.status === "COMPLETED"),
    [allSubs],
  );
  const selectedSub = useMemo(
    () => completedSubs.find((s) => s.id === selectedId) || null,
    [completedSubs, selectedId],
  );

  const stages = useMemo(() => {
    const uniq = new Set(playerEvents.map((e) => e.stage));
    return ["ALL", ...uniq];
  }, [playerEvents]);

  const filteredEvents = useMemo(() => {
    let list = playerEvents;
    if (selectedStage !== "ALL") list = list.filter((e) => e.stage === selectedStage);
    if (filterMode === "HTTP") {
      list = list.filter((e) => e.isHttpLike || e.eventType === "TEST_CASE_RESULT");
    } else if (filterMode === "TESTS") {
      list = list.filter((e) => e.eventType === "TEST_CASE_RESULT");
    }
    return list;
  }, [playerEvents, selectedStage, filterMode]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    getMySubmissions()
      .then((data) => {
        if (!cancelled) setAllSubs(data || []);
      })
      .catch((e) => {
        if (!cancelled) setListError(e.message || t("loadListError"));
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (listLoading || completedSubs.length === 0) return;
    setSelectedId((id) => {
      if (id == null) return completedSubs[0].id;
      if (!completedSubs.some((s) => s.id === id)) return completedSubs[0].id;
      return id;
    });
  }, [listLoading, completedSubs]);

  useEffect(() => {
    if (!selectedId) return;
    const sub = completedSubs.find((s) => s.id === selectedId);
    if (!sub) return;
    let cancelled = false;
    setReplayLoading(true);
    setReplayError(null);
    setPlaying(false);
    setCurrentIdx(0);
    setDetailEvent(null);
    setFilterMode("ALL");

    getChallengePreview(sub.challengeId)
      .then((c) => {
        if (!cancelled) setChallengeTitle(c?.title || t("challengeFallback", { id: sub.challengeId }));
      })
      .catch(() => {
        if (!cancelled) setChallengeTitle(t("challengeFallback", { id: sub.challengeId }));
      });

    getSubmissionReplay(selectedId)
      .then((timeline) => {
        if (!cancelled) {
          setRawEvents(timeline?.events || []);
          setSelectedStage("ALL");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setReplayError(e.message || t("loadReplayError"));
          setRawEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setReplayLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, completedSubs, t]);

  const visibleEvents = filteredEvents.slice(0, currentIdx);
  const progress = filteredEvents.length > 0 ? (currentIdx / filteredEvents.length) * 100 : 0;
  const durationEnd = filteredEvents.length > 0 ? filteredEvents[filteredEvents.length - 1].ts : "00:00.0";
  const currentTs = visibleEvents.length > 0 ? visibleEvents[visibleEvents.length - 1].ts : "00:00.0";

  useEffect(() => {
    if (playing && currentIdx < filteredEvents.length) {
      timerRef.current = setTimeout(() => setCurrentIdx((i) => i + 1), 350 / speed);
    } else if (currentIdx >= filteredEvents.length && filteredEvents.length > 0) {
      setPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [playing, currentIdx, speed, filteredEvents.length]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [currentIdx, selectedStage, filterMode]);

  useEffect(() => {
    const onKey = (ev) => {
      if (replayLoading || replayError || filteredEvents.length === 0) return;
      if (ev.target && (ev.target.tagName === "INPUT" || ev.target.tagName === "TEXTAREA" || ev.target.isContentEditable)) return;
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        setPlaying(false);
        setCurrentIdx((i) => Math.min(filteredEvents.length, i + 1));
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        setPlaying(false);
        setCurrentIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [replayLoading, replayError, filteredEvents.length]);

  const jumpToFailedTest = () => {
    const idx = filteredEvents.findIndex(
      (e) =>
        e.eventType === "TEST_CASE_RESULT" &&
        (e.severity === "warn" || e.severity === "error" || (e.metadata?.status && String(e.metadata.status).toUpperCase() !== "PASSED")),
    );
    if (idx >= 0) {
      setPlaying(false);
      setCurrentIdx(idx + 1);
      setDetailEvent(filteredEvents[idx]);
    }
  };

  const togglePlay = () => {
    if (filteredEvents.length === 0) return;
    if (currentIdx >= filteredEvents.length) setCurrentIdx(0);
    setPlaying((p) => !p);
  };

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="rp-container">
            <div className="ch-page-header" style={{ marginBottom: 28 }}>
              <div>
                <div className="ch-page-eyebrow">{t("eyebrow")}</div>
                <h1 className="ch-page-title">
                  {t("titleBefore")}
                  <em>{t("titleEm")}</em>
                </h1>
                <p className="rp-page-desc">{t("description")}</p>
              </div>
            </div>

            <div className="rp-layout">
              <aside className="rp-sidebar" aria-label={t("sidebarAria")}>
                <div className="rp-sidebar-head">
                  <span className="rp-sidebar-title">{t("yourReplays")}</span>
                  <span className="rp-sidebar-count">{listLoading ? "…" : completedSubs.length}</span>
                </div>
                <div className="rp-sidebar-body">
                  {listLoading && <p className="rp-sidebar-empty">{t("loadingList")}</p>}
                  {listError && <p className="rp-sidebar-error">{listError}</p>}
                  {!listLoading && !listError && completedSubs.length === 0 && (
                    <div className="rp-sidebar-empty">
                      <p>{t("emptyList")}</p>
                      <LocaleLink to="/challenges" className="rp-sidebar-link">{t("goChallenges")}</LocaleLink>
                    </div>
                  )}
                  {!listLoading && !listError && completedSubs.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`rp-sub-item${s.id === selectedId ? " is-active" : ""}`}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <span className="rp-sub-id">#{s.id}</span>
                      <span className="rp-sub-meta">{t("challengeMeta", { id: s.challengeId, score: formatScore(s.totalScore) })}</span>
                      <span className="rp-sub-date">{formatDate(s.completedAt || s.createdAt, i18n.language)}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="rp-player-wrap">
                <div className="rp-player">
                  <div className="rp-player-header">
                    <div className="rp-player-title">
                      {playing && <span className="rp-live-dot" />}
                      {selectedSub ? t("submissionTitle", { id: selectedSub.id, title: challengeTitle || "…" }) : t("selectSubmission")}
                    </div>
                    <div className="rp-player-meta">
                      <span>{t("duration")} {durationEnd}</span>
                      <span>{t("events")} {filteredEvents.length}</span>
                      <span>{t("score")} {selectedSub ? `${formatScore(selectedSub.totalScore)}/1000` : "—"}</span>
                    </div>
                  </div>

                  <div className="rp-controls rp-controls-wrap" style={{ borderBottom: "1px solid var(--dim)" }}>
                    {stages.map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        className={`rp-speed-btn${selectedStage === stage ? " active" : ""}`}
                        onClick={() => {
                          setSelectedStage(stage);
                          setCurrentIdx(0);
                          setPlaying(false);
                        }}
                      >
                        {stage}
                      </button>
                    ))}
                    <span className="rp-control-sep" aria-hidden />
                    {[
                      { id: "ALL", label: t("filterAll") },
                      { id: "HTTP", label: t("filterHttp") },
                      { id: "TESTS", label: t("filterTests") },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`rp-speed-btn${filterMode === f.id ? " active" : ""}`}
                        onClick={() => {
                          setFilterMode(f.id);
                          setCurrentIdx(0);
                          setPlaying(false);
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                    <button type="button" className="rp-speed-btn" onClick={jumpToFailedTest} disabled={filteredEvents.length === 0}>
                      {t("jumpFailed")}
                    </button>
                  </div>

                  <div className="rp-terminal" ref={termRef}>
                    {replayLoading && <div style={{ color: "var(--muted)", fontStyle: "italic" }}>{t("loadingReplay")}</div>}
                    {replayError && !replayLoading && <div className="rp-terminal-error">{replayError}</div>}
                    {!replayLoading && !replayError && filteredEvents.length === 0 && selectedSub && (
                      <div style={{ color: "var(--muted)", fontStyle: "italic" }}>{t("noEvents")}</div>
                    )}
                    {!replayLoading && visibleEvents.map((ev, i) => (
                      <button
                        key={`${ev.ts}-${i}-${ev.eventType}`}
                        type="button"
                        className={`rp-line rp-line-click${
                          detailEvent &&
                          detailEvent.eventId != null &&
                          ev.eventId != null &&
                          detailEvent.eventId === ev.eventId
                            ? " is-selected"
                            : ""
                        }`}
                        style={{ animationDelay: `${(i % 5) * 0.03}s` }}
                        onClick={() => setDetailEvent(ev)}
                      >
                        <span className="rp-ts">{ev.ts}</span>
                        <span className={`rp-tag rp-tag-${ev.tag}`}>{ev.tag}</span>
                        <span className="rp-content">
                          {ev.testIndex != null && (
                            <span className="rp-test-idx">#{ev.testIndex}</span>
                          )}
                          {ev.method && (
                            <>
                              <span className={`rp-method ${METHOD_CLASS[ev.method] || ""}`}>{ev.method}</span>
                              <span>{ev.path}</span>
                            </>
                          )}
                          {ev.status != null && (
                            <>
                              <span className={`rp-status ${statusClass(ev.status)}`}>{ev.status}</span>
                              {ev.time != null && <span style={{ marginLeft: 6 }}>{ev.time}ms</span>}
                            </>
                          )}
                          <span style={{ marginLeft: 6 }}>{ev.content}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {detailEvent && (
                    <div className="rp-detail" aria-live="polite">
                      <div className="rp-detail-head">
                        <span className="rp-detail-title">{t("eventMetadata")}</span>
                        <button type="button" className="rp-speed-btn" onClick={() => setDetailEvent(null)}>
                          {t("close")}
                        </button>
                      </div>
                      <pre className="rp-detail-pre">
                        {JSON.stringify(
                          {
                            stage: detailEvent.stage,
                            eventType: detailEvent.eventType,
                            severity: detailEvent.severity,
                            message: detailEvent.content,
                            metadata: detailEvent.metadata || {},
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}

                  <div className="rp-controls">
                    <button type="button" className="rp-play-btn" onClick={togglePlay}
                      disabled={replayLoading || !!replayError || filteredEvents.length === 0}>
                      {playing ? "❚❚" : "▶"}
                    </button>
                    <button type="button" className="rp-play-btn" style={{ fontSize: 12 }} onClick={() => { setPlaying(false); setCurrentIdx(0); }}
                      disabled={filteredEvents.length === 0}>⟲</button>
                    <div className="rp-progress-wrap">
                      <div className="rp-progress-bar"><div className="rp-progress-fill" style={{ width: `${progress}%` }} /></div>
                      <div className="rp-progress-labels">
                        <span>{currentTs}</span>
                        <span>{t("progressEvents", { current: currentIdx, total: filteredEvents.length })}</span>
                        <span>{durationEnd}</span>
                      </div>
                    </div>
                    {[1, 2, 4].map((s) => (
                      <button key={s} type="button" className={`rp-speed-btn${speed === s ? " active" : ""}`} onClick={() => setSpeed(s)}>{s}x</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
