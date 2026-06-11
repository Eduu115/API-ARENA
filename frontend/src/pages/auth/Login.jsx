import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result?.success) navigate(redirectTo, { replace: true });
  }

  return (
    <div className="auth-page-root challenges-page">
      <div className="auth-page__glow" aria-hidden />
      <div className="ch-grid-bg" aria-hidden />

      <div className="auth-page__shell">
        <div className="auth-page__toolbar">
          <Link to="/" className="auth-page__back" title="Back to home" aria-label="Back to home">
            <ArrowRightIcon width={20} height={20} style={{ transform: "rotate(180deg)" }} />
          </Link>
          <ThemeToggle />
        </div>

        <div className="auth-page__inner">
          <div className="auth-page__grid">
            <div className="auth-copy-block">
              <Link to="/" className="auth-brand-row">
                <img src="/icons/logo-hex-lg.svg" alt="API Arena" width="36" height="36" />
                <span className="ch-logo-text">
                  <span className="ch-api">API</span>
                  <span className="ch-arena">Arena</span>
                </span>
              </Link>

              <div className="ch-page-eyebrow">// Login</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  Back to the
                  <em>Arena</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                Compete in API challenges, climb the leaderboard, and improve your ELO.{" "}
                <span className="auth-copy-strong">No noise, straight to the arena.</span>
              </p>

              <div className="auth-actions">
                <Link to="/register" className="auth-btn-outline">
                  Create account
                  <ArrowRightIcon width={16} height={16} />
                </Link>
                <Link to="/challenges" className="auth-link-quiet">
                  View challenges →
                </Link>
              </div>
            </div>

            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">// Credentials</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">Sign in</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">{submitting ? "// authenticating…" : "// ready"}</div>
                </div>

                {error && (
                  <div className="auth-alert" role="alert">
                    {error}
                  </div>
                )}

                <div className="auth-fields">
                  <div>
                    <label htmlFor="login-email" className="auth-label">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      className="auth-input"
                      placeholder="you@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password" className="auth-label">
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      className="auth-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="auth-forgot-wrap">
                      <Link to="/forgot-password" className="auth-link-inline">
                        Forgot your password?
                      </Link>
                      <Link to="/verify-email" className="auth-link-inline" style={{ marginLeft: 12 }}>
                        Verify email
                      </Link>
                    </div>
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                </button>

                <div className="auth-footer-row">
                  <p>Are you a teacher?</p>
                  <Link to="/login?mode=edu">Sign in (education account) →</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
