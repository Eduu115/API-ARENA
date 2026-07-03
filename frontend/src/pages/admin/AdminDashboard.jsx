import { useEffect, useState } from "react";
import { getStats } from "../../lib/adminApi";

const SEGMENTS = [
  { key: "students", label: "Students", color: "var(--a-accent)" },
  { key: "teachers", label: "Teachers", color: "var(--a-accent2)" },
  { key: "admins", label: "Admins", color: "var(--a-warn)" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e?.message ?? "Failed to load stats"));
  }, []);

  const total = stats?.total ?? 0;
  const denom = Math.max(1, (stats?.students ?? 0) + (stats?.teachers ?? 0) + (stats?.admins ?? 0));

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
    </div>
  );
}
