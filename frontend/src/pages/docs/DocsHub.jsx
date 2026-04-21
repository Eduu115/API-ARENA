import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import { useAuth } from "../../context/AuthContext";
import { getDocsFeedbackSummary, submitDocsFeedback } from "../../lib/docsMetricsApi";
import "../challenges/challenges.css";
import "./docsHub.css";
import { DOC_BY_ID, DOC_DOCUMENTS } from "./docsContent";

function getNextDocCtaLabel(currentDoc, nextDoc) {
  if (currentDoc?.id === "guia-para-empezar" && nextDoc?.id === "primeros-pasos") {
    return "Go to First Steps";
  }
  if (currentDoc?.id === "primeros-pasos" && nextDoc?.id === "preconfiguracion-proyecto") {
    return "Continue to Preconfigure Project";
  }
  return `Next: ${nextDoc.title}`;
}

function SectionVisual({ visual }) {
  if (!visual?.type) return null;

  if (visual.type === "flow") {
    return (
      <div className="docs-visual docs-visual-flow" role="img" aria-label={visual.title || "Flow diagram"}>
        <div className="docs-visual-title">{visual.title}</div>
        <div className="docs-flow-list">
          {visual.steps?.map((step, idx) => (
            <div key={`${step.label}-${idx}`} className="docs-flow-step">
              <div className="docs-flow-step-index">{idx + 1}</div>
              <div className="docs-flow-step-body">
                <div className="docs-flow-step-label">{step.label}</div>
                <div className="docs-flow-step-hint">{step.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.type === "tree") {
    return (
      <div className="docs-visual docs-visual-tree" role="img" aria-label={visual.title || "Project tree"}>
        <div className="docs-visual-title">{visual.title}</div>
        <pre className="docs-tree">{(visual.lines || []).join("\n")}</pre>
      </div>
    );
  }

  if (visual.type === "checklist") {
    return (
      <div className="docs-visual docs-visual-checklist" role="img" aria-label={visual.title || "Checklist"}>
        <div className="docs-visual-title">{visual.title}</div>
        <ul className="docs-checklist">
          {visual.items?.map((item, idx) => (
            <li key={`${item.label}-${idx}`}>
              <span className={`docs-checklist-dot ${item.status === "warn" ? "warn" : "ok"}`} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (visual.type === "score") {
    return (
      <div className="docs-visual docs-visual-score" role="img" aria-label={visual.title || "Score bars"}>
        <div className="docs-visual-title">{visual.title}</div>
        <div className="docs-score-bars">
          {visual.items?.map((item, idx) => {
            const max = Number(item.max) || 1000;
            const val = Math.max(0, Math.min(max, Number(item.value) || 0));
            const pct = (val / max) * 100;
            return (
              <div key={`${item.label}-${idx}`} className="docs-score-row">
                <div className="docs-score-meta">
                  <span>{item.label}</span>
                  <strong>{val} pts</strong>
                </div>
                <div className="docs-score-track">
                  <div
                    className={`docs-score-fill ${item.color === "purple" ? "purple" : "cyan"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export default function DocsHub() {
  const navigate = useNavigate();
  const { docId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const activeDoc = useMemo(
    () => DOC_BY_ID[docId] || DOC_DOCUMENTS[0],
    [docId]
  );
  const docIndex = useMemo(() => DOC_DOCUMENTS.findIndex((d) => d.id === activeDoc.id), [activeDoc.id]);
  const nextDoc = useMemo(() => {
    if (docIndex < 0 || docIndex >= DOC_DOCUMENTS.length - 1) return null;
    return DOC_DOCUMENTS[docIndex + 1];
  }, [docIndex]);
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
  const [savingId, setSavingId] = useState(null);
  const [feedbackDone, setFeedbackDone] = useState({});
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!docId) {
      navigate(`/docs/${DOC_DOCUMENTS[0].id}`, { replace: true });
      return;
    }
    if (!DOC_BY_ID[docId]) {
      navigate(`/docs/${DOC_DOCUMENTS[0].id}`, { replace: true });
    }
  }, [docId, navigate]);

  useEffect(() => {
    if (!isAdmin) {
      setSummary(null);
      return;
    }
    getDocsFeedbackSummary().then(setSummary).catch(() => setSummary(null));
  }, [isAdmin]);

  const helpfulRate = useMemo(() => {
    if (!summary || !summary.totalFeedback) return null;
    const total = Number(summary.totalFeedback) || 0;
    if (!total) return null;
    const helpful = Number(summary.helpfulCount) || 0;
    return Math.round((helpful / total) * 100);
  }, [summary]);

  async function handleFeedback(sectionKey, helpful) {
    if (savingId) return;
    setSavingId(sectionKey);
    try {
      await submitDocsFeedback({
        sectionKey,
        helpful,
        sourcePath: `/docs/${activeDoc.id}`,
        userId: isAuthenticated ? user?.id : null
      });
      setFeedbackDone((prev) => ({
        ...prev,
        [sectionKey]: helpful ? "helpful" : "not_helpful"
      }));
      if (isAdmin) {
        const latest = await getDocsFeedbackSummary();
        setSummary(latest);
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main">
          <div className="docs-hub-wrap">
            <div className="docs-hub-header">
              <div>
                <div className="ch-page-eyebrow">// Learning Center</div>
                <h1 className="ch-page-title">Arena<em>Docs</em></h1>
              </div>
              <button className="docs-back-btn" onClick={() => navigate("/challenges")}>
                BACK TO CHALLENGES
              </button>
            </div>

            <nav className="docs-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to={`/docs/${DOC_DOCUMENTS[0].id}`}>Docs</Link>
              <span>/</span>
              <span aria-current="page">{activeDoc.title}</span>
            </nav>

            <div className="docs-layout">
              <aside className="docs-scrollspy">
                <div className="docs-scrollspy-title">Documents</div>
                {DOC_DOCUMENTS.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/docs/${doc.id}`}
                    className={`docs-spy-item${activeDoc.id === doc.id ? " is-active" : ""}`}
                  >
                    <span className="docs-spy-item-title">{doc.title}</span>
                    <span className="docs-spy-item-sub">{doc.readTime}</span>
                  </Link>
                ))}
              </aside>

              <div className="docs-content">
                <article className="docs-article">
                  <header className="docs-article-head">
                    <h2 className="docs-article-title">{activeDoc.title}</h2>
                    <p className="docs-article-summary">{activeDoc.summary}</p>
                  </header>

                  {activeDoc.sections.map((section) => {
                    const sectionKey = `${activeDoc.id}:${section.id}`;
                    const voteState = feedbackDone[sectionKey];
                    return (
                      <section key={section.id} className="docs-section">
                        <h3 className="docs-section-title">{section.heading}</h3>
                        {section.paragraphs?.map((paragraph, idx) => (
                          <p key={`${section.id}-p-${idx}`} className="docs-paragraph">{paragraph}</p>
                        ))}
                        {section.bullets?.length ? (
                          <ul className="docs-points">
                            {section.bullets.map((point, idx) => (
                              <li key={`${section.id}-b-${idx}`}>{point}</li>
                            ))}
                          </ul>
                        ) : null}
                        <SectionVisual visual={section.visual} />

                        <div className="docs-feedback-row">
                          <span className="docs-feedback-label">Was this section helpful?</span>
                          <button
                            className={`docs-feedback-btn ${voteState === "helpful" ? "is-selected" : ""}`}
                            onClick={() => handleFeedback(sectionKey, true)}
                            disabled={savingId === sectionKey}
                          >
                            Well explained
                          </button>
                          <button
                            className={`docs-feedback-btn ${voteState === "not_helpful" ? "is-selected" : ""}`}
                            onClick={() => handleFeedback(sectionKey, false)}
                            disabled={savingId === sectionKey}
                          >
                            Needs improvement
                          </button>
                        </div>
                      </section>
                    );
                  })}

                  <div className="docs-feedback-row docs-feedback-row-final">
                    <span className="docs-feedback-label">Was the full document helpful?</span>
                    <button
                      className={`docs-feedback-btn ${feedbackDone[activeDoc.id] === "helpful" ? "is-selected" : ""}`}
                      onClick={() => handleFeedback(activeDoc.id, true)}
                      disabled={savingId === activeDoc.id}
                    >
                      Yes, very useful
                    </button>
                    <button
                      className={`docs-feedback-btn ${feedbackDone[activeDoc.id] === "not_helpful" ? "is-selected" : ""}`}
                      onClick={() => handleFeedback(activeDoc.id, false)}
                      disabled={savingId === activeDoc.id}
                    >
                      Could be improved
                    </button>
                  </div>

                  <nav className="docs-doc-nav" aria-label="Continue reading">
                    {nextDoc ? (
                      <div className="docs-doc-nav-inner">
                        <span className="docs-doc-nav-eyebrow">Continue learning</span>
                        <Link to={`/docs/${nextDoc.id}`} className="docs-doc-nav-primary">
                          <span>{getNextDocCtaLabel(activeDoc, nextDoc)}</span>
                          <span className="docs-doc-nav-arrow" aria-hidden="true">
                            →
                          </span>
                        </Link>
                        <p className="docs-doc-nav-hint">
                          Up next: <strong>{nextDoc.title}</strong>
                          {nextDoc.readTime ? ` · ${nextDoc.readTime}` : null}
                        </p>
                      </div>
                    ) : (
                      <div className="docs-doc-nav-inner docs-doc-nav-inner--end">
                        <span className="docs-doc-nav-eyebrow">End of the learning track</span>
                        <p className="docs-doc-nav-hint">
                          You finished the last guide in this list. Jump back to the start or open the catalog.
                        </p>
                        <div className="docs-doc-nav-actions">
                          <Link to={`/docs/${DOC_DOCUMENTS[0].id}`} className="docs-doc-nav-secondary">
                            Back to Getting Started
                          </Link>
                          <Link to="/challenges" className="docs-doc-nav-secondary">
                            Go to Challenges
                          </Link>
                        </div>
                      </div>
                    )}
                  </nav>
                </article>
              </div>
            </div>

            {isAdmin && (
              <div className="docs-summary">
                <div className="docs-summary-title">Global docs feedback</div>
                {summary ? (
                  <div className="docs-summary-grid">
                    <div><span>Total votes:</span> {summary.totalFeedback ?? 0}</div>
                    <div><span>Helpful votes:</span> {summary.helpfulCount ?? 0}</div>
                    <div><span>Usefulness rate:</span> {helpfulRate != null ? `${helpfulRate}%` : "—"}</div>
                  </div>
                ) : (
                  <div className="docs-summary-empty">No feedback data yet.</div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
