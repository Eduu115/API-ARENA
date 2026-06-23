import LocaleLink from "../../components/LocaleLink";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TeacherLayout from "./TeacherLayout";
import * as challengesApi from "../../lib/challengesApi";
import { formatTeacherDate } from "./teacher.mock";
import { usePageMeta } from "../../lib/usePageMeta";

export default function TeacherChallenges() {
  const { t, i18n } = useTranslation("teacher");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  usePageMeta({ title: t("challenges.pageTitle"), path: "/teacher/challenges" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await challengesApi.getMyChallenges({ includeInactive: true });
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || t("challenges.errorLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    if (filter === "published") return items.filter((c) => c?.isActive !== false);
    if (filter === "draft") return items.filter((c) => c?.isActive === false);
    return items;
  }, [items, filter]);

  const filterButtons = [
    { key: "all", label: t("challenges.filterAll") },
    { key: "published", label: t("challenges.filterPublished") },
    { key: "draft", label: t("challenges.filterDraft") },
  ];

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ch-page-eyebrow">{t("challenges.eyebrow")}</div>
          <h1 className="ch-page-title">
            {t("challenges.titleBefore")}<em>{t("challenges.titleEm")}</em>
          </h1>
        </div>
        <div className="ch-page-controls">
          <LocaleLink to="/teacher/challenges/new" className="db-btn db-btn-primary">
            {t("challenges.createChallenge")}
          </LocaleLink>
        </div>
      </div>

      <div className="ch-active-filters" style={{ alignItems: "center" }}>
        {filterButtons.map((f) => (
          <button
            key={f.key}
            className={`sub-filter-btn${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span className="ch-results-count" style={{ marginLeft: "auto" }}>
          {t("challenges.challengesCount", { count: filtered.length })}
        </span>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div className="db-panel-title">{t("challenges.list")}</div>
          <LocaleLink to="/teacher/challenges/new" className="db-panel-action">
            {t("challenges.new")}
          </LocaleLink>
        </div>

        <div className="sub-table" style={{ border: "none" }}>
          <div className="sub-table-head">
            <div className="sub-th">{t("challenges.table.title")}</div>
            <div className="sub-th">{t("challenges.table.category")}</div>
            <div className="sub-th">{t("challenges.table.difficulty")}</div>
            <div className="sub-th sub-th-right">{t("challenges.table.status")}</div>
            <div className="sub-th sub-th-right">{t("challenges.table.created")}</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              {t("challenges.loading")}
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)" }}>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              {t("challenges.emptyFilter")}
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="sub-row">
                <div style={{ minWidth: 0 }}>
                  <div className="sub-row-challenge-title">{c.title}</div>
                  <div className="sub-row-challenge-meta">
                    <span style={{ color: "var(--muted)" }}>{t("challenges.idLabel")}</span>
                    <span style={{ color: "var(--dim)" }}>·</span>
                    <span>{c.id}</span>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{c.category}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>{c.difficulty}</div>
                <div className="sub-row-time" style={{ color: c.isActive === false ? "var(--warn)" : "var(--green)" }}>
                  {c.isActive === false ? t("challenges.draft") : t("challenges.published")}
                </div>
                <div className="sub-row-time">{formatTeacherDate(c.createdAt, i18n.language)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
