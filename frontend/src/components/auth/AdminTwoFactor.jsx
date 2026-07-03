import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * ADMIN 2FA step. On first login (enrolled=false) it fetches a TOTP secret to add manually
 * to an authenticator app; then it verifies the 6-digit code and unlocks the bunker.
 * ponytail: manual key entry, no QR image (no dep, and the secret never leaves for a 3rd-party QR service).
 */
export default function AdminTwoFactor({ pendingToken, enrolled, onSuccess }) {
  const { enrollAdmin2fa, verifyAdmin2fa } = useAuth();
  const [secret, setSecret] = useState(null);
  const [otpauthUri, setOtpauthUri] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!enrolled) {
      enrollAdmin2fa(pendingToken)
        .then((data) => {
          if (cancelled) return;
          setSecret(data?.secret ?? null);
          setOtpauthUri(data?.otpauthUri ?? null);
        })
        .catch((e) => !cancelled && setError(e?.message ?? "Enrolment failed"));
    }
    return () => {
      cancelled = true;
    };
  }, [enrolled, pendingToken, enrollAdmin2fa]);

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyAdmin2fa(pendingToken, code.trim());
      onSuccess();
    } catch (e2) {
      setError(e2?.message ?? "Invalid code");
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleVerify}>
      <div className="auth-form__head">
        <div>
          <div className="ch-page-eyebrow">SECURE ACCESS</div>
          <div className="auth-title-crt auth-title-crt--sm">
            <h2 className="ch-card-title">Two-factor authentication</h2>
          </div>
        </div>
      </div>

      {error && (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      )}

      {!enrolled && (
        <div className="auth-fields">
          <p className="ch-card-desc">
            Add this account to your authenticator app (Google Authenticator, Authy…) using the key below,
            then enter the 6-digit code.
          </p>
          <div>
            <label className="auth-label">Setup key (Base32)</label>
            <code
              className="auth-input"
              style={{ display: "block", wordBreak: "break-all", userSelect: "all" }}
            >
              {secret || "…"}
            </code>
          </div>
          {otpauthUri && (
            <a className="auth-link-inline" href={otpauthUri}>
              Open in authenticator app
            </a>
          )}
        </div>
      )}

      <div className="auth-fields">
        <div>
          <label htmlFor="totp-code" className="auth-label">
            Authentication code
          </label>
          <input
            id="totp-code"
            className="auth-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
          />
        </div>
      </div>

      <button type="submit" className="auth-submit" disabled={busy || code.length !== 6}>
        {busy ? "Verifying…" : "Verify & enter"}
      </button>
    </form>
  );
}
