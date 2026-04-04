import { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import * as authApi from "../../lib/authApi";
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

  const showResendForm = !token || phase === "bad";

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
          <div className="auth-page__grid auth-page__grid--register auth-verify-email">
            <div className="auth-page__col-form auth-form-card auth-verify-email__card">
              <div className="auth-form__head">
                <div>
                  <div className="ch-page-eyebrow">// Email</div>
                  <div className="auth-title-crt auth-title-crt--sm">
                    <h2 className="ch-card-title">Verify your email</h2>
                  </div>
                </div>
              </div>

              {phase === "loading" && (
                <p className="ch-card-desc" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  Verifying link…
                </p>
              )}

              {phase === "ok" && (
                <>
                  <div className="auth-alert" role="status" style={{ borderColor: "var(--green)" }}>
                    {verifyMessage}
                  </div>
                  <Link
                    to="/login"
                    className="auth-submit"
                    style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                  >
                    Log in
                  </Link>
                </>
              )}

              {phase === "bad" && token && (
                <div className="auth-alert" role="alert">
                  {verifyMessage}
                </div>
              )}

              {phase === "idle" && (
                <p className="ch-card-desc">
                  We sent a verification link to your inbox. Open it to activate your account. You can resend the email
                  if needed.
                </p>
              )}

              {phase === "bad" && token && (
                <p className="ch-card-desc" style={{ marginTop: 12 }}>
                  Request a new link below or contact support if the problem continues.
                </p>
              )}

              {showResendForm && (
                <form className="auth-form" onSubmit={handleResend} style={{ marginTop: 16 }}>
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
                    <div className="auth-alert" role="status" style={{ borderColor: "var(--green)" }}>
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

              <div className="auth-footer-row" style={{ marginTop: 24 }}>
                <Link to="/login">Back to Log in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
