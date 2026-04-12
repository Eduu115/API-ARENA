import { useEffect, useMemo, useState } from "react";
import TeacherLayout from "./TeacherLayout";
import { MOCK_CORRECTIONS, formatTeacherDate } from "./teacher.mock";
import * as groupsApi from "../../lib/groupsApi";

const STATUS_COLOR = {
  PENDING: "var(--warn)",
  NEEDS_REVIEW: "var(--purple)",
  GRADED: "var(--green)",
};

export default function Corrections() {
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    groupsApi.getMyGroups().then((data) => setGroups(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_CORRECTIONS.filter((c) => {
      if (groupId !== "all" && c.groupId !== groupId) return false;
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return (
        c.student.toLowerCase().includes(q) ||
        c.challenge.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [groupId, status, query]);

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ch-page-eyebrow">// Corrections</div>
          <h1 className="ch-page-title">
            Review<em>Submissions</em>
          </h1>
        </div>
        <div className="ch-page-controls">
          <select className="ch-sort-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="all">GROUP: ALL</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                GROUP: {g.name.toUpperCase()}
              </option>
            ))}
          </select>
          <select className="ch-sort-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">STATUS: ALL</option>
            <option value="PENDING">STATUS: PENDING</option>
            <option value="NEEDS_REVIEW">STATUS: NEEDS_REVIEW</option>
            <option value="GRADED">STATUS: GRADED</option>
          </select>
        </div>
      </div>

      <div className="ch-active-filters" style={{ alignItems: "center" }}>
        <div className="ch-search-wrap" style={{ minWidth: 260 }}>
          <span className="ch-search-icon">/</span>
          <input
            type="text"
            className="ch-search-input"
            placeholder="search by student, challenge, or id..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="ch-results-count" style={{ marginLeft: "auto" }}>
          <span>{filtered.length}</span> submissions
        </span>
      </div>

      <div className="db-panel" style={{ marginTop: 14 }}>
        <div className="db-panel-head">
          <div className="db-panel-title">List</div>
          <div className="db-panel-action" style={{ cursor: "default" }}>
            // mock data
          </div>
        </div>

        <div className="sub-table" style={{ border: "none" }}>
          <div className="sub-table-head">
            <div className="sub-th">ID</div>
            <div className="sub-th">Student</div>
            <div className="sub-th">Challenge</div>
            <div className="sub-th">Status</div>
            <div className="sub-th sub-th-right">Date</div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              No submissions for these filters
            </div>
          ) : (
            filtered.map((c) => {
              const color = STATUS_COLOR[c.status] ?? "var(--muted)";
              return (
                <div key={c.id} className="sub-row">
                  <div className="sub-row-id">#{c.id}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>@{c.student}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="sub-row-challenge-title">{c.challenge}</div>
                    <div className="sub-row-challenge-meta">
                      <span style={{ color: "var(--muted)" }}>group</span>
                      <span style={{ color: "var(--dim)" }}>·</span>
                      <span>{groups.find((g) => String(g.id) === String(c.groupId))?.name ?? c.groupId}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color }}>
                    {c.status}
                  </div>
                  <div className="sub-row-time">{formatTeacherDate(c.submittedAt)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}

