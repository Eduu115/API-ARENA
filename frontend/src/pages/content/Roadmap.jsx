import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../../lib/usePageMeta";
import { getRoadmap } from "../../lib/contentApi";
import { useAppLocale } from "../../routes/LocaleLayout";
import ContentShell from "./ContentShell";

function Phase({ phase, t }) {
  return (
    <article className="rm-phase">
      <div className="rm-target">{phase.targetLabel}</div>
      <h3>{phase.title}</h3>
      {phase.summary && <p>{phase.summary}</p>}
      <ul className="rm-items">
        {(phase.items || []).map((item) => (
          <li key={item.slug}>
            <span className="rm-item-status">{t(`roadmap.status.${item.status}`, item.status)}</span>
            <span>
              <strong>{item.title}</strong>
              {item.summary ? ` — ${item.summary}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Roadmap() {
  const { t } = useTranslation("content");
  const { locale } = useAppLocale();
  const [state, setState] = useState({ locale: "", data: null, error: false });

  usePageMeta({
    title: t("roadmap.pageTitle"),
    description: t("roadmap.pageDescription"),
    path: "/roadmap",
  });

  useEffect(() => {
    let cancelled = false;
    getRoadmap(locale)
      .then((res) => { if (!cancelled) setState({ locale, data: res, error: false }); })
      .catch(() => { if (!cancelled) setState({ locale, data: null, error: true }); });
    return () => { cancelled = true; };
  }, [locale]);

  const ready = state.locale === locale;
  const data = ready ? state.data : null;
  const error = ready && state.error;
  const phases = data?.phases || [];
  const now = phases.filter((phase) => phase.status === "IN_PROGRESS");
  const next = phases.filter((phase) => phase.status === "PLANNED");
  const done = phases.filter((phase) => phase.status === "DONE");

  return (
    <ContentShell>
      <header className="ch-page-header">
        <div>
          <div className="ch-page-eyebrow">{t("roadmap.eyebrow")}</div>
          <h1 className="ch-page-title">{t("roadmap.titleBefore")}<em>{t("roadmap.titleEm")}</em></h1>
        </div>
      </header>
      {error && <p>{t("states.error")}</p>}
      {!error && !data && <p>{t("states.loading")}</p>}
      {data?.fallback && <p className="content-fallback">{t("states.fallback")}</p>}
      {data && phases.length === 0 && <p>{t("roadmap.empty")}</p>}
      {now.length > 0 && (
        <section className="rm-section rm-now">
          <h2>{t("roadmap.now")}</h2>
          {now.map((phase) => <Phase key={phase.slug} phase={phase} t={t} />)}
        </section>
      )}
      {next.length > 0 && (
        <section className="rm-section rm-next">
          <h2>{t("roadmap.next")}</h2>
          {next.map((phase) => <Phase key={phase.slug} phase={phase} t={t} />)}
        </section>
      )}
      {done.length > 0 && (
        <section className="rm-section rm-done">
          <h2>{t("roadmap.done")}</h2>
          {done.map((phase) => <Phase key={phase.slug} phase={phase} t={t} />)}
        </section>
      )}
    </ContentShell>
  );
}
