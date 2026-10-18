import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LocaleLink from "../../components/LocaleLink";
import { usePageMeta } from "../../lib/usePageMeta";
import { listPosts } from "../../lib/contentApi";
import { useAppLocale } from "../../routes/LocaleLayout";
import ContentShell from "./ContentShell";

export default function NewsList() {
  const { t } = useTranslation("content");
  const { locale } = useAppLocale();
  const [state, setState] = useState({ locale: "", page: null, error: false });

  usePageMeta({
    title: t("news.pageTitle"),
    description: t("news.pageDescription"),
    path: "/news",
  });

  useEffect(() => {
    let cancelled = false;
    listPosts("NEWS", locale)
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
          <div className="ch-page-eyebrow">{t("news.eyebrow")}</div>
          <h1 className="ch-page-title">{t("news.titleBefore")}<em>{t("news.titleEm")}</em></h1>
        </div>
      </header>
      {error && <p>{t("states.error")}</p>}
      {!error && !page && <p>{t("states.loading")}</p>}
      {page && items.length === 0 && <p>{t("news.empty")}</p>}
      <div className="content-list">
        {items.map((item) => (
          <article key={item.slug} className="content-card">
            <div className="content-meta">
              {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(locale) : ""}
            </div>
            <h2>{item.title}</h2>
            {item.excerpt && <p className="content-excerpt">{item.excerpt}</p>}
            {item.fallback && <p className="content-fallback">{t("states.fallback")}</p>}
            <LocaleLink className="content-read" to={`/news/${item.slug}`}>{t("news.read")}</LocaleLink>
          </article>
        ))}
      </div>
    </ContentShell>
  );
}
