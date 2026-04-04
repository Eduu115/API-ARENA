import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { clearChallengeSession, getChallengeSession } from "../lib/challengeSessionStorage";
import "./ActiveChallengeSessionBanner.css";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ActiveChallengeSessionBanner() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onStorage = () => setTick((n) => n + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("apiarena-challenge-session-change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("apiarena-challenge-session-change", onStorage);
    };
  }, []);

  const session = useMemo(() => {
    if (!isAuthenticated || !user?.id) return null;
    return getChallengeSession(user.id);
  }, [isAuthenticated, user?.id, location.pathname, tick]);

  const onSubmitPageForSession = useMemo(() => {
    if (!session) return false;
    const m = location.pathname.match(/^\/challenges\/([^/]+)\/submit\/?$/);
    if (!m) return false;
    return String(m[1]) === String(session.challengeId);
  }, [location.pathname, session]);

  const visible = Boolean(session && !onSubmitPageForSession);

  const handleContinue = useCallback(() => {
    if (!session) return;
    navigate(`/challenges/${session.challengeId}/submit`);
  }, [navigate, session]);

  const handleAbandon = useCallback(() => {
    if (user?.id) clearChallengeSession(user.id);
  }, [user?.id]);

  if (!visible || !session) return null;

  const timeLabel = session.timerDone ? "TIME'S UP" : formatTime(session.secondsLeft);

  return (
    <div className="acs-banner" role="dialog" aria-labelledby="acs-banner-title">
      <div className="acs-banner-inner">
        <div className="acs-banner-text">
          <span id="acs-banner-title" className="acs-banner-title">
            Challenge in progress
          </span>
          {session.challengeTitle ? (
            <span className="acs-banner-sub">{session.challengeTitle}</span>
          ) : null}
          <span className="acs-banner-time">
            Timer: {timeLabel}
          </span>
        </div>
        <div className="acs-banner-actions">
          <button type="button" className="acs-btn acs-btn-primary" onClick={handleContinue}>
            Continue
          </button>
          <button type="button" className="acs-btn acs-btn-ghost" onClick={handleAbandon}>
            Abandon
          </button>
        </div>
      </div>
    </div>
  );
}
