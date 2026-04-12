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
  const [savingId, setSavingId] = useState(null);
  const [feedbackDone, setFeedbackDone] = useState({});
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!docId) {
      return;
    }
    if (!DOC_BY_ID[docId]) {
      navigate(`/docs/${DOC_DOCUMENTS[0].id}`, { replace: true });
    }
  }, [docId, navigate]);

  useEffect(() => {
    getDocsFeedbackSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

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
      const latest = await getDocsFeedbackSummary();
      setSummary(latest);
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
                VOLVER A CHALLENGES
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
                <div className="docs-scrollspy-title">Documentos</div>
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
                          <span className="docs-feedback-label">Te ha servido esta seccion?</span>
                          <button
                            className={`docs-feedback-btn ${voteState === "helpful" ? "is-selected" : ""}`}
                            onClick={() => handleFeedback(sectionKey, true)}
                            disabled={savingId === sectionKey}
                          >
                            Esta bien explicado
                          </button>
                          <button
                            className={`docs-feedback-btn ${voteState === "not_helpful" ? "is-selected" : ""}`}
                            onClick={() => handleFeedback(sectionKey, false)}
                            disabled={savingId === sectionKey}
                          >
                            Necesita mejora
                          </button>
                        </div>
                      </section>
                    );
                  })}

                  <div className="docs-feedback-row docs-feedback-row-final">
                    <span className="docs-feedback-label">Te ha servido el documento completo?</span>
                    <button
                      className={`docs-feedback-btn ${feedbackDone[activeDoc.id] === "helpful" ? "is-selected" : ""}`}
                      onClick={() => handleFeedback(activeDoc.id, true)}
                      disabled={savingId === activeDoc.id}
                    >
                      Si, muy util
                    </button>
                    <button
                      className={`docs-feedback-btn ${feedbackDone[activeDoc.id] === "not_helpful" ? "is-selected" : ""}`}
                      onClick={() => handleFeedback(activeDoc.id, false)}
                      disabled={savingId === activeDoc.id}
                    >
                      Puede mejorar
                    </button>
                  </div>
                </article>
              </div>
            </div>

            <div className="docs-summary">
              <div className="docs-summary-title">Feedback global docs</div>
              {summary ? (
                <div className="docs-summary-grid">
                  <div><span>Total votos:</span> {summary.totalFeedback ?? 0}</div>
                  <div><span>Votos utiles:</span> {summary.helpfulCount ?? 0}</div>
                  <div><span>Tasa utilidad:</span> {helpfulRate != null ? `${helpfulRate}%` : "—"}</div>
                </div>
              ) : (
                <div className="docs-summary-empty">Sin datos de feedback todavia.</div>
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
