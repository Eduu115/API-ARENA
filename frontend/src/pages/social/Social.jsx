import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import LocaleLink from "../../components/LocaleLink";
import { useAuth } from "../../context/AuthContext";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAdminCaps } from "../admin/useAdminCaps";
import * as socialApi from "../../lib/socialApi";
import "../challenges/challenges.css";
import "./social.css";

const REACTIONS = ["GG", "FIRE", "CLAP", "ROCKET", "EYES"];
const TABS = ["all", "activity", "posts"];

function activityLine(t, item) {
  const challenge = item.challengeTitle || t("challengeFallback");
  const delta = item.delta == null ? "" : item.delta > 0 ? `+${item.delta}` : String(item.delta);
  return t(`activity.${item.activityType}`, {
    defaultValue: item.activityType,
    challenge,
    from: item.labelBefore || item.previousValue,
    to: item.labelAfter || item.newValue || item.achievementTitle,
    delta,
    title: item.achievementTitle || item.achievementCode,
    weeks: item.streakWeeks,
  });
}

function FeedRow({ item, onChange, canModerate }) {
  const { t } = useTranslation("social");
  const [busy, setBusy] = useState(false);

  async function react(code) {
    setBusy(true);
    try {
      await socialApi.toggleReaction(item.kind, item.id, code);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await socialApi.deletePost(item.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    const reason = window.prompt(t("report"));
    if (reason == null) return;
    setBusy(true);
    try {
      await socialApi.reportEntry(item.kind, item.id, reason);
    } finally {
      setBusy(false);
    }
  }

  async function hide() {
    setBusy(true);
    try {
      if (item.kind === "POST") await socialApi.adminDeletePost(item.id);
      else await socialApi.hideEntry(item.kind, item.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  const counts = item.reactions || {};
  return (
    <article className="social-row">
      <div className="social-row-head">
        <span className="social-row-user">{item.mine ? t("you") : item.username || `#${item.userId}`}</span>
        <span>{item.kind === "POST" ? t("tabs.posts") : t("tabs.activity")}</span>
      </div>
      <p className="social-row-body">{activityLine(t, item)}</p>
      {item.caption && <p className="social-caption">{item.caption}</p>}
      {item.kind === "POST" && (
        <>
          <div className="social-meta">
            <span>{item.totalScore}</span>
            <span>{t("technical", { score: item.technicalScore ?? 0 })}</span>
            <span>{t("ai", { score: item.aiScore ?? 0 })}</span>
            <span>{t("testsPassed", { passed: item.testsPassed ?? 0, failed: item.testsFailed ?? 0 })}</span>
            {item.avgResponseMs != null && <span>{t("latency", { ms: item.avgResponseMs })}</span>}
            {item.rps != null && <span>{t("rps", { rps: item.rps })}</span>}
          </div>
          {Array.isArray(item.tests) && item.tests.length > 0 && (
            <ul className="social-tests">
              {item.tests.map((test) => (
                <li key={test.name} className={test.passed ? "pass" : "fail"}>
                  {test.passed ? "✓" : "×"} {test.name}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <div className="social-actions">
        {REACTIONS.map((code) => (
          <button
            key={code}
            type="button"
            className={`social-react${item.myReaction === code ? " is-on" : ""}`}
            disabled={busy}
            onClick={() => react(code)}
          >
            {t(`reactions.${code}`)} {counts[code] || ""}
          </button>
        ))}
        {item.mine && item.kind === "POST" && (
          <button type="button" className="social-text-btn" disabled={busy} onClick={remove}>
            {t("delete")}
          </button>
        )}
        {!item.mine && (
          <button type="button" className="social-text-btn" disabled={busy} onClick={report}>
            {t("report")}
          </button>
        )}
        {canModerate && (
          <button type="button" className="social-text-btn" disabled={busy} onClick={hide}>
            {item.kind === "POST" ? t("delete") : t("hide")}
          </button>
        )}
      </div>
    </article>
  );
}

function ModerationGate({ children }) {
  const { user } = useAuth();
  if (String(user?.role || "").toUpperCase() !== "ADMIN") return children(false);
  return <AdminGate>{children}</AdminGate>;
}

function AdminGate({ children }) {
  const { canModerate } = useAdminCaps();
  return children(canModerate);
}

export default function Social() {
  const { t } = useTranslation("social");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sentinel = useRef(null);
  const loadingMore = useRef(false);

  usePageMeta({ title: t("pageTitle"), path: "/social" });

  const load = useCallback(async (nextCursor, replace) => {
    setError(null);
    const page = await socialApi.getFeed({ tab, cursor: nextCursor || undefined });
    setEnabled(page?.enabled !== false);
    const batch = Array.isArray(page?.items) ? page.items : [];
    setItems((prev) => (replace ? batch : [...prev, ...batch]));
    setCursor(page?.nextCursor || null);
    return page;
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load(null, true)
      .catch((e) => {
        if (!cancelled) setError(e?.message || t("loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, t]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !cursor) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || loadingMore.current) return;
      loadingMore.current = true;
      load(cursor, false)
        .catch(() => {})
        .finally(() => {
          loadingMore.current = false;
        });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, load]);

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="ch-page-header">
            <div>
              <div className="ch-page-eyebrow">{t("eyebrow")}</div>
              <h1 className="ch-page-title">
                {t("title")}
                <span className="social-beta">{t("beta")}</span>
              </h1>
              <p className="social-lead">{t("lead")}</p>
            </div>
          </div>
          <div className="social-tabs">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                className={`social-tab${tab === key ? " is-active" : ""}`}
                onClick={() => setTab(key)}
              >
                {t(`tabs.${key}`)}
              </button>
            ))}
            <button type="button" className="social-refresh" onClick={() => load(null, true)}>
              {t("refresh")}
            </button>
          </div>
          {loading && <p>{t("loading")}</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && enabled === false && <p>{t("disabled")}</p>}
          {!loading && enabled !== false && items.length === 0 && (
            <div className="social-empty">
              <h2>{t("emptyTitle")}</h2>
              <p>{t("emptyBody")}</p>
              <LocaleLink to="/friends">{t("findFriends")}</LocaleLink>
            </div>
          )}
          <ModerationGate>
            {(canModerate) => (
              <div className="social-list">
                {items.map((item) => (
                  <FeedRow
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    canModerate={canModerate}
                    onChange={() => load(null, true)}
                  />
                ))}
              </div>
            )}
          </ModerationGate>
          <div ref={sentinel} />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
