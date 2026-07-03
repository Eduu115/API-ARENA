import { useState } from "react";

/** Admin capability domains (mirror of AdminCapability on the backend). */
const CAPABILITIES = [
  ["MODERATION", "Moderation", "Bans, warnings, messaging, ELO/XP, impersonation, deletion."],
  ["BI", "Business Intelligence", "Analytics dashboards and business reports."],
];

/**
 * Pick which kind of admin a user is (its capability set). Supreme-only.
 * onConfirm receives an array of capability codes. Confirming with none makes a
 * read-only admin (can open the console but perform no gated action).
 */
export default function AdminCapsModal({ username, initial = [], busy, onCancel, onConfirm }) {
  const [caps, setCaps] = useState(() => new Set(initial));

  function toggle(code) {
    setCaps((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  return (
    <div className="admin-modal__backdrop" onClick={() => !busy && onCancel()}>
      <div
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Admin capabilities for ${username}`}
      >
        <div className="admin-modal__title">Admin type · {username}</div>
        <div className="admin-modal__hint">
          Choose what this admin can do. An admin with every capability is supreme and can manage other admins.
        </div>

        {CAPABILITIES.map(([code, label, desc]) => (
          <label key={code} className="admin-formfield" style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={caps.has(code)} onChange={() => toggle(code)} disabled={busy} />
            <span>
              <span className="admin-formfield__label" style={{ margin: 0 }}>{label}</span>
              <span className="admin-muted" style={{ display: "block" }}>{desc}</span>
            </span>
          </label>
        ))}

        <div className="admin-modal__actions">
          <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="admin-btn" disabled={busy} onClick={() => onConfirm([...caps])}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
