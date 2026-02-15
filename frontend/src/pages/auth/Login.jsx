import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result?.success) navigate("/dashboard", { replace: true });
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-main">
        {/* Panel izquierdo - Switch */}
        <div className="auth-switch">
          <div className="auth-switch__circle auth-switch__circle--1" />
          <div className="auth-switch__circle auth-switch__circle--2" />
          <div className="auth-switch__content">
            <h2 className="auth-switch__title">¿No tienes cuenta?</h2>
            <p className="auth-switch__description">
              Crea una cuenta y únete al reto. Es rápido y fácil.
            </p>
            <Link to="/register" className="auth-switch__button no-underline">
              Registrarse
            </Link>
          </div>
        </div>

        {/* Panel derecho - Formulario Login */}
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form__title">Iniciar sesión</h2>
            <div className="auth-form__icons">
              <div className="auth-form__icon" title="OAuth" aria-hidden />
              <div className="auth-form__icon" title="OAuth" aria-hidden />
              <div className="auth-form__icon" title="OAuth" aria-hidden />
            </div>
            <span className="auth-form__span">o usa email para entrar</span>
            {error && (
              <div className="auth-form__error" role="alert">
                {error}
              </div>
            )}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="auth-form__link-wrap">
              <button type="button" className="auth-form__link auth-form__link--button">
                ¿Has olvidado tu contraseña?
              </button>
            </div>
            <button type="submit" className="auth-form__button" disabled={submitting}>
              {submitting ? "Entrando…" : "Entrar al reto"}
            </button>
            <p className="auth-form__span mt-4">
              ¿No tienes una cuenta?{" "}
              <Link to="/register" className="auth-form__link">
                Registrarse
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
