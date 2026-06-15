import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getUserPublicProfile, getUserPublicAchievements } from '../lib/authApi';
import { getPublicUserSubmissions } from '../lib/submissionsApi';
import { getGlobalUserRank } from '../lib/leaderboardApi';
import ProfileBadges from './ProfileBadges';
import {
  isUnranked,
  challengesUntilRanked,
  MIN_RANKED_CHALLENGES,
} from '../lib/rankConstants';
import {
  TIER_LABEL,
  TIER_STYLE,
  achievementIcon,
  achievementTierVars,
} from '../lib/achievementDisplay';
import '../pages/challenges/challenges.css';
import './UserProfileCard.css';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, var(--cyan), var(--purple))',
  'linear-gradient(135deg, var(--green), var(--cyan))',
  'linear-gradient(135deg, var(--warn), var(--red))',
  'linear-gradient(135deg, var(--purple), var(--red))',
  'linear-gradient(135deg, var(--cyan), var(--green))',
];

const bundleCache = new Map();

const ONLINE_NOW_MS = 3 * 60 * 1000;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLastOnline(iso) {
  if (!iso) return 'Last online unknown';
  const seenAt = new Date(iso).getTime();
  if (Number.isNaN(seenAt)) return 'Last online unknown';

  const diffMs = Date.now() - seenAt;
  if (diffMs < ONLINE_NOW_MS) return 'Online now';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) return 'Last online just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Last online ${rtf.format(-minutes, 'minute')}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last online ${rtf.format(-hours, 'hour')}`;

  const days = Math.round(hours / 24);
  if (days < 30) return `Last online ${rtf.format(-days, 'day')}`;

  const months = Math.round(days / 30);
  if (months < 12) return `Last online ${rtf.format(-months, 'month')}`;

  const years = Math.round(months / 12);
  return `Last online ${rtf.format(-years, 'year')}`;
}

function isOnlineNow(iso) {
  if (!iso) return false;
  const seenAt = new Date(iso).getTime();
  return Number.isFinite(seenAt) && Date.now() - seenAt < ONLINE_NOW_MS;
}

function formatScore(score) {
  if (score == null) return '—';
  const n = Number(score);
  return Number.isFinite(n) ? Math.round(n).toLocaleString() : '—';
}

