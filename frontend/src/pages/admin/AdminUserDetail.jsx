import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  adjustUser,
  banUser,
  clearWarnings,
  deleteUser,
  forceLogout,
  getModeration,
  getUser,
  getUserSubmissions,
  impersonate,
  messageUser,
  reset2fa,
  unbanUser,
  verifyEmail,
  warnUser,
} from "../../lib/adminApi";
import { setAdminEscape } from "../../lib/adminEscape";
import BanModal from "./BanModal";
import UnbanModal from "./UnbanModal";
import { fmtDate, fmtDuration, isOnline } from "./adminFormat";

function Row({ label, children }) {
  return (
    <div className="admin-spec__row">
      <dt>{label}</dt>
      <dd>{children ?? "—"}</dd>
    </div>
  );
}

function statusPill(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED") return "admin-pill--ok";
  if (s === "FAILED" || s === "ERROR" || s === "ABANDONED") return "admin-pill--bad";
  if (s === "PENDING" || s === "RUNNING" || s === "PROCESSING") return "admin-pill--warn";
  return "admin-pill--muted";
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadUser, user: me } = useAuth();
  const [user, setUser] = useState(null);
  const [subs, setSubs] = useState(null);
  const [moderation, setModeration] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // "message" | "adjust" | "ban" | "warn"
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [ratingDelta, setRatingDelta] = useState("");
  const [xpDelta, setXpDelta] = useState("");
  const [warnReason, setWarnReason] = useState("");

  const isSelf = me?.id != null && user?.id != null && me.id === user.id;

  useEffect(() => {
    let cancelled = false;
    getUser(id)
      .then((u) => !cancelled && setUser(u))
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load user"));
    getUserSubmissions(id)
      .then((s) => !cancelled && setSubs(s))
      .catch(() => !cancelled && setSubs([]));
    getModeration(id)
      .then((m) => !cancelled && setModeration(m))
      .catch(() => !cancelled && setModeration([]));
    return () => {
      cancelled = true;
    };
  }, [id]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function reloadModeration() {
    getModeration(id)
      .then(setModeration)
      .catch(() => {});
  }

  async function run(label, fn, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const updated = await fn();
      if (updated && updated.id) setUser(updated);
      flash(`${label} ✓`);
    } catch (e) {
      window.alert(e?.message ?? "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function onImpersonate() {
    if (!window.confirm(`Impersonate ${user.username}? You'll browse the site AS them (audited).`)) return;
    setBusy(true);
    try {
      await impersonate(id);
      setAdminEscape();
      await loadUser();
      navigate("/es/dashboard", { replace: true });
    } catch (e) {
      window.alert(e?.message ?? "Impersonation failed");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!window.confirm(`Delete ${user.username}? This ERASES the account and all its data.`)) return;
    if (!window.confirm("This cannot be undone. Confirm final deletion.")) return;
    setBusy(true);
    try {
      await deleteUser(id);
      navigate("/admin/users", { replace: true });
    } catch (e) {
      window.alert(e?.message ?? "Delete failed");
      setBusy(false);
    }
  }

  async function onSendMessage() {
    setBusy(true);
    try {
      await messageUser(id, msgTitle.trim(), msgBody.trim());
      setModal(null);
      setMsgTitle("");
      setMsgBody("");
      flash("Message sent ✓");
    } catch (e) {
      window.alert(e?.message ?? "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function onBan(payload) {
    setBusy(true);
    try {
      const updated = await banUser(id, payload);
      if (updated?.id) setUser(updated);
      setModal(null);
      reloadModeration();
      flash("Banned ✓");
    } catch (e) {
      window.alert(e?.message ?? "Ban failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUnban(payload) {
    setBusy(true);
    try {
      const updated = await unbanUser(id, payload);
      if (updated?.id) setUser(updated);
      setModal(null);
      reloadModeration();
      flash("Unbanned ✓");
    } catch (e) {
      window.alert(e?.message ?? "Unban failed");
    } finally {
      setBusy(false);
    }
  }

  async function onWarn() {
    setBusy(true);
    try {
      const updated = await warnUser(id, warnReason.trim());
      if (updated?.id) setUser(updated);
      setModal(null);
      setWarnReason("");
      reloadModeration();
      flash(updated && !updated.isActive ? "Warned → auto-banned ✓" : "Warning issued ✓");
    } catch (e) {
      window.alert(e?.message ?? "Warn failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAdjust() {
    setBusy(true);
    try {
      const updated = await adjustUser(id, Number(ratingDelta) || 0, Number(xpDelta) || 0);
      if (updated?.id) setUser(updated);
      setModal(null);
      setRatingDelta("");
      setXpDelta("");
      flash("Adjusted ✓");
    } catch (e) {
      window.alert(e?.message ?? "Adjust failed");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="admin-alert">{error}</div>;
  if (!user) return <div className="admin-muted">Loading…</div>;

  return (
    <div>
      <Link to="/admin/users" className="admin-link admin-mono">
        ← Users
      </Link>
      <div className="admin-eyebrow" style={{ marginTop: 12 }}>
        User #{user.id} · {user.role}
      </div>
      <h1 className="admin-h1">
        <span className={`admin-dot ${isOnline(user.lastSeenAt) ? "admin-dot--on" : ""}`} /> {user.username}
        {!user.isActive && <span className="admin-badge admin-badge--banned">BANNED</span>}
      </h1>

      {toast && (
        <div className="admin-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {isSelf && (
        <div className="admin-muted" style={{ marginBottom: 10 }}>
          This is your own account — moderation actions are disabled on yourself.
        </div>
      )}

      {/* God-mode command bar */}
      <div className="admin-toolbar" role="group" aria-label="User actions">
        <div className="admin-toolbar__group">
          {user.isActive ? (
            <button
              className="admin-btn admin-btn--danger admin-btn--sm"
              disabled={busy || isSelf}
              onClick={() => setModal("ban")}
            >
              Ban…
            </button>
          ) : (
            <button className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setModal("unban")}>
              Unban…
            </button>
          )}
          <button
            className="admin-btn admin-btn--sm"
            disabled={busy || isSelf}
            onClick={() => setModal("warn")}
          >
            Warn ({user.warnings ?? 0}/3)
          </button>
          {(user.warnings ?? 0) > 0 && (
            <button
              className="admin-btn admin-btn--sm"
              disabled={busy}
              onClick={() => run("Warnings cleared", () => clearWarnings(id), `Clear warnings for ${user.username}?`)}
            >
              Clear warns
            </button>
          )}
          <button
            className="admin-btn admin-btn--sm"
            disabled={busy}
            onClick={() => run("Sessions revoked", () => forceLogout(id), `Force logout ${user.username}?`)}
          >
            Force logout
          </button>
        </div>

        <div className="admin-toolbar__sep" />

        <div className="admin-toolbar__group">
          {!user.emailVerified && (
            <button
              className="admin-btn admin-btn--sm"
              disabled={busy}
              onClick={() => run("Email verified", () => verifyEmail(id))}
            >
              Verify email
            </button>
          )}
          {user.totpEnabled && (
            <button
              className="admin-btn admin-btn--sm"
              disabled={busy}
              onClick={() => run("2FA reset", () => reset2fa(id), `Reset 2FA for ${user.username}?`)}
            >
              Reset 2FA
            </button>
          )}
          <button className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setModal("message")}>
            Message
          </button>
        </div>

        <div className="admin-toolbar__sep" />

        <div className="admin-toolbar__group">
          <button className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setModal("adjust")}>
            Adjust ELO/XP
          </button>
          <button
            className="admin-btn admin-btn--accent2 admin-btn--sm"
            disabled={busy || isSelf}
            onClick={onImpersonate}
          >
            Impersonate
          </button>
        </div>
      </div>

      <div className="admin-hero" style={{ marginTop: 18 }}>
        <section className="admin-spec">
          <div className="admin-spec__head">Identity</div>
          <dl className="admin-spec__grid">
            <Row label="Email">
              <span className="admin-mono">{user.email}</span>{" "}
              <span className={`admin-pill ${user.emailVerified ? "admin-pill--ok" : "admin-pill--warn"}`}>
                {user.emailVerified ? "verified" : "unverified"}
              </span>
            </Row>
            <Row label="Role">
              <span className="admin-pill admin-pill--accent">{user.role}</span>
            </Row>
            <Row label="Status">
              <span className={`admin-pill ${user.isActive ? "admin-pill--ok" : "admin-pill--bad"}`}>
                {user.isActive ? "Active" : "Banned"}
              </span>
            </Row>
            <Row label="2FA">{user.totpEnabled ? "Enabled" : "—"}</Row>
            <Row label="Warnings">
              <span className={`admin-pill ${(user.warnings ?? 0) >= 2 ? "admin-pill--bad" : (user.warnings ?? 0) === 1 ? "admin-pill--warn" : "admin-pill--muted"}`}>
                {user.warnings ?? 0} / 3
              </span>
            </Row>
            {!user.isActive && <Row label="Ban reason">{user.banReason || "—"}</Row>}
            {!user.isActive && (
              <Row label="Ban expiry">{user.bannedUntil ? fmtDate(user.bannedUntil) : "Permanent"}</Row>
            )}
            <Row label="GitHub">{user.githubUsername}</Row>
            <Row label="Registered">{fmtDate(user.createdAt)}</Row>
          </dl>
        </section>

        <section className="admin-spec">
          <div className="admin-spec__head">Progression</div>
          <dl className="admin-spec__grid">
            <Row label="ELO rating">
              <span className="admin-mono">{user.rating}</span>
            </Row>
            <Row label="Level">
              <span className="admin-mono">L{user.level}</span>
            </Row>
            <Row label="XP">
              <span className="admin-mono">{user.experiencePoints}</span>
            </Row>
            <Row label="Challenges completed">{user.totalChallengesCompleted}</Row>
            <Row label="Tests passed">{user.totalTestsPassed}</Row>
            <Row label="Development time">{fmtDuration(user.totalDevelopmentSeconds)}</Row>
            <Row label="Browsing time">{fmtDuration(user.totalBrowsingSeconds)}</Row>
            <Row label="Last seen">{fmtDate(user.lastSeenAt)}</Row>
          </dl>
        </section>
      </div>

      <h2 className="admin-h2">Moderation history ({moderation.length})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Category</th>
              <th>Reason</th>
              <th>Description</th>
              <th>Until</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {moderation.map((m) => (
              <tr key={m.id}>
                <td className="admin-muted">{fmtDate(m.createdAt)}</td>
                <td>
                  <span className={`admin-pill ${m.type === "BAN" ? "admin-pill--bad" : "admin-pill--ok"}`}>
                    {m.type}
                  </span>
                </td>
                <td>{m.category ? <span className="admin-pill admin-pill--muted">{m.category}</span> : "—"}</td>
                <td>{m.reason}</td>
                <td className="admin-muted" style={{ whiteSpace: "normal", maxWidth: 280 }}>
                  {m.description || "—"}
                </td>
                <td className="admin-muted">
                  {m.bannedUntil ? fmtDate(m.bannedUntil) : m.type === "BAN" ? "Permanent" : "—"}
                </td>
                <td className="admin-mono">{m.actorEmail}</td>
              </tr>
            ))}
            {moderation.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-muted" style={{ textAlign: "center", padding: 24 }}>
                  No moderation history
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="admin-h2">Submissions ({subs?.length ?? 0})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Challenge</th>
              <th>Status</th>
              <th>Score</th>
              <th>Time to submit</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.challengeTitle || `#${s.challengeId}`}</td>
                <td>
                  <span className={`admin-pill ${statusPill(s.status)}`}>{s.status}</span>
                </td>
                <td className="admin-mono">{s.totalScore ?? "—"}</td>
                <td className="admin-mono">
                  {s.developmentTimeSeconds != null ? fmtDuration(s.developmentTimeSeconds) : "—"}
                </td>
                <td className="admin-muted">{fmtDate(s.createdAt)}</td>
              </tr>
            ))}
            {subs && subs.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-muted" style={{ textAlign: "center", padding: 24 }}>
                  No submissions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Danger zone */}
      <div className="admin-danger-zone">
        <div>
          <div className="admin-danger-zone__title">Danger zone</div>
          <div className="admin-muted">Permanently erase this account and all of its data (GDPR).</div>
        </div>
        <button className="admin-btn admin-btn--danger" disabled={busy || isSelf} onClick={onDelete}>
          Delete account
        </button>
      </div>

      {/* Message composer */}
      {modal === "message" && (
        <div className="admin-modal__backdrop" onClick={() => !busy && setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__title">Message {user.username}</div>
            <div className="admin-modal__hint">Sends an email + in-app notification.</div>
            <input
              className="admin-input"
              placeholder="Subject"
              maxLength={120}
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
            />
            <textarea
              className="admin-input admin-textarea"
              placeholder="Write your message…"
              maxLength={2000}
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
            />
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn--primary"
                disabled={busy || !msgTitle.trim() || !msgBody.trim()}
                onClick={onSendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELO/XP adjuster */}
      {modal === "adjust" && (
        <div className="admin-modal__backdrop" onClick={() => !busy && setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__title">Adjust {user.username}</div>
            <div className="admin-modal__hint">
              Signed deltas. Current: ELO {user.rating} · XP {user.experiencePoints}. Level is recomputed from XP.
            </div>
            <div className="admin-field-row">
              <label>
                ELO Δ
                <input
                  className="admin-input"
                  type="number"
                  placeholder="0"
                  value={ratingDelta}
                  onChange={(e) => setRatingDelta(e.target.value)}
                />
              </label>
              <label>
                XP Δ
                <input
                  className="admin-input"
                  type="number"
                  placeholder="0"
                  value={xpDelta}
                  onChange={(e) => setXpDelta(e.target.value)}
                />
              </label>
            </div>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn--primary"
                disabled={busy || (!ratingDelta && !xpDelta)}
                onClick={onAdjust}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban form */}
      {modal === "ban" && (
        <BanModal username={user.username} busy={busy} onCancel={() => setModal(null)} onConfirm={onBan} />
      )}

      {/* Unban form */}
      {modal === "unban" && (
        <UnbanModal username={user.username} busy={busy} onCancel={() => setModal(null)} onConfirm={onUnban} />
      )}

      {/* Warn form */}
      {modal === "warn" && (
        <div className="admin-modal__backdrop" onClick={() => !busy && setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__title">Warn {user.username}</div>
            <div className="admin-modal__hint">
              Current: {user.warnings ?? 0}/3. The 3rd warning auto-bans (permanent). The user is emailed.
            </div>
            <textarea
              className="admin-input admin-textarea"
              placeholder="Reason for the warning…"
              maxLength={500}
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
            />
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn--primary" disabled={busy || !warnReason.trim()} onClick={onWarn}>
                Issue warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
