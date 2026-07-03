import { useState } from "react";

const REASON_MAX = 100;
const DESC_MAX = 400;

/** Ban classifications for later analytics. */
const BAN_CATEGORIES = [
  ["", "Uncategorized"],
  ["CHEATING", "Cheating"],
  ["TOXICITY", "Toxicity"],
  ["HARASSMENT", "Harassment"],
  ["SPAM", "Spam"],
  ["INAPPROPRIATE", "Inappropriate content"],
  ["MULTI_ACCOUNT", "Multi-accounting"],
  ["SECURITY", "Security / abuse"],
  ["OTHER", "Other"],
];

/**
 * Reusable ban form (front-end modal, no window.prompt). Only "reason" is required and
 * length-limited; category, description and expiry are optional. onConfirm receives
 * { category, reason, description, until }.
 */
export default function BanModal({ username, busy, onCancel, onConfirm }) {
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [until, setUntil] = useState("");

  const canSubmit = reason.trim().length > 0 && !busy;

  function submit() {
    if (!canSubmit) return;
    onConfirm({
      category: category || null,
      reason: reason.trim(),
      description: description.trim() || null,
      until: until || null,
    });
  }

  return (
    <div className="admin-modal__backdrop" onClick={() => !busy && onCancel()}>
      <div
        className="admin-modal admin-modal--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Ban ${username}`}
      >
        <div className="admin-modal__title">Ban {username}</div>
        <div className="admin-modal__hint">
          Revokes their sessions and emails them. Leave the date empty for a permanent ban.
        </div>

        <div className="admin-formfield">
          <span className="admin-formfield__label">
            Category <span className="admin-formfield__opt">for analytics</span>
          </span>
          <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {BAN_CATEGORIES.map(([v, label]) => (
              <option key={v || "none"} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-formfield">
          <span className="admin-formfield__label">
            Reason <span aria-hidden="true">*</span>
            <span className="admin-formfield__count">
              {reason.length}/{REASON_MAX}
            </span>
          </span>
          <input
            className="admin-input"
            placeholder="Short reason (e.g. repeated cheating in ranked)…"
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
            placeholder="More detail for the user (shown in the email)…"
            maxLength={DESC_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="admin-formfield">
          <span className="admin-formfield__label">
            Banned until <span className="admin-formfield__opt">optional · empty = permanent</span>
          </span>
          <input
            className="admin-input"
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </div>

        <div className="admin-modal__actions">
          <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="admin-btn admin-btn--danger" disabled={!canSubmit} onClick={submit}>
            Confirm ban
          </button>
        </div>
      </div>
    </div>
  );
}