export default function UserProfileCard({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [globalRank, setGlobalRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);

      if (bundleCache.has(userId)) {
        const cached = bundleCache.get(userId);
        setProfile(cached.profile);
        setAchievements(cached.achievements);
        setSubmissions(cached.submissions);
        setGlobalRank(cached.globalRank ?? null);
        setLoading(false);
        return;
      }

      try {
        const [profileRes, achRes, subRes, rankRes] = await Promise.allSettled([
          getUserPublicProfile(userId),
          getUserPublicAchievements(userId),
          getPublicUserSubmissions(userId, 8),
          getGlobalUserRank(userId),
        ]);

        if (cancelled) return;

        if (profileRes.status !== 'fulfilled') {
          setError(true);
          setLoading(false);
          return;
        }

        const bundle = {
          profile: profileRes.value,
          achievements: achRes.status === 'fulfilled' ? achRes.value : [],
          submissions: subRes.status === 'fulfilled' ? subRes.value : [],
          globalRank: rankRes.status === 'fulfilled' ? rankRes.value : null,
        };
        bundleCache.set(userId, bundle);
        setProfile(bundle.profile);
        setAchievements(bundle.achievements);
        setSubmissions(bundle.submissions);
        setGlobalRank(bundle.globalRank);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements]
  );
  const lockedCount = achievements.length - unlockedAchievements.length;

  if (!userId) return null;

  const initials = profile?.username?.slice(0, 2).toUpperCase() || '??';
  const avatarBg = AVATAR_GRADIENTS[(userId ?? 0) % AVATAR_GRADIENTS.length];
  const unranked = profile ? isUnranked(profile.totalChallengesCompleted) : false;
  const untilRanked = profile ? challengesUntilRanked(profile.totalChallengesCompleted) : MIN_RANKED_CHALLENGES;
  const solved = profile?.totalChallengesCompleted ?? 0;
  const rankProgress = Math.min(100, (solved / MIN_RANKED_CHALLENGES) * 100);
  const onlineNow = profile ? isOnlineNow(profile.lastSeenAt) : false;

  return (
    <div className="upc-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className="upc-panel challenges-page"
        role="dialog"
        aria-modal="true"
        aria-label="Public profile"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="upc-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {loading ? (
          <div className="upc-state">
            <div className="upc-state-label">// Loading operator file</div>
            <div className="upc-state-dots" aria-hidden>···</div>
          </div>
        ) : error || !profile ? (
          <div className="upc-state">
            <div className="upc-state-label">Could not load profile</div>
          </div>
        ) : (
          <div className="upc-scroll">
            <header className="upc-hero">
              <div className="upc-hero-bg" aria-hidden />
              <div className="upc-hero-inner">
                <div className="upc-identity">
                  <div className="upc-avatar-wrap">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="" className="upc-avatar-img" />
                    ) : (
                      <div className="upc-avatar" style={{ background: avatarBg }}>{initials}</div>
                    )}
                  </div>
                  <div className="upc-identity-text">
                    <div className="ch-page-eyebrow">// Public profile</div>
                    <h2 className="upc-name">
                      <span className="upc-name-user">{profile.username}</span>
                      <span className="upc-name-level">· Lvl {profile.level ?? 1}</span>
                    </h2>
                    <p className={`upc-last-online${onlineNow ? ' upc-last-online--now' : ''}`}>
                      {onlineNow && <span className="upc-last-online-dot" aria-hidden />}
                      {formatLastOnline(profile.lastSeenAt)}
                    </p>
                    <div className="upc-badges">
                      <ProfileBadges
                        profile={profile}
                        achievements={achievements}
                        globalRank={globalRank}
                        showRole
                        showSince
                      />
                    </div>
                  </div>
                </div>

                <div className={`upc-rank-block${unranked ? ' upc-rank-block--unranked' : ''}`}>
                  <div className="upc-rank-label">Arena rating</div>
                  {unranked ? (
                    <>
                      <div className="upc-rank-value upc-rank-value--unranked">UNRANKED</div>
                      <div className="upc-rank-hint">
                        {untilRanked} more challenge{untilRanked !== 1 ? 's' : ''} to classify
                      </div>
                      <div className="upc-rank-progress" aria-hidden>
                        <div className="upc-rank-progress-fill" style={{ width: `${rankProgress}%` }} />
                      </div>
                      <div className="upc-rank-progress-meta">
                        {solved} / {MIN_RANKED_CHALLENGES} completed
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="upc-rank-value">{profile.rating?.toLocaleString() ?? '—'}</div>
                      <div className="upc-rank-hint">ELO rating</div>
                    </>
                  )}
                </div>
              </div>
            </header>

            <div className="upc-kpi-strip">
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--purple)' }}>
                <span className="upc-kpi-val">{profile.experiencePoints?.toLocaleString() ?? 0}</span>
                <span className="upc-kpi-lbl">XP</span>
              </div>
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--green)' }}>
                <span className="upc-kpi-val">{profile.totalChallengesCompleted ?? 0}</span>
                <span className="upc-kpi-lbl">Solved</span>
              </div>
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--warn)' }}>
                <span className="upc-kpi-val">{profile.weeklyStreakCurrent ?? 0}</span>
                <span className="upc-kpi-lbl">Week streak</span>
              </div>
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--warn)' }}>
                <span className="upc-kpi-val">{profile.totalTestsPassed ?? 0}</span>
                <span className="upc-kpi-lbl">Tests passed</span>
              </div>
            </div>

            <div className="upc-main-grid">
              <section className="upc-section upc-section--about">
                <h3 className="upc-section-title">About</h3>
                {profile.bio ? (
                  <p className="upc-bio">{profile.bio}</p>
                ) : (
                  <p className="upc-muted">No bio yet.</p>
                )}
                {profile.githubUsername && (
                  <a
                    className="upc-github"
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    @{profile.githubUsername}
                  </a>
                )}
              </section>

              <section className="upc-section upc-section--achievements">
                <div className="upc-section-head">
                  <h3 className="upc-section-title">Achievements</h3>
                  <span className="upc-section-meta">
                    {unlockedAchievements.length} unlocked
                    {lockedCount > 0 ? ` · ${lockedCount} locked` : ''}
                  </span>
                </div>
                {achievements.length === 0 ? (
                  <p className="upc-muted">No achievements to show.</p>
                ) : (
                  <div className="upc-ach-grid">
                    {achievements.map((a) => {
                      const tier = a.tier || 'COMMON';
                      const ts = TIER_STYLE[tier] || TIER_STYLE.COMMON;
                      const locked = !a.unlocked;
                      return (
                        <div
                          key={a.code}
                          className={[
                            'upc-ach',
                            locked ? 'upc-ach--locked' : 'upc-ach--unlocked',
                          ].join(' ')}
                          style={achievementTierVars(tier)}
                          title={locked ? a.description : undefined}
                        >
                          <span
                            className={`upc-ach-glyph${locked ? ' upc-ach-glyph--locked' : ''}`}
                            style={locked ? undefined : { color: ts.color }}
                            aria-hidden
                          >
                            {locked ? '◌' : achievementIcon(a.iconKey)}
                          </span>
                          <div className="upc-ach-body">
                            <span className="upc-ach-tier" style={{ color: ts.color }}>
                              {TIER_LABEL[tier] || tier}
                            </span>
                            <span className="upc-ach-name">{a.title}</span>
                            {!locked && a.unlockedAt && (
                              <time className="upc-ach-when" dateTime={a.unlockedAt}>
                                {formatDate(a.unlockedAt)}
                              </time>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <section className="upc-section upc-section--subs">
              <div className="upc-section-head">
                <h3 className="upc-section-title">Recent submissions</h3>
                <span className="upc-section-meta">Latest completed runs</span>
              </div>
              {submissions.length === 0 ? (
                <p className="upc-muted">No completed submissions yet.</p>
              ) : (
                <ul className="upc-sub-list">
                  {submissions.map((s) => (
                    <li key={s.id} className="upc-sub-row">
                      <div className="upc-sub-main">
                        <Link
                          to={`/challenges/${s.challengeId}`}
                          className="upc-sub-title"
                          onClick={onClose}
                        >
                          {s.challengeTitle || `Challenge #${s.challengeId}`}
                        </Link>
                        <time className="upc-sub-date" dateTime={s.completedAt || s.createdAt}>
                          {formatDate(s.completedAt || s.createdAt)}
                        </time>
                      </div>
                      <div className="upc-sub-score">{formatScore(s.totalScore)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
