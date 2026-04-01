import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./ProfileAccountMenu.css";

export default function ProfileAccountMenu({
  id = "profile-account-menu",
  open,
  onClose,
  user,
  onLogout,
  onSwitchAccount,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="pam-backdrop"
        aria-label="Close account menu"
        onClick={onClose}
      />
      <aside
        id={id}
        className="pam-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pam-title"
      >
        <div className="pam-panel-inner">
          <header className="pam-head">
            <h2 id="pam-title" className="pam-title">
              Account
            </h2>
            <button
              type="button"
              className="pam-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </header>
          {user?.username && (
            <p className="pam-user-line">
              <span className="pam-user-label">Signed in as</span>
              <span className="pam-user-name">{user.username}</span>
            </p>
          )}
          <nav className="pam-nav" aria-label="Account actions">
            <Link
              to="/perfil"
              className="pam-item pam-item-primary"
              onClick={onClose}
            >
              Go to profile
            </Link>
            <button
              type="button"
              className="pam-item pam-item-muted"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
            >
              Switch account
            </button>
            <button
              type="button"
              className="pam-item pam-item-danger"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              Log out
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
