import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById } from '../../lib/submissionsApi';
import { useAuth } from '../../context/AuthContext';
import { getUserPublicProfile } from '../../lib/authApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import '../challenges/challenges.css';
import './submissions.css';
import './submissionResults.css';

const MIN_RANKED_CHALLENGES = 3;

function useCountUp(target, duration = 1400, delay = 400) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target == null) { setValue(0); return; }
    const absTarget = Math.abs(target);
    if (absTarget === 0) { setValue(0); return; }
    const timer = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * absTarget));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return value;
}

export default function SubmissionResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sub, setSub] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSubmissionById(id)
      .then(data => {
        setSub(data);
        setLoading(false);
        setTimeout(() => setRevealed(true), 200);
        if (data.userId) {
          getUserPublicProfile(data.userId).then(setProfile).catch(() => {});
        }
      })
      .catch(e => { setError(e?.message || 'Failed to load'); setLoading(false); });
  }, [id]);

  const xpDisplay = useCountUp(sub?.xpEarned, 1400, 800);
  const eloAbsDisplay = useCountUp(sub?.eloChange, 1200, 1200);
  const scoreDisplay = useCountUp(sub ? Math.round(Number(sub.totalScore) || 0) : 0, 1000, 400);

  if (loading) {
    return (
      <div className="challenges-page">
        <CustomCursor />
        <div className="ch-grid-bg" />
        <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
          <main className="ch-main">
            <div className="sr-loading">Loading results...</div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="challenges-page">
        <CustomCursor />
        <div className="ch-grid-bg" />
        <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
          <main className="ch-main">
            <div className="sr-error">
              <p>{error || 'Submission not found'}</p>
              <button className="sd-back-btn" onClick={() => navigate('/submissions')}>BACK TO SUBMISSIONS</button>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  const isFirst = sub.isFirstCompletion === true;
  const improved = !isFirst && sub.previousBestScore != null &&
    Number(sub.totalScore) > Number(sub.previousBestScore);
  const notImproved = !isFirst && !improved;
  const prevBest = sub.previousBestScore != null ? Number(sub.previousBestScore).toFixed(1) : null;

  const eloVal = sub.eloChange || 0;
  const eloPositive = eloVal > 0;
  const eloNegative = eloVal < 0;
  const totalChallenges = profile?.totalChallengesCompleted ?? 0;
  const isUnranked = totalChallenges < MIN_RANKED_CHALLENGES;
  const challengesUntilRanked = Math.max(0, MIN_RANKED_CHALLENGES - totalChallenges);

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
        <main className="ch-main">
          <div className={`sr-container ${revealed ? 'sr-revealed' : ''}`}>

            <div className="sr-header">
              <div className="sr-header-label">CHALLENGE COMPLETE</div>
              <div className="sr-score-big">{scoreDisplay}</div>
              <div className="sr-score-sub">/ 1000 POINTS</div>
            </div>

            <div className="sr-badges">
              {isFirst && <span className="sr-badge sr-badge-first">FIRST CLEAR</span>}
              {improved && <span className="sr-badge sr-badge-record">NEW RECORD</span>}
              {notImproved && <span className="sr-badge sr-badge-repeat">REPEATED</span>}
            </div>

            {prevBest && (
              <div className="sr-prev-best">
                Previous best: <span className="sr-prev-val">{prevBest}</span>
              </div>
            )}

            <div className="sr-rewards">
              <div className="sr-reward-card sr-xp-card">
                <div className="sr-reward-icon">XP</div>
                <div className="sr-reward-value sr-xp-value">+{xpDisplay}</div>
                <div className="sr-reward-label">Experience Points</div>
                {notImproved && (
                  <div className="sr-penalty-note">Reduced — no improvement</div>
                )}
              </div>

              <div className="sr-reward-card sr-elo-card">
                <div className="sr-reward-icon">ELO</div>
                {isUnranked ? (
                  <>
                    <div className="sr-reward-value sr-elo-unranked">UNRANKED</div>
                    <div className="sr-reward-label">
                      {challengesUntilRanked > 0
                        ? `${challengesUntilRanked} more challenge${challengesUntilRanked > 1 ? 's' : ''} to rank`
                        : 'Rating Change'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`sr-reward-value ${eloPositive ? 'sr-elo-up' : eloNegative ? 'sr-elo-down' : 'sr-elo-zero'}`}>
                      {eloPositive && `+${eloAbsDisplay}`}
                      {eloNegative && `-${eloAbsDisplay}`}
                      {eloVal === 0 && '0'}
                    </div>
                    <div className="sr-reward-label">Rating Change</div>
                    {eloNegative && (
                      <div className="sr-penalty-note sr-elo-loss-note">Below expected performance</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {profile && !isUnranked && (
              <div className="sr-current-rating">
                Current ELO: <span className="sr-rating-val">{profile.rating}</span>
              </div>
            )}

            <div className="sr-actions">
              <button className="sr-btn-primary" onClick={() => navigate('/challenges')}>
                BACK TO CHALLENGES
              </button>
              <button className="sr-btn-secondary" onClick={() => navigate(`/submissions/${id}`)}>
                VIEW DETAILS
              </button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
