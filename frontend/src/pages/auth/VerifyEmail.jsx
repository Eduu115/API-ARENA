import { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import * as authApi from "../../lib/authApi";
import { usePageMeta } from "../../lib/usePageMeta";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get("token");
  const initialEmail = location.state?.email ?? "";

  /** idle = no token flow; loading = confirming token; ok = verified; bad = invalid/expired token */
  const [phase, setPhase] = useState(() => (token ? "loading" : "idle"));
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [email, setEmail] = useState(initialEmail);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendOk, setResendOk] = useState(false);
  const [resendErr, setResendErr] = useState(null);

  usePageMeta({ title: "Verify email", path: "/verify-email" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await authApi.verifyEmailWithToken(token);
        if (!cancelled) {
          setPhase(data?.verified ? "ok" : "bad");
          setVerifyMessage(data?.message ?? "Verification completed.");
        }
      } catch (e) {
        if (!cancelled) {
          setPhase("bad");
          setVerifyMessage(e?.message ?? "Verification failed.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    setResendOk(false);
    setResendErr(null);
    if (!email?.trim()) {
      setResendErr("Enter your email address.");
      return;
    }
    setResendBusy(true);
    try {
      await authApi.resendVerificationEmail(email.trim());
      setResendOk(true);
    } catch (err) {
      setResendErr(err?.message ?? "Could not send email.");
    } finally {
      setResendBusy(false);
    }
  }

  const showResendForm = phase === "idle" || phase === "bad";

  const formStatus =
    phase === "loading" ? "// verifying…" : resendBusy ? "// sending…" : "// ready";

  return (
    <div className="auth-page-root challenges-page">
      <div className="auth-page__glow auth-page__glow--register" aria-hidden />
      <div className="ch-grid-bg" aria-hidden />

      <div className="auth-page__shell">
        <div className="auth-page__toolbar">
          <Link to="/" className="auth-page__back" title="Back to home" aria-label="Back to home">
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

              <div className="ch-page-eyebrow">// Verification</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  Confirm your
                  <em>email</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                We need a verified inbox before you can sign in and submit challenges. Links expire after 48 hours —{" "}
                <span className="auth-copy-strong">request a new one anytime below.</span>
              </p>

              <div className="auth-actions">
                <Link to="/login" className="auth-btn-outline">
                  Sign in
                  <ArrowRightIcon width={16} height={16} />
                </Link>
                <Link to="/docs/primeros-pasos" className="auth-link-quiet">
                  First steps →
                </Link>
              </div>
            </div>

            <div className="auth-page__col-form auth-form-card">
              <div className="auth-form">
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">// Inbox</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">Email verification</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">{formStatus}</div>
                </div>

                {phase === "loading" && (
                  <p className="ch-card-desc auth-verify-lead">
                    Confirming your verification link…
                  </p>
                )}

                {phase === "ok" && (
                  <>
                    <div className="auth-alert auth-alert--ok" role="status">
                      {verifyMessage}
                    </div>
                    <Link to="/login" className="auth-submit auth-submit--link">
                      Log in
                    </Link>
                  </>
                )}

                {phase === "bad" && token && (
                  <>
                    <div className="auth-alert" role="alert">
                      {verifyMessage}
                    </div>
                    <p className="ch-card-desc auth-verify-lead">
                      Request a new link below or contact support if the problem continues.
                    </p>
                  </>
                )}

                {phase === "idle" && (
                  <p className="ch-card-desc auth-verify-lead">
                    We sent a verification link to your inbox. Open it to activate your account, or resend the email if
                    you did not receive it.
                  </p>
                )}

                {showResendForm && (
                  <form className="auth-form auth-form--resend" onSubmit={handleResend}>
                    <div className="auth-fields">
                      <div>
                        <label htmlFor="verify-email" className="auth-label">
                          Email
                        </label>
                        <input
                          id="verify-email"
                          type="email"
                          className="auth-input"
                          placeholder="you@example.com"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {resendOk && (
                      <div className="auth-alert auth-alert--ok" role="status">
                        If an account exists with this email, a verification link has been sent.
                      </div>
                    )}
                    {resendErr && (
                      <div className="auth-alert" role="alert">
                        {resendErr}
                      </div>
                    )}
                    <button type="submit" className="auth-submit" disabled={resendBusy}>
                      {resendBusy ? "Sending…" : "Resend verification email"}
                    </button>
                  </form>
                )}

                <div className="auth-footer-row">
                  <p>Already verified?</p>
                  <Link to="/login">Back to sign in →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
