import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../../lib/usePageMeta";
import { getRoadmap } from "../../lib/contentApi";
import { useAppLocale } from "../../routes/LocaleLayout";
import ContentShell from "./ContentShell";

const TONE = { DONE: "done", IN_PROGRESS: "now", PLANNED: "next" };
const ERA_KEY = { DONE: "roadmap.done", IN_PROGRESS: "roadmap.now", PLANNED: "roadmap.next" };
const GLYPH = { DONE: "✓", IN_PROGRESS: "▶", PLANNED: "◇" };

// Seeded relative labels are English; dates stay as stored.
const RELATIVE_LABEL = { now: "roadmap.label.now", next: "roadmap.label.next", later: "roadmap.label.later" };

const toneOf = (status) => TONE[status] || "next";
const pad = (n) => String(n).padStart(2, "0");

function Phase({ phase, index, era, t }) {
  const tone = toneOf(phase.status);
  const num = pad(index + 1);
  const side = index % 2 === 0 ? "left" : "right";
  const statusLabel = t(`roadmap.status.${phase.status}`, phase.status);
  const labelKey = RELATIVE_LABEL[String(phase.targetLabel || "").trim().toLowerCase()];
  const targetLabel = labelKey ? t(labelKey) : phase.targetLabel;

  return (
    <li
      className={`rm-phase rm-phase--${tone} rm-phase--${side}`}
      style={{ animationDelay: `${index * 70}ms` }}
      aria-current={tone === "now" ? "step" : undefined}
    >
      {era && (
        <div className="rm-era">
          <span>{t(ERA_KEY[phase.status] || "roadmap.next")}</span>
        </div>
      )}
      <div className="rm-row">
        <div className="rm-when" aria-hidden="true">
          <span className="rm-when-label">{targetLabel}</span>
        </div>

        <div className="rm-node-wrap" aria-hidden="true">
          <div className="rm-node">
            <span>{tone === "done" ? "✓" : num}</span>
          </div>
        </div>

        <article className="rm-card-shell">
          <div className="rm-card">
            <header className="rm-card-head">
              <span className="rm-card-kicker">
                {t("roadmap.phase")} {num}
                <span className="rm-card-target"> · {targetLabel}</span>
              </span>
              <span className="rm-badge">{statusLabel}</span>
            </header>
            <h3 className="rm-title" data-text={phase.title}>
              {phase.title}
            </h3>
            {phase.summary && <p className="rm-summary">{phase.summary}</p>}
            {(phase.items || []).length > 0 && (
              <ul className="rm-items">
                {phase.items.map((item) => (
                  <li key={item.slug} className={`rm-item rm-item--${toneOf(item.status)}`}>
                    <span className="rm-item-glyph" aria-hidden="true">
                      [{GLYPH[item.status] || GLYPH.PLANNED}]
                    </span>
                    <span className="rm-item-text">
                      <span className="rm-item-title">{item.title}</span>
                      {item.summary && <span className="rm-item-summary">{item.summary}</span>}
                      <span className="rm-sr"> ({t(`roadmap.status.${item.status}`, item.status)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <span className="rm-ghost" aria-hidden="true">
              {num}
            </span>
          </div>
        </article>
      </div>
    </li>
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
  const phases = [...(data?.phases || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const total = phases.length;
  const done = phases.filter((phase) => phase.status === "DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ContentShell wide>
      <header className="ch-page-header rm-header">
        <div>
          <div className="ch-page-eyebrow">{t("roadmap.eyebrow")}</div>
          <h1 className="ch-page-title">{t("roadmap.titleBefore")}<em>{t("roadmap.titleEm")}</em></h1>
        </div>
        {total > 0 && (
          <div className="rm-stat" aria-hidden="true">
            <span className="rm-stat-num">{pct}%</span>
            <span className="rm-stat-label">{t("roadmap.shipped")}</span>
          </div>
        )}
      </header>

      {error && <p className="rm-state">{t("states.error")}</p>}
      {!error && !data && <p className="rm-state">{t("states.loading")}</p>}
      {data?.fallback && <p className="content-fallback">{t("states.fallback")}</p>}
      {data && total === 0 && <p className="rm-state">{t("roadmap.empty")}</p>}

      {total > 0 && (
        <div className="rm-progress">
          <div className="rm-progress-meta">// {t("roadmap.progress", { done, total })}</div>
          <div
            className="rm-progress-bar"
            role="img"
            aria-label={t("roadmap.progress", { done, total })}
          >
            {phases.map((phase) => (
              <span key={phase.slug} className={`rm-seg rm-seg--${toneOf(phase.status)}`} />
            ))}
          </div>
        </div>
      )}

      {total > 0 && (
        <ol className="rm-timeline">
          {phases.map((phase, index) => (
            <Phase
              key={phase.slug}
              phase={phase}
              index={index}
              era={index === 0 || phases[index - 1].status !== phase.status}
              t={t}
            />
          ))}
        </ol>
      )}
    </ContentShell>
  );
}
