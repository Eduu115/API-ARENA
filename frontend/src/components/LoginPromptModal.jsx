import { Link, useLocation } from "react-router-dom";
import "./LoginPromptModal.css";

/**
 * Modal to prompt sign-in when authentication is required.
 */
export default function LoginPromptModal({ open, onClose, title = "Sign in", description }) {
  const location = useLocation();
  const state = { from: location };

  if (!open) return null;

  return (
    <div className="login-prompt-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="login-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="login-prompt-title" className="login-prompt-modal-title">
          {title}
        </h2>
        <p className="login-prompt-modal-text">
          {description ||
            "You need to sign in to start this challenge. If you do not have an account yet, you can register."}
        </p>
        <div className="login-prompt-modal-actions">
          <Link to="/login" state={state} className="login-prompt-modal-btn login-prompt-modal-btn-primary" onClick={onClose}>
            Sign in
          </Link>
          <Link to="/register" state={state} className="login-prompt-modal-btn login-prompt-modal-btn-secondary" onClick={onClose}>
            Create account
          </Link>
          <button type="button" className="login-prompt-modal-btn login-prompt-modal-btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
