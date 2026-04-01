import { Link, useLocation } from "react-router-dom";
import "./LoginPromptModal.css";

/**
 * Modal para invitar a iniciar sesión (p. ej. al pulsar "Iniciar challenge" sin sesión).
 */
export default function LoginPromptModal({ open, onClose, title = "Inicia sesión", description }) {
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
            "Para iniciar este challenge necesitas iniciar sesión. Si aún no tienes cuenta, puedes registrarte."}
        </p>
        <div className="login-prompt-modal-actions">
          <Link to="/login" state={state} className="login-prompt-modal-btn login-prompt-modal-btn-primary" onClick={onClose}>
            Iniciar sesión
          </Link>
          <Link to="/register" state={state} className="login-prompt-modal-btn login-prompt-modal-btn-secondary" onClick={onClose}>
            Crear cuenta
          </Link>
          <button type="button" className="login-prompt-modal-btn login-prompt-modal-btn-ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
