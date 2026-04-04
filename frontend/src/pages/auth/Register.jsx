import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const { register: doRegister, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

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
    if (result?.needsVerification) {
      navigate("/verify-email", { replace: true, state: { email: email.trim() } });
      return;
    }
    if (result?.success) navigate(redirectTo, { replace: true });
  }

  const displayError = fieldError || error;

  return (
    <div className="auth-page-root challenges-page">
      <div className="auth-page__glow auth-page__glow--register" aria-hidden />
      <div className="ch-grid-bg" aria-hidden />

      <div className="auth-page__shell">
        <div className="auth-page__toolbar">
          <Link to="/" className="auth-page__back" title="Volver a la landing" aria-label="Volver a la landing">
            <ArrowRightIcon width={20} height={20} style={{ transform: "rotate(180deg)" }} />
          </Link>
          <ThemeToggle />
        </div>

        <div className="auth-page__inner">
          <div className="auth-page__grid auth-page__grid--register">
            <div className="auth-page__col-copy auth-copy-block">
              <Link to="/" className="auth-brand-row">
                <img src="/icons/logo-hex-lg.svg" alt="API Arena" width="36" height="36" />
                <span className="ch-logo-text">
                  <span className="ch-api">API</span>
                  <span className="ch-arena">Arena</span>
                </span>
              </Link>

              <div className="ch-page-eyebrow">// Registro</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  Crea tu
                  <em>perfil</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                Una cuenta, un nombre, y listo. Entras al dashboard y a pelear por el ELO.
              </p>

              <div className="auth-actions">
                <Link to="/login" className="auth-btn-outline">
                  Ya tengo cuenta
                  <ArrowRightIcon width={16} height={16} />
                </Link>
                <Link to="/leaderboard" className="auth-link-quiet">
                  Ver leaderboard →
                </Link>
              </div>
            </div>

            <div className="auth-page__col-form auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">// Datos</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">Crear cuenta</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">{submitting ? "// creando…" : "// listo"}</div>
                </div>

                {displayError && (
                  <div className="auth-alert" role="alert">
                    {displayError}
                  </div>
                )}

                <div className="auth-fields">
                  <div>
                    <label htmlFor="register-username" className="auth-label">
                      Usuario
                    </label>
                    <input
                      id="register-username"
                      type="text"
                      className="auth-input"
                      placeholder="tuNick"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      maxLength={50}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="register-email" className="auth-label">
                      Email
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      className="auth-input"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field-grid">
                    <div>
                      <label htmlFor="register-password" className="auth-label">
                        Contraseña
                      </label>
                      <input
                        id="register-password"
                        type="password"
                        className="auth-input"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="register-confirm" className="auth-label">
                        Confirmar
                      </label>
                      <input
                        id="register-confirm"
                        type="password"
                        className="auth-input"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={submitting}>
                  {submitting ? "Creando cuenta…" : "Registrarse"}
                </button>

                <div className="auth-footer-row">
                  <p>¿Eres profesor?</p>
                  <Link to="/login">Inicia sesión (cuenta educativa) →</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
