import { useEffect, useState } from "react";
import { getModerationStats, getStats } from "../../lib/adminApi";

const SEGMENTS = [
  { key: "students", label: "Students", color: "var(--a-accent)" },
  { key: "teachers", label: "Teachers", color: "var(--a-accent2)" },
  { key: "admins", label: "Admins", color: "var(--a-warn)" },
];

const CATEGORY_LABELS = {
  UNCATEGORIZED: "Uncategorized",
  CHEATING: "Cheating",
  TOXICITY: "Toxicity",
  HARASSMENT: "Harassment",
  SPAM: "Spam",
  INAPPROPRIATE: "Inappropriate",
  MULTI_ACCOUNT: "Multi-account",
  SECURITY: "Security",
  AUTO_WARNINGS: "Auto (warnings)",
  OTHER: "Other",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [mod, setMod] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e?.message ?? "Failed to load stats"));
    getModerationStats()
      .then(setMod)
      .catch(() => setMod(null));
  }, []);

  const total = stats?.total ?? 0;
  const denom = Math.max(1, (stats?.students ?? 0) + (stats?.teachers ?? 0) + (stats?.admins ?? 0));
  const catMax = Math.max(1, ...(mod?.byCategory ?? []).map((c) => c.count));

  return (
    <div>
      <div className="admin-eyebrow">Control center</div>
      <h1 className="admin-h1">Overview</h1>
      {error && <div className="admin-alert">{error}</div>}

      <section className="admin-hero">
        <div className="admin-panel admin-hero__main">
          <div className="admin-hero__value">{total}</div>
          <div className="admin-hero__label">Registered users</div>
        </div>

        <div className="admin-panel">
          <div className="admin-distro__title">Role distribution</div>
          <div className="admin-distro__bar" role="img" aria-label="User role distribution">
            {SEGMENTS.map((s) => {
              const v = stats?.[s.key] ?? 0;
              return (
                <div
                  key={s.key}
                  className="admin-distro__seg"
                  style={{ width: `${(v / denom) * 100}%`, background: s.color }}
                  title={`${s.label}: ${v}`}
                />
              );
            })}
          </div>
          <div className="admin-distro__legend">
            {SEGMENTS.map((s) => (
              <span key={s.key} className="admin-legend-item">
                <span className="admin-legend-dot" style={{ background: s.color }} />
                {s.label} <b>{stats?.[s.key] ?? "—"}</b>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="admin-metrics">
        <div className="admin-metric admin-metric--ok">
          <div className="admin-metric__value">{stats?.onlineNow ?? "—"}</div>
          <div className="admin-metric__label">Online now</div>
        </div>
        <div className="admin-metric">
          <div className="admin-metric__value">{stats?.students ?? "—"}</div>
          <div className="admin-metric__label">Students</div>
        </div>
        <div className="admin-metric">
          <div className="admin-metric__value">{stats?.teachers ?? "—"}</div>
          <div className="admin-metric__label">Teachers</div>
        </div>
        <div className="admin-metric">
          <div className="admin-metric__value">{stats?.admins ?? "—"}</div>
          <div className="admin-metric__label">Admins</div>
        </div>
        <div className="admin-metric admin-metric--danger">
          <div className="admin-metric__value">{stats?.banned ?? "—"}</div>
          <div className="admin-metric__label">Banned</div>
        </div>
      </div>

      <h2 className="admin-h2">Moderation analytics</h2>
      <section className="admin-hero">
        <div className="admin-panel admin-hero__main">
          <div className="admin-hero__value" style={{ fontSize: "clamp(40px, 4vw, 60px)" }}>
            {mod?.totalBans ?? "—"}
          </div>
          <div className="admin-hero__label">Total bans issued</div>
          <div className="admin-muted" style={{ marginTop: 10 }}>
            {mod?.totalUnbans ?? 0} unbans recorded
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-distro__title">Bans by category</div>
          {!mod || mod.byCategory.length === 0 ? (
            <div className="admin-muted">No bans recorded yet.</div>
          ) : (
            <div className="admin-catbars">
              {mod.byCategory.map((c) => (
                <div className="admin-catbar" key={c.category}>
                  <span className="admin-catbar__label">{CATEGORY_LABELS[c.category] || c.category}</span>
                  <span className="admin-catbar__track">
                    <span className="admin-catbar__fill" style={{ width: `${(c.count / catMax) * 100}%` }} />
                  </span>
                  <span className="admin-catbar__count">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
