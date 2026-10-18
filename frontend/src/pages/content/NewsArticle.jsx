import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocaleLink from "../../components/LocaleLink";
import { usePageMeta } from "../../lib/usePageMeta";
import { getPost } from "../../lib/contentApi";
import { blogPostingGraph } from "../../seo/site";
import { useAppLocale } from "../../routes/LocaleLayout";
import ContentShell from "./ContentShell";

export default function NewsArticle() {
  const { slug } = useParams();
  const { t } = useTranslation("content");
  const { locale } = useAppLocale();
  const [state, setState] = useState({ key: "", post: null, missing: false });
  const requestKey = `${locale}:${slug}`;
  const post = state.key === requestKey ? state.post : null;
  const missing = state.key === requestKey && state.missing;

  usePageMeta({
    title: post?.title || t("news.pageTitle"),
    description: post?.excerpt || t("news.pageDescription"),
    path: `/news/${slug}`,
    jsonLd: post ? blogPostingGraph(locale, {
      title: post.title,
      description: post.excerpt || post.title,
      slug: post.slug,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      image: post.coverImageUrl,
    }) : null,
  });

  useEffect(() => {
    let cancelled = false;
    const key = `${locale}:${slug}`;
    getPost(slug, locale)
      .then((res) => { if (!cancelled) setState({ key, post: res, missing: false }); })
      .catch(() => { if (!cancelled) setState({ key, post: null, missing: true }); });
    return () => { cancelled = true; };
  }, [slug, locale]);

  return (
    <ContentShell>
      <LocaleLink to="/news">{t("article.back")}</LocaleLink>
      {missing && <p>{t("states.notFound")}</p>}
      {!missing && !post && <p>{t("states.loading")}</p>}
      {post && (
        <article className="content-article">
          <div className="ch-page-eyebrow">{t("news.eyebrow")}</div>
          <h1 className="ch-page-title">{post.title}</h1>
          <div className="content-meta">
            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale) : ""}
          </div>
          {post.fallback && <p className="content-fallback">{t("states.fallback")}</p>}
          {post.coverImageUrl && <img className="content-cover" src={post.coverImageUrl} alt="" />}
          <div className="content-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml || "" }} />
        </article>
      )}
    </ContentShell>
  );
}
