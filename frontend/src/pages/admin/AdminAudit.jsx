import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAudit } from "../../lib/adminApi";
import {
  buildAuditReport,
  downloadAuditJson,
  downloadAuditPdf,
  fetchAllAuditEvents,
} from "../../lib/adminAuditReport";
import { fmtDate } from "./adminFormat";

function actionPill(action) {
  const a = String(action || "").toUpperCase();
  if (a === "DELETE" || a === "BAN" || a === "IMPERSONATE") return "admin-pill--bad";
  if (a === "UNBAN" || a === "VERIFY_EMAIL") return "admin-pill--ok";
  if (a === "SET_ROLE" || a === "ADJUST") return "admin-pill--warn";
  return "admin-pill--accent";
}

export default function AdminAudit() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [exportMsg, setExportMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAudit({ page, size: 50 })
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load audit log"));
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function buildFullReport() {
    setExportMsg(null);
    const events = await fetchAllAuditEvents();
    return buildAuditReport(events, { generatedBy: user?.email ?? null });
  }

  async function handleJsonExport() {
    setExporting("json");
    try {
      const report = await buildFullReport();
      downloadAuditJson(report);
      setExportMsg(`JSON exported — ${report.summary.totalEvents} events included.`);
    } catch (e) {
      setExportMsg(e?.message ?? "JSON export failed");
    } finally {
      setExporting(null);
    }
  }

  async function handlePdfExport() {
    setExporting("pdf");
    try {
      const report = await buildFullReport();
      await downloadAuditPdf(report);
      setExportMsg(`PDF report generated — ${report.summary.totalEvents} events analysed.`);
    } catch (e) {
      setExportMsg(e?.message ?? "PDF export failed");
    } finally {
      setExporting(null);
    }
  }

  const rows = data?.content ?? [];
  const busy = exporting != null;

  return (
    <div>
      <div className="admin-eyebrow">Accountability</div>
      <h1 className="admin-h1">Audit log</h1>
      <p className="admin-muted" style={{ maxWidth: 640, marginBottom: 16 }}>
        Immutable trail of admin console actions. Export the full log as JSON for external tooling, or generate a
        narrative PDF brief that interprets moderation volume, risk actions, and administrator activity.
      </p>

      <div className="admin-toolbar">
        <div className="admin-toolbar__group">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={busy}
            onClick={handleJsonExport}
          >
            {exporting === "json" ? "Exporting…" : "↓ Download JSON"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--accent2"
            disabled={busy}
            onClick={handlePdfExport}
          >
            {exporting === "pdf" ? "Generating…" : "◎ Generate PDF report"}
          </button>
        </div>
        <span className="admin-toolbar__sep" aria-hidden="true" />
        <span className="admin-muted admin-export-hint">
          {data ? `${data.totalElements} events in log` : "Loading…"}
        </span>
      </div>

      {exportMsg && <div className="admin-alert admin-alert--ok">{exportMsg}</div>}
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
