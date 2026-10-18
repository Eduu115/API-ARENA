import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../../lib/usePageMeta";
import { listPosts } from "../../lib/contentApi";
import { useAppLocale } from "../../routes/LocaleLayout";
import ContentShell from "./ContentShell";

export default function Changelog() {
  const { t } = useTranslation("content");
  const { locale } = useAppLocale();
  const [state, setState] = useState({ locale: "", page: null, error: false });

  usePageMeta({
    title: t("changelog.pageTitle"),
    description: t("changelog.pageDescription"),
    path: "/changelog",
  });

  useEffect(() => {
    let cancelled = false;
    listPosts("CHANGELOG", locale)
      .then((res) => { if (!cancelled) setState({ locale, page: res, error: false }); })
      .catch(() => { if (!cancelled) setState({ locale, page: null, error: true }); });
    return () => { cancelled = true; };
  }, [locale]);

  const ready = state.locale === locale;
  const page = ready ? state.page : null;
  const error = ready && state.error;
  const items = page?.items || [];
  return (
    <ContentShell>
      <header className="ch-page-header">
        <div>
          <div className="ch-page-eyebrow">{t("changelog.eyebrow")}</div>
          <h1 className="ch-page-title">{t("changelog.titleBefore")}<em>{t("changelog.titleEm")}</em></h1>
        </div>
      </header>
      {error && <p>{t("states.error")}</p>}
      {!error && !page && <p>{t("states.loading")}</p>}
      {page && items.length === 0 && <p>{t("changelog.empty")}</p>}
      <div className="content-list">
        {items.map((item) => (
          <article key={item.slug} className="content-card">
            <div className="content-meta">
              {item.versionLabel ? `${t("changelog.version")} ${item.versionLabel}` : ""}
              {item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString(locale)}` : ""}
            </div>
            <h2>{item.title}</h2>
            {item.fallback && <p className="content-fallback">{t("states.fallback")}</p>}
            <div className="content-body" dangerouslySetInnerHTML={{ __html: item.bodyHtml || "" }} />
          </article>
        ))}
      </div>
    </ContentShell>
  );
}
