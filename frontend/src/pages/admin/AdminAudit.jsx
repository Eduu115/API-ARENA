import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAudit } from "../../lib/adminApi";
import { fmtDate } from "./adminFormat";

function actionPill(action) {
  const a = String(action || "").toUpperCase();
  if (a === "DELETE" || a === "BAN" || a === "IMPERSONATE") return "admin-pill--bad";
  if (a === "UNBAN" || a === "VERIFY_EMAIL") return "admin-pill--ok";
  if (a === "SET_ROLE" || a === "ADJUST") return "admin-pill--warn";
  return "admin-pill--accent";
}

export default function AdminAudit() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAudit({ page, size: 50 })
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load audit log"));
    return () => {
      cancelled = true;
    };
  }, [page]);

  const rows = data?.content ?? [];

  return (
    <div>
      <div className="admin-eyebrow">Accountability</div>
      <h1 className="admin-h1">Audit log</h1>
      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="admin-muted">{fmtDate(a.createdAt)}</td>
                <td className="admin-mono">{a.actorEmail}</td>
                <td>
                  <span className={`admin-pill ${actionPill(a.action)}`}>{a.action}</span>
                </td>
                <td>
                  {a.targetUserId ? (
                    <Link to={`/admin/users/${a.targetUserId}`} className="admin-link">
                      {a.targetUsername || `#${a.targetUserId}`}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="admin-muted">{a.detail || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-muted" style={{ textAlign: "center", padding: 24 }}>
                  No activity yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="admin-pager">
          <button
            type="button"
            className="admin-btn admin-btn--sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </button>
          <span className="admin-muted">
            Page {data.number + 1} / {data.totalPages || 1} · {data.totalElements} events
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--sm"
            disabled={data.number + 1 >= (data.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
