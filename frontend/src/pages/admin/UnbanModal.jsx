import { useState } from "react";

const REASON_MAX = 100;
const DESC_MAX = 400;

/** Unban mini-form. Only "reason" required; recorded for later consultation. onConfirm({reason, description}). */
export default function UnbanModal({ username, busy, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = reason.trim().length > 0 && !busy;

  function submit() {
    if (!canSubmit) return;
    onConfirm({ reason: reason.trim(), description: description.trim() || null });
  }

  return (
    <div className="admin-modal__backdrop" onClick={() => !busy && onCancel()}>
      <div
        className="admin-modal admin-modal--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Unban ${username}`}
      >
        <div className="admin-modal__title">Unban {username}</div>
        <div className="admin-modal__hint">Reactivates the account and clears warnings. Recorded in history.</div>

        <div className="admin-formfield">
          <span className="admin-formfield__label">
            Reason <span aria-hidden="true">*</span>
            <span className="admin-formfield__count">
              {reason.length}/{REASON_MAX}
            </span>
          </span>
          <input
            className="admin-input"
            placeholder="Short reason (e.g. appeal accepted)…"
            maxLength={REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="admin-formfield">
          <span className="admin-formfield__label">
            Description <span className="admin-formfield__opt">optional</span>
            <span className="admin-formfield__count">
              {description.length}/{DESC_MAX}
            </span>
          </span>
          <textarea
            className="admin-input admin-textarea"
            placeholder="Context for the unban (internal note)…"
            maxLength={DESC_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="admin-modal__actions">
          <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="admin-btn admin-btn--primary" disabled={!canSubmit} onClick={submit}>
            Confirm unban
          </button>
        </div>
      </div>
    </div>
  );
}
