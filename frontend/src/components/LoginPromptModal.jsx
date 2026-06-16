import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./LoginPromptModal.css";

/**
 * Modal to prompt sign-in when authentication is required.
 * Pass variant="challenge" for challenge-specific copy.
 */
export default function LoginPromptModal({
  open,
  onClose,
  variant = "default",
  title,
  description,
}) {
  const { t } = useTranslation("common");
  const location = useLocation();
  const state = { from: location };

  if (!open) return null;

  const isChallenge = variant === "challenge";
  const resolvedTitle = title ?? (isChallenge ? t("modals.loginChallenge.title") : t("modals.login.title"));
  const resolvedDescription =
    description ?? (isChallenge ? t("modals.loginChallenge.description") : t("modals.login.description"));

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
          {resolvedTitle}
        </h2>
        <p className="login-prompt-modal-text">{resolvedDescription}</p>
        <div className="login-prompt-modal-actions">
          <Link
            to="/login"
            state={state}
            className="login-prompt-modal-btn login-prompt-modal-btn-primary"
            onClick={onClose}
          >
            {t("modals.login.signIn")}
          </Link>
          <Link
            to="/register"
            state={state}
            className="login-prompt-modal-btn login-prompt-modal-btn-secondary"
            onClick={onClose}
          >
            {t("modals.login.createAccount")}
          </Link>
          <button type="button" className="login-prompt-modal-btn login-prompt-modal-btn-ghost" onClick={onClose}>
            {t("modals.login.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
