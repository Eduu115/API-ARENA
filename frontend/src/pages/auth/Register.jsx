import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import "../challenges/challenges.css";
import "./auth-pages.css";

function getAge(isoDate) {
  const dob = new Date(isoDate);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
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
      setFieldError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setFieldError("Password must be at least 6 characters long.");
      return;
    }
    if (!dateOfBirth) {
      setFieldError("Please enter your date of birth.");
      return;
    }
    if (getAge(dateOfBirth) < 14) {
      setFieldError("You must be at least 14 years old to register.");
      return;
    }
    if (!acceptTerms) {
      setFieldError("You must accept the Privacy Policy and Terms to continue.");
      return;
    }
    setSubmitting(true);
    const result = await doRegister(username, email, password, null, {
      dateOfBirth,
      acceptTerms,
    });
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

              <div className="ch-page-eyebrow">// Register</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  Create your
                  <em>profile</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                One account, one name, and you are in. Enter the dashboard and fight for ELO.
              </p>

              <div className="auth-actions">
                <Link to="/login" className="auth-btn-outline">
                  I already have an account
                  <ArrowRightIcon width={16} height={16} />
                </Link>
                <Link to="/leaderboard" className="auth-link-quiet">
                  View leaderboard →
                </Link>
              </div>
            </div>

            <div className="auth-page__col-form auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">// Details</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">Create account</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">{submitting ? "// creating…" : "// ready"}</div>
                </div>

                {displayError && (
                  <div className="auth-alert" role="alert">
                    {displayError}
                  </div>
                )}

                <div className="auth-fields">
                  <div>
                    <label htmlFor="register-username" className="auth-label">
                      Username
                    </label>
                    <input
                      id="register-username"
                      type="text"
                      className="auth-input"
                      placeholder="yourNick"
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
                      placeholder="you@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field-grid">
                    <div>
                      <label htmlFor="register-password" className="auth-label">
                        Password
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
                        Confirm
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

                  <div>
                    <label htmlFor="register-dob" className="auth-label">
                      Date of birth
                    </label>
                    <input
                      id="register-dob"
                      type="date"
                      className="auth-input"
                      autoComplete="bday"
                      value={dateOfBirth}
                      max={TODAY_ISO}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                    <p className="auth-help-text">You must be at least 14 years old to register.</p>
                  </div>

                  <label className="auth-consent">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                    />
                    <span>
                      I have read and accept the{" "}
                      <Link to="/privacidad" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </Link>{" "}
                      and the{" "}
                      <Link to="/terminos" target="_blank" rel="noopener noreferrer">
                        Terms of Use
                      </Link>
                      .
                    </span>
                  </label>
                </div>

                <button type="submit" className="auth-submit" disabled={submitting}>
                  {submitting ? "Creating account…" : "Sign up"}
                </button>

                <div className="auth-footer-row">
                  <p>Are you a teacher?</p>
                  <Link to="/login">Sign in (education account) →</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
