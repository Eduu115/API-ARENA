import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import BottomNav from "../components/BottomNav";
import CustomCursor from "../components/CustomCursor";
import { getMySubmissions, getSubmissionLogs } from "../lib/submissionsApi.js";
import { getChallengeById } from "../lib/challengesApi.js";
import { logsToReplayEvents } from "../lib/replayUtils.js";
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

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

export default function Replay() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [events, setEvents] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const termRef = useRef(null);
  const timerRef = useRef(null);

  const completedSubs = useMemo(
    () => (allSubs || []).filter((s) => s.status === "COMPLETED"),
    [allSubs],
  );

  const selectedSub = useMemo(
    () => completedSubs.find((s) => s.id === selectedId) || null,
    [completedSubs, selectedId],
  );

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    getMySubmissions()
      .then((data) => {
        if (!cancelled) setAllSubs(data || []);
      })
      .catch((e) => {
        if (!cancelled)
          setListError(e.message || "No se pudieron cargar los envíos");
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
    if (!selectedId) {
      setEvents([]);
      setChallengeTitle("");
      setLogsError(null);
      setCurrentIdx(0);
      setPlaying(false);
      return;
    }
    const sub = completedSubs.find((s) => s.id === selectedId);
    if (!sub) return;

    let cancelled = false;
    setLogsLoading(true);
    setLogsError(null);

    getChallengeById(sub.challengeId)
      .then((c) => {
        if (!cancelled)
          setChallengeTitle(c?.title || `Challenge #${sub.challengeId}`);
      })
      .catch(() => {
        if (!cancelled) setChallengeTitle(`Challenge #${sub.challengeId}`);
      });

    getSubmissionLogs(selectedId)
      .then((logs) => {
        if (!cancelled) {
          setEvents(logsToReplayEvents(logs.buildLogs, logs.testLogs));
          setCurrentIdx(0);
          setPlaying(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLogsError(e.message || "No se pudieron cargar los logs");
          setEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, completedSubs]);

  const visibleEvents = events.slice(0, currentIdx);
  const progress = events.length > 0 ? (currentIdx / events.length) * 100 : 0;

  useEffect(() => {
    if (playing && currentIdx < events.length) {
      timerRef.current = setTimeout(() => {
        setCurrentIdx((i) => i + 1);
      }, 400 / speed);
    } else if (currentIdx >= events.length && events.length > 0) {
      setPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [playing, currentIdx, speed, events.length]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [currentIdx]);

  function handlePlay() {
    if (events.length === 0) return;
    if (currentIdx >= events.length) {
      setCurrentIdx(0);
    }
    setPlaying((p) => !p);
  }

  function handleReset() {
    setPlaying(false);
    setCurrentIdx(0);
  }

  const durationEnd =
    events.length > 0 ? events[events.length - 1].ts : "00:00.0";
  const currentTs =
    visibleEvents.length > 0
      ? visibleEvents[visibleEvents.length - 1].ts
      : "00:00.0";

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar
          onMenuToggle={() => setSidebarOpen((s) => !s)}
          sidebarOpen={sidebarOpen}
        />
        <main className="ch-main">
          <div className="rp-container">
            <div className="ch-page-header" style={{ marginBottom: 28 }}>
              <div>
                <div className="ch-page-eyebrow">// Submission Replay</div>
                <h1 className="ch-page-title">
                  Battle<em>Replay</em>
                </h1>
                <p className="rp-page-desc">
                  Solo se listan envíos <strong>completados con éxito</strong>{" "}
                  para poder reproducir build y tests.
                </p>
              </div>
            </div>

            <div className="rp-layout">
              <aside className="rp-sidebar" aria-label="Envíos disponibles">
                <div className="rp-sidebar-head">
                  <span className="rp-sidebar-title">Tus replays</span>
                  <span className="rp-sidebar-count">
                    {listLoading ? "…" : completedSubs.length}
                  </span>
                </div>
                <div className="rp-sidebar-body">
                  {listLoading && (
                    <p className="rp-sidebar-empty">Cargando envíos…</p>
                  )}
                  {listError && (
                    <p className="rp-sidebar-error">{listError}</p>
                  )}
                  {!listLoading && !listError && completedSubs.length === 0 && (
                    <div className="rp-sidebar-empty">
                      <p>No tienes envíos completados aún.</p>
                      <Link to="/challenges" className="rp-sidebar-link">
                        Ir a retos
                      </Link>
                    </div>
                  )}
                  {!listLoading &&
                    !listError &&
                    completedSubs.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`rp-sub-item${
                          s.id === selectedId ? " is-active" : ""
                        }`}
                        onClick={() => setSelectedId(s.id)}
                      >
                        <span className="rp-sub-id">#{s.id}</span>
                        <span className="rp-sub-meta">
                          Challenge {s.challengeId} · {formatScore(s.totalScore)}{" "}
                          pts
                        </span>
                        <span className="rp-sub-date">
                          {formatDate(s.completedAt || s.createdAt)}
                        </span>
                      </button>
                    ))}
                </div>
              </aside>

              <div className="rp-player-wrap">
                <div className="rp-player">
                  <div className="rp-player-header">
                    <div className="rp-player-title">
                      {playing && <span className="rp-live-dot" />}
                      {selectedSub ? (
                        <>
                          Envío #{selectedSub.id} · {challengeTitle || "…"}
                        </>
                      ) : (
                        <>Selecciona un envío</>
                      )}
                    </div>
                    <div className="rp-player-meta">
                      <span>Duración: {durationEnd}</span>
                      <span>Eventos: {events.length}</span>
                      <span>
                        Puntuación:{" "}
                        {selectedSub
                          ? `${formatScore(selectedSub.totalScore)}/1000`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rp-terminal" ref={termRef}>
                    {logsLoading && (
                      <div style={{ color: "var(--muted)", fontStyle: "italic" }}>
                        Cargando logs…
                      </div>
                    )}
                    {logsError && !logsLoading && (
                      <div className="rp-terminal-error">{logsError}</div>
                    )}
                    {!logsLoading &&
                      !logsError &&
                      events.length === 0 &&
                      selectedSub && (
                        <div style={{ color: "var(--muted)", fontStyle: "italic" }}>
                          No hay líneas de log para este envío.
                        </div>
                      )}
                    {!logsLoading &&
                      !logsError &&
                      visibleEvents.length === 0 &&
                      events.length > 0 && (
                        <div style={{ color: "var(--muted)", fontStyle: "italic" }}>
                          Pulsa play para iniciar el replay…
                        </div>
                      )}
                    {!logsLoading &&
                      visibleEvents.map((ev, i) => (
                        <div
                          key={`${ev.ts}-${i}`}
                          className="rp-line"
                          style={{ animationDelay: `${(i % 5) * 0.03}s` }}
                        >
                          <span className="rp-ts">{ev.ts}</span>
                          <span className={`rp-tag rp-tag-${ev.tag}`}>
                            {ev.tag}
                          </span>
                          <span className="rp-content">
                            {ev.method && (
                              <>
                                <span
                                  className={`rp-method ${
                                    METHOD_CLASS[ev.method] || ""
                                  }`}
                                >
                                  {ev.method}
                                </span>
                                <span>{ev.path}</span>
                                {ev.content && (
                                  <span style={{ color: "var(--muted)" }}>
                                    {" "}
                                    · {ev.content}
                                  </span>
                                )}
                              </>
                            )}
                            {ev.status != null && !ev.method && (
                              <>
                                <span
                                  className={`rp-status ${statusClass(ev.status)}`}
                                >
                                  {ev.status}
                                </span>
                                <span style={{ marginLeft: 6 }}>{ev.time}ms</span>
                                {ev.content && (
                                  <span style={{ color: "var(--muted)" }}>
                                    {" "}
                                    · {ev.content}
                                  </span>
                                )}
                              </>
                            )}
                            {!ev.method && ev.status == null && ev.content}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="rp-controls">
                    <button
                      type="button"
                      className="rp-play-btn"
                      onClick={handlePlay}
                      disabled={
                        logsLoading || !!logsError || events.length === 0
                      }
                      aria-label={playing ? "Pausar" : "Reproducir"}
                    >
                      {playing ? "❚❚" : "▶"}
                    </button>
                    <button
                      type="button"
                      className="rp-play-btn"
                      onClick={handleReset}
                      style={{ fontSize: 12 }}
                      disabled={events.length === 0}
                      aria-label="Reiniciar"
                    >
                      ⟲
                    </button>
                    <div className="rp-progress-wrap">
                      <div className="rp-progress-bar">
                        <div
                          className="rp-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="rp-progress-labels">
                        <span>{currentTs}</span>
                        <span>
                          {currentIdx} / {events.length} eventos
                        </span>
                        <span>{durationEnd}</span>
                      </div>
                    </div>
                    {[1, 2, 4].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`rp-speed-btn${speed === s ? " active" : ""}`}
                        onClick={() => setSpeed(s)}
                      >
                        {s}x
                      </button>
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
