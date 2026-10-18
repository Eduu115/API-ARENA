import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocaleLink from "../../components/LocaleLink";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import { usePageMeta } from "../../lib/usePageMeta";
import { useLocalizedPath } from "../../routes/LocaleLayout";
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
  const { t, i18n } = useTranslation("teacher");
  const locale = i18n.language?.startsWith("es") ? "es" : "en";
  const title = t("onboarding.metaTitle");
  const description = t("onboarding.metaDescription");
  const faq = asList(t("onboarding.faq", { returnObjects: true }));
  const offerItems = asList(t("onboarding.offers.items", { returnObjects: true }));
  const steps = asList(t("onboarding.steps.items", { returnObjects: true }));
  const formItems = asList(t("onboarding.form.items", { returnObjects: true }));

  const jsonLd = useMemo(() => {
    const url = absoluteUrl(locale, "/teachers");
    return graph([
      ...siteNodes(locale),
      breadcrumbNode(
        [
          { name: t("onboarding.home"), url: absoluteUrl(locale, "/") },
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
  }, [description, faq, locale, t, title]);

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
                <div className="ch-page-eyebrow">{t("onboarding.eyebrow")}</div>
                <h1 className="ch-page-title">
                  {t("onboarding.titleBefore")} <em>{t("onboarding.titleEm")}</em>
                </h1>
              </div>
              <div className="docs-hub-header-actions">
                <button type="button" className="docs-back-btn" onClick={() => navigate(lp("/login"))}>
                  {t("onboarding.backToLogin")}
                </button>
              </div>
            </div>

            <nav className="docs-breadcrumb" aria-label="Breadcrumb">
              <LocaleLink to="/">{t("onboarding.home")}</LocaleLink>
              <span>/</span>
              <span aria-current="page">{title}</span>
            </nav>

            <div className="docs-layout">
              <aside className="docs-scrollspy">
                <div className="docs-scrollspy-title">{t("onboarding.navTitle")}</div>
                {NAV.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="docs-spy-item">
                    <span className="docs-spy-item-title">{t(`onboarding.nav.${item.key}`)}</span>
                  </a>
                ))}
              </aside>

              <div className="docs-content">
                <article className="docs-article">
                  <header className="docs-article-head">
                    <h2 className="docs-article-title">{title}</h2>
                    <p className="docs-article-summary">{t("onboarding.summary")}</p>
                  </header>

                  <section id="offers" className="docs-section">
                    <h3 className="docs-section-title">{t("onboarding.offers.heading")}</h3>
                    <p className="docs-paragraph">{t("onboarding.offers.lead")}</p>
                    <ul className="docs-points">
                      {offerItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section id="steps" className="docs-section">
                    <h3 className="docs-section-title">{t("onboarding.steps.heading")}</h3>
                    <p className="docs-paragraph">{t("onboarding.steps.lead")}</p>
                    <div className="docs-visual docs-visual-flow" role="list" aria-label={t("onboarding.steps.heading")}>
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
                          {t("onboarding.steps.apply")}
                          <span className="docs-next-btn-arrow" aria-hidden="true">
                            →
                          </span>
                        </LocaleLink>
                        <span className="docs-next-meta">{t("onboarding.steps.applyHint")}</span>
                      </div>
                    </footer>
                  </section>

                  <section id="form" className="docs-section">
                    <h3 className="docs-section-title">{t("onboarding.form.heading")}</h3>
                    <p className="docs-paragraph">{t("onboarding.form.lead")}</p>
                    <ul className="docs-points">
                      {formItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="docs-paragraph">{t("onboarding.form.note")}</p>
                  </section>

                  <section id="faq" className="docs-section">
                    <h3 className="docs-section-title">{t("onboarding.nav.faq")}</h3>
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
