import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptAll,
  getConsent,
  hasDecision,
  rejectNonEssential,
  setConsent,
  OPEN_CONSENT_EVENT,
} from "../lib/cookieConsent";
import "./cookie-consent.css";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState({ preferences: true, analytics: false });

  useEffect(() => {
    if (!hasDecision()) {
      setOpen(true);
    }
    const reopen = () => {
      const current = getConsent();
      setPrefs({
        preferences: current ? !!current.preferences : true,
        analytics: current ? !!current.analytics : false,
      });
      setCustomizing(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setCustomizing(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    close();
  };

  const handleRejectNonEssential = () => {
    rejectNonEssential();
    close();
  };

  const handleSavePrefs = () => {
    setConsent({ preferences: prefs.preferences, analytics: prefs.analytics });
    close();
  };

  return (
    <div className="cc-root" role="dialog" aria-modal="false" aria-label="Cookie and storage preferences">
      <div className="cc-panel">
        <div className="cc-eyebrow">// Privacy</div>
        <h2 className="cc-title">Storage &amp; cookies</h2>

        {!customizing ? (
          <p className="cc-text">
            API Arena uses first-party browser storage that is strictly necessary to run the
            service (login session, in-progress challenge timer). We use no third-party tracking,
            advertising or analytics. Optional storage saves your preferences (theme, tutorials).
            See our <Link to="/cookies">Cookie Policy</Link>.
          </p>
        ) : (
          <div className="cc-options">
            <label className="cc-option cc-option--locked">
              <span className="cc-option-info">
                <span className="cc-option-name">Strictly necessary</span>
                <span className="cc-option-desc">Login session, challenge timer, tab control. Always on.</span>
              </span>
              <input type="checkbox" checked readOnly disabled />
            </label>

            <label className="cc-option">
              <span className="cc-option-info">
                <span className="cc-option-name">Preferences</span>
                <span className="cc-option-desc">Remembers your theme and which tutorials you've seen.</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.preferences}
                onChange={(e) => setPrefs((p) => ({ ...p, preferences: e.target.checked }))}
              />
            </label>

            <label className="cc-option">
              <span className="cc-option-info">
                <span className="cc-option-name">Analytics</span>
                <span className="cc-option-desc">Anonymous product usage to improve the platform (currently not active).</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              />
            </label>
          </div>
        )}

        <div className="cc-actions">
          {!customizing ? (
            <>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setCustomizing(true)}>
                Customize
              </button>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={handleRejectNonEssential}>
                Essential only
              </button>
              <button type="button" className="cc-btn cc-btn--primary" onClick={handleAcceptAll}>
                Accept all
              </button>
            </>
          ) : (
            <>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={handleRejectNonEssential}>
                Essential only
              </button>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={handleSavePrefs}>
                Save choices
              </button>
              <button type="button" className="cc-btn cc-btn--primary" onClick={handleAcceptAll}>
                Accept all
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
