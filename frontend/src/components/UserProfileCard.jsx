import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import LocaleLink from './LocaleLink';
import { useTranslation } from 'react-i18next';
import { getUserPublicProfile, getUserPublicAchievements, getUserPublicBadges } from '../lib/authApi';
import { getPublicUserSubmissions } from '../lib/submissionsApi';
import { getGlobalUserRank } from '../lib/leaderboardApi';
import * as friendsApi from '../lib/friendsApi';
import { useAuth } from '../context/AuthContext';
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

function formatDate(iso, locale) {
  if (!iso) return '—';
  const loc = locale?.startsWith('es') ? 'es-ES' : 'en-US';
  return new Date(iso).toLocaleDateString(loc, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLastOnline(iso, locale, t) {
  if (!iso) return t('publicCard.lastOnlineUnknown');
  const seenAt = new Date(iso).getTime();
  if (Number.isNaN(seenAt)) return t('publicCard.lastOnlineUnknown');

  const diffMs = Date.now() - seenAt;
  if (diffMs < ONLINE_NOW_MS) return t('publicCard.onlineNow');

  const rtfLocale = locale?.startsWith('es') ? 'es' : 'en';
  const rtf = new Intl.RelativeTimeFormat(rtfLocale, { numeric: 'auto' });
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) return t('publicCard.lastOnlineJustNow');

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return t('publicCard.lastOnlineRelative', { relative: rtf.format(-minutes, 'minute') });
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return t('publicCard.lastOnlineRelative', { relative: rtf.format(-hours, 'hour') });
  }

  const days = Math.round(hours / 24);
  if (days < 30) {
    return t('publicCard.lastOnlineRelative', { relative: rtf.format(-days, 'day') });
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return t('publicCard.lastOnlineRelative', { relative: rtf.format(-months, 'month') });
  }

  const years = Math.round(months / 12);
  return t('publicCard.lastOnlineRelative', { relative: rtf.format(-years, 'year') });
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
  const { user: currentUser, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation('profile');
  const { t: tf } = useTranslation('friends');
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [displayedBadges, setDisplayedBadges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [globalRank, setGlobalRank] = useState(null);
  const [friendRel, setFriendRel] = useState(null);
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendBusy, setFriendBusy] = useState(false);
  const [friendError, setFriendError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const overlayRef = useRef(null);

  const isSelf = currentUser?.id != null && Number(currentUser.id) === Number(userId);
  const canShowFriendActions = Boolean(profile && !isSelf);

  const refreshFriendStatus = useCallback(async () => {
    if (!userId || !isAuthenticated || isSelf) {
      setFriendRel(null);
      return;
    }
    setFriendLoading(true);
    setFriendError(null);
    try {
      const data = await friendsApi.getFriendshipStatus(userId);
      setFriendRel(data);
    } catch {
      setFriendRel({ relationship: 'NONE' });
    } finally {
      setFriendLoading(false);
    }
  }, [userId, isAuthenticated, isSelf]);

  useEffect(() => {
    refreshFriendStatus();
  }, [refreshFriendStatus]);

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
        setDisplayedBadges(cached.displayedBadges ?? []);
        setSubmissions(cached.submissions);
        setGlobalRank(cached.globalRank ?? null);
        setLoading(false);
        return;
      }

      try {
        const [profileRes, achRes, badgeRes, subRes, rankRes] = await Promise.allSettled([
          getUserPublicProfile(userId),
          getUserPublicAchievements(userId),
          getUserPublicBadges(userId),
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
          displayedBadges: badgeRes.status === 'fulfilled' ? badgeRes.value : [],
          submissions: subRes.status === 'fulfilled' ? subRes.value : [],
          globalRank: rankRes.status === 'fulfilled' ? rankRes.value : null,
        };
        bundleCache.set(userId, bundle);
        setProfile(bundle.profile);
        setAchievements(bundle.achievements);
        setDisplayedBadges(bundle.displayedBadges);
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

  const handleAddFriend = async () => {
    if (!userId || friendBusy) return;
    setFriendBusy(true);
    setFriendError(null);
    try {
      await friendsApi.sendFriendRequest(userId);
      await refreshFriendStatus();
    } catch (err) {
      setFriendError(err?.message || tf('errorSend'));
    } finally {
      setFriendBusy(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!friendRel?.friendshipId || friendBusy) return;
    setFriendBusy(true);
    setFriendError(null);
    try {
      await friendsApi.acceptFriendRequest(friendRel.friendshipId);
      await refreshFriendStatus();
    } catch {
      setFriendError(tf('errorAccept'));
    } finally {
      setFriendBusy(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!friendRel?.friendshipId || friendBusy) return;
    setFriendBusy(true);
    setFriendError(null);
    try {
      await friendsApi.cancelFriendRequest(friendRel.friendshipId);
      await refreshFriendStatus();
    } catch {
      setFriendError(tf('errorUpdate'));
    } finally {
      setFriendBusy(false);
    }
  };

  const handleUnfriend = async () => {
    if (!userId || friendBusy) return;
    const name = profile?.username ?? tf('confirmUnfriendFallback');
    if (!window.confirm(tf('confirmUnfriend', { name }))) return;
    setFriendBusy(true);
    setFriendError(null);
    try {
      await friendsApi.removeFriend(userId);
      await refreshFriendStatus();
    } catch {
      setFriendError(tf('errorRemove'));
    } finally {
      setFriendBusy(false);
    }
  };

  const renderFriendActions = () => {
    if (!canShowFriendActions) return null;

    if (!isAuthenticated) {
      return (
        <div className="upc-friend-bar">
          <LocaleLink
            to="/login"
            state={{ from: { pathname: window.location.pathname } }}
            className="upc-friend-btn upc-friend-btn--primary"
          >
            {tf('loginToAddFriend')}
          </LocaleLink>
        </div>
      );
    }

    if (friendLoading) {
      return (
        <div className="upc-friend-bar">
          <span className="upc-friend-status">{tf('checkingFriendship')}</span>
        </div>
      );
    }

    const rel = friendRel?.relationship ?? 'NONE';

    return (
      <div className="upc-friend-bar">
        {friendError && (
          <p className="upc-friend-error" role="alert">{friendError}</p>
        )}
        {rel === 'NONE' && (
          <button
            type="button"
            className="upc-friend-btn upc-friend-btn--primary"
            onClick={handleAddFriend}
            disabled={friendBusy}
          >
            {friendBusy ? tf('sending') : tf('addFriend')}
          </button>
        )}
        {rel === 'PENDING_OUTGOING' && (
          <>
            <span className="upc-friend-status upc-friend-status--pending">{tf('requestSent')}</span>
            <button
              type="button"
              className="upc-friend-btn upc-friend-btn--ghost"
              onClick={handleCancelRequest}
              disabled={friendBusy}
            >
              {friendBusy ? '…' : tf('cancelRequest')}
            </button>
          </>
        )}
        {rel === 'PENDING_INCOMING' && (
          <>
            <button
              type="button"
              className="upc-friend-btn upc-friend-btn--primary"
              onClick={handleAcceptFriend}
              disabled={friendBusy}
            >
              {friendBusy ? '…' : tf('acceptRequest')}
            </button>
            <button
              type="button"
              className="upc-friend-btn upc-friend-btn--ghost"
              onClick={handleCancelRequest}
              disabled={friendBusy}
            >
              {tf('decline')}
            </button>
          </>
        )}
        {rel === 'FRIEND' && (
          <>
            <span className="upc-friend-status upc-friend-status--friend">{tf('badgeFriends')}</span>
            <button
              type="button"
              className="upc-friend-btn upc-friend-btn--ghost"
              onClick={handleUnfriend}
              disabled={friendBusy}
            >
              {friendBusy ? '…' : tf('unfriend')}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="upc-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className="upc-panel challenges-page"
        role="dialog"
        aria-modal="true"
        aria-label={t('publicCard.dialogLabel')}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="upc-close" onClick={onClose} aria-label={t('publicCard.close')}>
          ×
        </button>

        {loading ? (
          <div className="upc-state">
            <div className="upc-state-label">{t('publicCard.loading')}</div>
            <div className="upc-state-dots" aria-hidden>···</div>
          </div>
        ) : error || !profile ? (
          <div className="upc-state">
            <div className="upc-state-label">{t('publicCard.loadError')}</div>
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
                    <div className="ch-page-eyebrow">{t('publicCard.eyebrow')}</div>
                    <h2 className="upc-name">
                      <span className="upc-name-user">{profile.username}</span>
                      <span className="upc-name-level">· {t('publicCard.level', { n: profile.level ?? 1 })}</span>
                    </h2>
                    <p className={`upc-last-online${onlineNow ? ' upc-last-online--now' : ''}`}>
                      {onlineNow && <span className="upc-last-online-dot" aria-hidden />}
                      {formatLastOnline(profile.lastSeenAt, i18n.language, t)}
                    </p>
                    <div className="upc-badges">
                      <ProfileBadges
                        profile={profile}
                        globalRank={globalRank}
                        displayedBadges={displayedBadges}
                        showRole
                        showSince
                      />
                    </div>
                    {renderFriendActions()}
                  </div>
                </div>

                <div className={`upc-rank-block${unranked ? ' upc-rank-block--unranked' : ''}`}>
                  <div className="upc-rank-label">{t('publicCard.arenaRating')}</div>
                  {unranked ? (
                    <>
                      <div className="upc-rank-value upc-rank-value--unranked">{t('publicCard.unranked')}</div>
                      <div className="upc-rank-hint">
                        {t('publicCard.rankMore', { count: untilRanked })}
                      </div>
                      <div className="upc-rank-progress" aria-hidden>
                        <div className="upc-rank-progress-fill" style={{ width: `${rankProgress}%` }} />
                      </div>
                      <div className="upc-rank-progress-meta">
                        {t('publicCard.completedProgress', { solved, min: MIN_RANKED_CHALLENGES })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="upc-rank-value">{profile.rating?.toLocaleString(i18n.language) ?? '—'}</div>
                      <div className="upc-rank-hint">{t('publicCard.eloRating')}</div>
                    </>
                  )}
                </div>
              </div>
            </header>

            <div className="upc-kpi-strip">
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--purple)' }}>
                <span className="upc-kpi-val">{profile.experiencePoints?.toLocaleString(i18n.language) ?? 0}</span>
                <span className="upc-kpi-lbl">XP</span>
              </div>
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--green)' }}>
                <span className="upc-kpi-val">{profile.totalChallengesCompleted ?? 0}</span>
                <span className="upc-kpi-lbl">{t('publicCard.kpiSolved')}</span>
              </div>
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--warn)' }}>
                <span className="upc-kpi-val">{profile.weeklyStreakCurrent ?? 0}</span>
                <span className="upc-kpi-lbl">{t('publicCard.kpiWeekStreak')}</span>
              </div>
              <div className="upc-kpi" style={{ '--kpi-color': 'var(--warn)' }}>
                <span className="upc-kpi-val">{profile.totalTestsPassed ?? 0}</span>
                <span className="upc-kpi-lbl">{t('publicCard.kpiTestsPassed')}</span>
              </div>
            </div>

            <div className="upc-main-grid">
              <section className="upc-section upc-section--about">
                <h3 className="upc-section-title">{t('publicCard.about')}</h3>
                {profile.bio ? (
                  <p className="upc-bio">{profile.bio}</p>
                ) : (
                  <p className="upc-muted">{t('publicCard.noBio')}</p>
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
                  <h3 className="upc-section-title">{t('publicCard.achievements')}</h3>
                  <span className="upc-section-meta">
                    {t('publicCard.unlockedMeta', { count: unlockedAchievements.length })}
                    {lockedCount > 0 ? t('publicCard.lockedSuffix', { count: lockedCount }) : ''}
                  </span>
                </div>
                {achievements.length === 0 ? (
                  <p className="upc-muted">{t('publicCard.noAchievements')}</p>
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
                                {formatDate(a.unlockedAt, i18n.language)}
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
                <h3 className="upc-section-title">{t('publicCard.recentSubmissions')}</h3>
                <span className="upc-section-meta">{t('publicCard.recentMeta')}</span>
              </div>
              {submissions.length === 0 ? (
                <p className="upc-muted">{t('publicCard.noSubmissions')}</p>
              ) : (
                <ul className="upc-sub-list">
                  {submissions.map((s) => (
                    <li key={s.id} className="upc-sub-row">
                      <div className="upc-sub-main">
                        <LocaleLink
                          to={`/challenges/${s.challengeId}`}
                          className="upc-sub-title"
                          onClick={onClose}
                        >
                          {s.challengeTitle || t('publicCard.challengeFallback', { id: s.challengeId })}
                        </LocaleLink>
                        <time className="upc-sub-date" dateTime={s.completedAt || s.createdAt}>
                          {formatDate(s.completedAt || s.createdAt, i18n.language)}
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
