import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import TeacherLayout from "./TeacherLayout";
import * as challengesApi from "../../lib/challengesApi";
import { formatTeacherDate } from "./teacher.mock";

export default function TeacherChallenges() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | published | draft

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await challengesApi.getMyChallenges({ includeInactive: true });
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Error loading challenges");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "published") return items.filter((c) => c?.isActive !== false);
    if (filter === "draft") return items.filter((c) => c?.isActive === false);
    return items;
  }, [items, filter]);

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ch-page-eyebrow">// Management</div>
          <h1 className="ch-page-title">
            My<em>Challenges</em>
          </h1>
        </div>
        <div className="ch-page-controls">
          <Link to="/teacher/challenges/new" className="db-btn db-btn-primary">
            Create challenge
          </Link>
        </div>
      </div>

      <div className="ch-active-filters" style={{ alignItems: "center" }}>
        {[
          { key: "all", label: "ALL" },
          { key: "published", label: "PUBLISHED" },
          { key: "draft", label: "DRAFTS" },
        ].map((f) => (
          <button
            key={f.key}
            className={`sub-filter-btn${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span className="ch-results-count" style={{ marginLeft: "auto" }}>
          <span>{filtered.length}</span> challenges
        </span>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div className="db-panel-title">List</div>
          <Link to="/teacher/challenges/new" className="db-panel-action">
            New →
          </Link>
        </div>

        <div className="sub-table" style={{ border: "none" }}>
          <div className="sub-table-head">
            <div className="sub-th">Title</div>
            <div className="sub-th">Category</div>
            <div className="sub-th">Difficulty</div>
            <div className="sub-th sub-th-right">Status</div>
            <div className="sub-th sub-th-right">Created</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)" }}>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              No challenges for this filter
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="sub-row">
                <div style={{ minWidth: 0 }}>
                  <div className="sub-row-challenge-title">{c.title}</div>
                  <div className="sub-row-challenge-meta">
                    <span style={{ color: "var(--muted)" }}>id</span>
                    <span style={{ color: "var(--dim)" }}>·</span>
                    <span>{c.id}</span>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{c.category}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>{c.difficulty}</div>
                <div className="sub-row-time" style={{ color: c.isActive === false ? "var(--warn)" : "var(--green)" }}>
                  {c.isActive === false ? "DRAFT" : "PUBLISHED"}
                </div>
                <div className="sub-row-time">{formatTeacherDate(c.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}

