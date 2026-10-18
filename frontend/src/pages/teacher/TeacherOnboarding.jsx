import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocaleLink from "../../components/LocaleLink";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAppLocale, useLocalizedPath } from "../../routes/LocaleLayout";
import {
  absoluteUrl,
  breadcrumbNode,
  faqNode,
  graph,
  learningResourceNode,
  siteNodes,
} from "../../seo/site";
import "../challenges/challenges.css";
import "../docs/docsHub.css";

function asList(value) {
  return Array.isArray(value) ? value : [];
}

const NAV = [
  { id: "offers", key: "offers" },
  { id: "steps", key: "steps" },
  { id: "form", key: "form" },
  { id: "faq", key: "faq" },
];

export default function TeacherOnboarding() {
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const { locale } = useAppLocale();
  const { t } = useTranslation("teacher");
  // URL locale wins over a stale i18n.language (docs chrome included).
  const tr = useCallback((key, options) => t(key, { ...options, lng: locale }), [t, locale]);
  const title = tr("onboarding.metaTitle");
  const description = tr("onboarding.metaDescription");
  const faq = asList(tr("onboarding.faq", { returnObjects: true }));
  const offerItems = asList(tr("onboarding.offers.items", { returnObjects: true }));
  const steps = asList(tr("onboarding.steps.items", { returnObjects: true }));
  const formItems = asList(tr("onboarding.form.items", { returnObjects: true }));

  const jsonLd = useMemo(() => {
    const url = absoluteUrl(locale, "/teachers");
    return graph([
      ...siteNodes(locale),
      breadcrumbNode(
        [
          { name: tr("onboarding.home"), url: absoluteUrl(locale, "/") },
          { name: title, url },
        ],
        url
      ),
      learningResourceNode({
        name: title,
        description,
        url,
        locale,
        learningResourceType: "Guide",
      }),
      faqNode(
        faq.map((item) => ({ q: item.q, a: item.a })),
        url
      ),
    ]);
  }, [description, faq, locale, tr, title]);

  usePageMeta({
    title,
    description,
    path: "/teachers",
    jsonLd,
  });

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
                <div className="ch-page-eyebrow">{tr("onboarding.eyebrow")}</div>
                <h1 className="ch-page-title">
                  {tr("onboarding.titleBefore")} <em>{tr("onboarding.titleEm")}</em>
                </h1>
              </div>
              <div className="docs-hub-header-actions">
                <button type="button" className="docs-back-btn" onClick={() => navigate(lp("/login"))}>
                  {tr("onboarding.backToLogin")}
                </button>
              </div>
            </div>

            <nav className="docs-breadcrumb" aria-label={tr("onboarding.breadcrumb")}>
              <LocaleLink to="/">{tr("onboarding.home")}</LocaleLink>
              <span>/</span>
              <span aria-current="page">{title}</span>
            </nav>

            <div className="docs-layout">
              <aside className="docs-scrollspy">
                <div className="docs-scrollspy-title">{tr("onboarding.navTitle")}</div>
                {NAV.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="docs-spy-item">
                    <span className="docs-spy-item-title">{tr(`onboarding.nav.${item.key}`)}</span>
                  </a>
                ))}
              </aside>

              <div className="docs-content">
                <article className="docs-article">
                  <header className="docs-article-head">
                    <h2 className="docs-article-title">{title}</h2>
                    <p className="docs-article-summary">{tr("onboarding.summary")}</p>
                  </header>

                  <section id="offers" className="docs-section">
                    <h3 className="docs-section-title">{tr("onboarding.offers.heading")}</h3>
                    <p className="docs-paragraph">{tr("onboarding.offers.lead")}</p>
                    <ul className="docs-points">
                      {offerItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section id="steps" className="docs-section">
                    <h3 className="docs-section-title">{tr("onboarding.steps.heading")}</h3>
                    <p className="docs-paragraph">{tr("onboarding.steps.lead")}</p>
                    <div className="docs-visual docs-visual-flow" role="list" aria-label={tr("onboarding.steps.heading")}>
                      <div className="docs-flow-list">
                        {steps.map((step, index) => (
                          <div key={step.label} className="docs-flow-step" role="listitem">
                            <div className="docs-flow-step-index">{index + 1}</div>
                            <div className="docs-flow-step-body">
                              <div className="docs-flow-step-label">{step.label}</div>
                              <div className="docs-flow-step-hint">{step.hint}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <footer className="docs-doc-footer">
                      <div className="docs-next-row">
                        <LocaleLink to="/teacher/apply" className="docs-next-btn">
                          {tr("onboarding.steps.apply")}
                          <span className="docs-next-btn-arrow" aria-hidden="true">
                            →
                          </span>
                        </LocaleLink>
                        <span className="docs-next-meta">{tr("onboarding.steps.applyHint")}</span>
                      </div>
                    </footer>
                  </section>

                  <section id="form" className="docs-section">
                    <h3 className="docs-section-title">{tr("onboarding.form.heading")}</h3>
                    <p className="docs-paragraph">{tr("onboarding.form.lead")}</p>
                    <ul className="docs-points">
                      {formItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="docs-paragraph">{tr("onboarding.form.note")}</p>
                  </section>

                  <section id="faq" className="docs-section">
                    <h3 className="docs-section-title">{tr("onboarding.nav.faq")}</h3>
                    <dl className="docs-faq">
                      {faq.map((item) => (
                        <div key={item.q}>
                          <dt>{item.q}</dt>
                          <dd>{item.a}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </article>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
