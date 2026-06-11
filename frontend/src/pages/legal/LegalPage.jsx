import { Link, useLocation, Navigate } from "react-router-dom";
import { LEGAL_DOCS, LEGAL_NAV, CONTROLLER } from "./legalContent";
import { usePageMeta } from "../../lib/usePageMeta";
import { openConsentManager } from "../../lib/cookieConsent";
import "../challenges/challenges.css";
import "./legal.css";

function renderBlock(block, i) {
  if (typeof block === "string") {
    return (
      <p key={i} className="legal-p">
        {block}
      </p>
    );
  }
  if (block && Array.isArray(block.list)) {
    return (
      <ul key={i} className="legal-list">
        {block.list.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    );
  }
  return null;
}

export default function LegalPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+/, "").split("/")[0];
  const doc = LEGAL_DOCS[slug];

  usePageMeta({
    title: doc ? doc.title : "Legal",
    description: doc?.intro,
    path: `/${slug}`,
  });

  if (!doc) return <Navigate to="/privacidad" replace />;

  return (
    <div className="legal-root challenges-page">
      <div className="ch-grid-bg" aria-hidden />

      <div className="legal-shell">
        <header className="legal-head">
          <Link to="/" className="legal-brand">
            <img src="/icons/logo-hex-lg.svg" alt="API Arena" width="32" height="32" />
            <span className="ch-logo-text">
              <span className="ch-api">API</span>
              <span className="ch-arena">Arena</span>
            </span>
          </Link>

          <nav className="legal-nav" aria-label="Documentos legales">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.slug}
                to={`/${item.slug}`}
                className={`legal-nav-item${item.slug === slug ? " is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <article className="legal-article">
          <div className="ch-page-eyebrow">// Legal</div>
          <h1 className="legal-title">{doc.title}</h1>
          {doc.intro && <p className="legal-intro">{doc.intro}</p>}

          {doc.sections.map((section, i) => (
            <section key={i} className="legal-section">
              <h2 className="legal-heading">{section.heading}</h2>
              {section.body.map((block, j) => renderBlock(block, j))}
            </section>
          ))}

          {slug === "cookies" && (
            <section className="legal-section">
              <button type="button" className="legal-back" onClick={openConsentManager}>
                Gestionar mis preferencias de consentimiento
              </button>
            </section>
          )}

          <footer className="legal-foot">
            <p>
              Última actualización: {CONTROLLER.lastUpdated}. Para cualquier consulta:{" "}
              <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>.
            </p>
            <Link to="/" className="legal-back">
              ← Volver al inicio
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
