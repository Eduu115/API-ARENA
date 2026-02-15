import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./auth.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const { register: doRegister, error, clearError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setFieldError(null);
    if (password !== confirmPassword) {
      setFieldError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setFieldError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    const result = await doRegister(username, email, password, null);
    setSubmitting(false);
    if (result?.success) navigate("/dashboard", { replace: true });
  }

  const displayError = fieldError || error;

  return (
    <div className="auth-wrapper">
      <div className="auth-main">
        {/* Panel izquierdo - Switch */}
        <div className="auth-switch">
          <div className="auth-switch__circle auth-switch__circle--1" />
          <div className="auth-switch__circle auth-switch__circle--2" />
          <div className="auth-switch__content">
            <h2 className="auth-switch__title">¡Bienvenido de nuevo!</h2>
            <p className="auth-switch__description">
              Mantente conectado con nosotros iniciando sesión con tu información personal
            </p>
            <Link to="/login" className="auth-switch__button no-underline">
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Panel derecho - Formulario Register */}
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form__title">Crear cuenta</h2>
            <div className="auth-form__icons">
              <div className="auth-form__icon" title="OAuth" aria-hidden />
              <div className="auth-form__icon" title="OAuth" aria-hidden />
              <div className="auth-form__icon" title="OAuth" aria-hidden />
            </div>
            <span className="auth-form__span">o usa email para registrarte</span>
            {displayError && (
              <div className="auth-form__error" role="alert">
                {displayError}
              </div>
            )}
            <input
              type="text"
              className="auth-form__input"
              placeholder="Usuario"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={50}
              required
            />
            <input
              type="email"
              className="auth-form__input"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="auth-form__input"
              placeholder="Contraseña"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <input
              type="password"
              className="auth-form__input"
              placeholder="Confirmar contraseña"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" className="auth-form__button" disabled={submitting}>
              {submitting ? "Creando cuenta…" : "Registrarse"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
