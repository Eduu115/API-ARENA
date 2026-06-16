import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeacherLayout from "./TeacherLayout";
import "../submissions/submissions.css";
import { formatTeacherDate } from "./teacher.mock";
import * as groupsApi from "../../lib/groupsApi";
import * as submissionsApi from "../../lib/submissionsApi";
import { usePageMeta } from "../../lib/usePageMeta";

export default function Corrections() {
  const { t, i18n } = useTranslation("teacher");
  const navigate = useNavigate();

  usePageMeta({ title: t("corrections.pageTitle"), path: "/teacher/corrections" });

  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [memberUserIds, setMemberUserIds] = useState(null);
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);

  useEffect(() => {
    groupsApi.getMyGroups().then((data) => setGroups(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await submissionsApi.getTeacherCorrectionsQueue(120);
        if (!cancelled) setQueue(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setQueue([]);
          setLoadError(e?.message || t("corrections.errorLoadQueue"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (groupId === "all") {
      setMemberUserIds(null);
      setGroupMembersLoading(false);
      return;
    }
    let cancelled = false;
    setGroupMembersLoading(true);
    groupsApi
      .getGroupById(groupId)
      .then((g) => {
        if (cancelled) return;
        const ids = new Set(
          (Array.isArray(g?.members) ? g.members : [])
            .map((m) => m?.userId)
            .filter((id) => id != null),
        );
        setMemberUserIds(ids);
      })
      .catch(() => {
        if (!cancelled) setMemberUserIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setGroupMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return queue
      .filter((row) => {
        if (groupId !== "all") {
          if (groupMembersLoading || memberUserIds == null) return false;
          if (memberUserIds.size === 0) return false;
          if (!memberUserIds.has(Number(row.userId))) return false;
        }
        const uiStatus = row.teacherCorrectionComplete ? "CORRECTED" : "PENDING";
        if (status !== "all" && uiStatus !== status) return false;
        if (!q) return true;
        const who = (row.submitterUsername && String(row.submitterUsername)) || "";
        const title = (row.challengeTitle && String(row.challengeTitle)) || "";
        return (
          who.toLowerCase().includes(q) ||
          title.toLowerCase().includes(q) ||
          String(row.id).includes(q) ||
          String(row.userId || "").includes(q)
        );
      })
      .sort((a, b) => {
        const ta = new Date(a.completedAt || a.createdAt).getTime();
        const tb = new Date(b.completedAt || b.createdAt).getTime();
        return tb - ta;
      });
  }, [queue, groupId, status, query, memberUserIds, groupMembersLoading]);

  const statusLabel = (done) => (done ? t("corrections.statusCorrected") : t("corrections.statusPending"));

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ch-page-eyebrow">{t("corrections.eyebrow")}</div>
          <h1 className="ch-page-title">
            {t("corrections.titleBefore")}<em>{t("corrections.titleEm")}</em>
          </h1>
        </div>
        <div className="ch-page-controls">
          <select className="ch-sort-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="all">{t("corrections.filterGroupAll")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {t("corrections.filterGroup", { name: g.name.toUpperCase() })}
                {g.shared ? t("corrections.filterShared") : ""}
              </option>
            ))}
          </select>
          <select className="ch-sort-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{t("corrections.filterStatusAll")}</option>
            <option value="PENDING">{t("corrections.filterNeedsReview")}</option>
            <option value="CORRECTED">{t("corrections.filterCorrected")}</option>
          </select>
        </div>
      </div>

      <div className="ch-active-filters" style={{ alignItems: "center" }}>
        <div className="ch-search-wrap" style={{ minWidth: 260 }}>
          <span className="ch-search-icon">/</span>
          <input
            type="text"
            className="ch-search-input"
            placeholder={t("corrections.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="ch-results-count" style={{ marginLeft: "auto" }}>
          {t("corrections.submissionsCount", { count: filtered.length })}
        </span>
      </div>

      {loadError && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--red)",
            border: "1px solid rgba(255,80,80,0.35)",
            borderRadius: 6,
          }}
        >
          {loadError}
        </div>
      )}

      <div className="db-panel" style={{ marginTop: 14 }}>
        <div className="db-panel-head">
          <div className="db-panel-title">{t("corrections.completedSubmissions")}</div>
          <button
            type="button"
            className="db-panel-action"
            style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
            onClick={() => {
              setLoading(true);
              submissionsApi
                .getTeacherCorrectionsQueue(120)
                .then((data) => setQueue(Array.isArray(data) ? data : []))
                .catch(() => {})
                .finally(() => setLoading(false));
            }}
          >
            {t("corrections.refresh")}
          </button>
        </div>

        <div className="sub-table" style={{ border: "none" }}>
          <div className="sub-table-head">
            <div className="sub-th">{t("corrections.table.id")}</div>
            <div className="sub-th">{t("corrections.table.student")}</div>
            <div className="sub-th">{t("corrections.table.challenge")}</div>
            <div className="sub-th">{t("corrections.table.status")}</div>
            <div className="sub-th sub-th-right">{t("corrections.table.score")}</div>
            <div className="sub-th sub-th-right">{t("corrections.table.date")}</div>
          </div>

          {loading || (groupId !== "all" && groupMembersLoading) ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              {t("corrections.loading")}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              {groupId !== "all" && memberUserIds && memberUserIds.size === 0
                ? t("corrections.emptyNoStudents")
                : t("corrections.emptyNoFilters")}
            </div>
          ) : (
            filtered.map((row) => {
              const done = Boolean(row.teacherCorrectionComplete);
              const uiStatus = statusLabel(done);
              const who =
                (row.submitterUsername && String(row.submitterUsername).trim()) ||
                (row.userId != null ? t("corrections.userFallback", { id: row.userId }) : "—");
              const title = row.challengeTitle || t("corrections.challengeFallback", { id: row.challengeId });
              const score = Number(row.totalScore) || 0;
              const when = row.completedAt || row.createdAt;
              return (
                <div
                  key={row.id}
                  className={`sub-row ${done ? "sub-row-corrected" : "sub-row-needs-review"}`}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/submissions/${row.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/submissions/${row.id}`);
                    }
                  }}
                >
                  <div className="sub-row-id">#{row.id}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>@{who}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="sub-row-challenge-title">{title}</div>
                    <div className="sub-row-challenge-meta">
                      <span style={{ color: "var(--muted)" }}>{t("corrections.challengeLabel")}</span>
                      <span style={{ color: "var(--dim)" }}>·</span>
                      <span>#{row.challengeId}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                    <span className={`td-correction-pill ${done ? "td-correction-pill--ok" : "td-correction-pill--todo"}`}>
                      {uiStatus}
                    </span>
                  </div>
                  <div className="sub-row-time" style={{ textAlign: "right" }}>
                    {score > 0 ? score.toFixed(1) : "—"}
                  </div>
                  <div className="sub-row-time">{formatTeacherDate(when, i18n.language)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Link to="/teacher" className="db-panel-action">
          {t("corrections.backToDashboard")}
        </Link>
      </div>
    </TeacherLayout>
  );
}
