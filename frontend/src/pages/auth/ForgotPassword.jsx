import { useState } from "react";
import { Link } from "react-router-dom";
import * as authApi from "../../lib/authApi";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import { usePageMeta } from "../../lib/usePageMeta";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  usePageMeta({ title: "Forgot password", path: "/forgot-password" });

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      // Stay generic: never reveal whether the email exists.
      setSent(true);
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
                  Reset your
                  <em>password</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                Enter your email and we'll send you a link to set a new password. The link expires in 1 hour.
              </p>
            </div>

            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">// Email</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">Forgot password</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">{submitting ? "// sending…" : "// ready"}</div>
                </div>

                {sent ? (
                  <div className="auth-alert auth-alert--ok" role="status">
                    If an account exists with this email, a password reset link has been sent. Check your inbox
                    (and spam).
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
                        <label htmlFor="fp-email" className="auth-label">
                          Email
                        </label>
                        <input
                          id="fp-email"
                          type="email"
                          className="auth-input"
                          placeholder="you@email.com"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={submitting}>
                      {submitting ? "Sending…" : "Send reset link"}
                    </button>
                  </>
                )}

                <div className="auth-footer-row">
                  <p>Remembered it?</p>
                  <Link to="/login">Back to sign in →</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
