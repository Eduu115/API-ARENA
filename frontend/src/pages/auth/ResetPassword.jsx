import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as authApi from "../../lib/authApi";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import { usePageMeta } from "../../lib/usePageMeta";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  usePageMeta({ title: "Reset password", path: "/reset-password" });

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(err?.message || "Could not reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-root challenges-page">
      <div className="auth-page__glow" aria-hidden />
      <div className="ch-grid-bg" aria-hidden />

      <div className="auth-page__shell">
        <div className="auth-page__toolbar">
          <Link to="/login" className="auth-page__back" title="Back to login" aria-label="Back to login">
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
              <div className="ch-page-eyebrow">// Recovery</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  Choose a new
                  <em>password</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                Set a new password for your account. For your security, all existing sessions will be signed out.
              </p>
            </div>

            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">// New password</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">Reset password</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">{submitting ? "// saving…" : "// ready"}</div>
                </div>

                {!token && (
                  <div className="auth-alert" role="alert">
                    Missing or invalid reset link. Request a new one from{" "}
                    <Link to="/forgot-password">Forgot password</Link>.
                  </div>
                )}

                {done ? (
                  <div className="auth-alert auth-alert--ok" role="status">
                    Password updated. Redirecting you to sign in…
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="auth-alert" role="alert">
                        {error}
                      </div>
                    )}
                    <div className="auth-fields">
                      <div>
                        <label htmlFor="rp-password" className="auth-label">
                          New password
                        </label>
                        <input
                          id="rp-password"
                          type="password"
                          className="auth-input"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                          disabled={!token}
                        />
                      </div>
                      <div>
                        <label htmlFor="rp-confirm" className="auth-label">
                          Confirm new password
                        </label>
                        <input
                          id="rp-confirm"
                          type="password"
                          className="auth-input"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={!token}
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={submitting || !token}>
                      {submitting ? "Saving…" : "Set new password"}
                    </button>
                  </>
                )}

                <div className="auth-footer-row">
                  <p>Back to</p>
                  <Link to="/login">Sign in →</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
