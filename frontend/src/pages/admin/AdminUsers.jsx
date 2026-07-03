import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { banUser, searchUsers, setUserRole, unbanUser } from "../../lib/adminApi";
import BanModal from "./BanModal";
import UnbanModal from "./UnbanModal";
import { fmtDate, isOnline } from "./adminFormat";

const ROLES = ["STUDENT", "TEACHER", "ADMIN"];

export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [banning, setBanning] = useState(null); // user pending ban (opens the form)
  const [unbanning, setUnbanning] = useState(null); // user pending unban (opens the form)

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await searchUsers({ query, role, active, page, size: 25 }));
    } catch (e) {
      setError(e?.message ?? "Search failed");
    }
  }, [query, role, active, page]);

  useEffect(() => {
    load();
  }, [load]);

  function patchRow(updated) {
    setData((d) =>
      d ? { ...d, content: d.content.map((u) => (u.id === updated.id ? updated : u)) } : d
    );
  }

  async function confirmBan(payload) {
    const u = banning;
    setBusyId(u.id);
    try {
      patchRow(await banUser(u.id, payload));
      setBanning(null);
    } catch (e) {
      window.alert(e?.message ?? "Ban failed");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmUnban(payload) {
    const u = unbanning;
    setBusyId(u.id);
    try {
      patchRow(await unbanUser(u.id, payload));
      setUnbanning(null);
    } catch (e) {
      window.alert(e?.message ?? "Unban failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onChangeRole(u, newRole) {
    if (newRole === u.role) return;
    if (!window.confirm(`Change ${u.username} from ${u.role} to ${newRole}?`)) return;
    setBusyId(u.id);
    try {
      patchRow(await setUserRole(u.id, newRole));
    } catch (e) {
      window.alert(e?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const rows = data?.content ?? [];

  return (
    <div>
      <div className="admin-eyebrow">Directory</div>
      <h1 className="admin-h1">Users</h1>

      <form
        className="admin-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          load();
        }}
      >
        <input
          className="admin-input"
          placeholder="Search username or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="admin-input" value={role} onChange={(e) => { setPage(0); setRole(e.target.value); }}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className="admin-input" value={active} onChange={(e) => { setPage(0); setActive(e.target.value); }}>
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Banned</option>
        </select>
        <button type="submit" className="admin-btn">
          Search
        </button>
      </form>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>ELO</th>
              <th>Last seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={u.isActive ? "" : "admin-row--banned"}>
                <td>
                  <span
                    className={`admin-dot ${isOnline(u.lastSeenAt) ? "admin-dot--on" : ""}`}
                    title={isOnline(u.lastSeenAt) ? "Online" : "Offline"}
                  />
                </td>
                <td>
                  <Link to={`/admin/users/${u.id}`} className="admin-link">
                    {u.username}
                  </Link>
                  <div className="admin-muted">{u.email}</div>
                </td>
                <td>
                  <select
                    className="admin-input admin-input--sm"
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => onChangeRole(u, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`admin-pill ${u.isActive ? "admin-pill--ok" : "admin-pill--bad"}`}>
                    {u.isActive ? "Active" : "Banned"}
                  </span>
                </td>
                <td className="admin-mono">{u.rating}</td>
                <td className="admin-muted">{fmtDate(u.lastSeenAt)}</td>
                <td>
                  <button
                    type="button"
                    className={`admin-btn admin-btn--sm ${u.isActive ? "admin-btn--danger" : ""}`}
                    disabled={busyId === u.id}
                    onClick={() => (u.isActive ? setBanning(u) : setUnbanning(u))}
                  >
                    {u.isActive ? "Ban…" : "Unban…"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-muted" style={{ textAlign: "center", padding: 24 }}>
                  No users
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
            Page {data.number + 1} / {data.totalPages || 1} · {data.totalElements} users
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--sm"
            disabled={data.number + 1 >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {banning && (
        <BanModal
          username={banning.username}
          busy={busyId === banning.id}
          onCancel={() => setBanning(null)}
          onConfirm={confirmBan}
        />
      )}
      {unbanning && (
        <UnbanModal
          username={unbanning.username}
          busy={busyId === unbanning.id}
          onCancel={() => setUnbanning(null)}
          onConfirm={confirmUnban}
        />
      )}
    </div>
  );
}
