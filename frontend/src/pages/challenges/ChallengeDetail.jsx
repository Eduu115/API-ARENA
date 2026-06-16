import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as challengesApi from '../../lib/challengesApi';
import { getChallengeAttemptStatus } from '../../lib/submissionsApi';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import LoginPromptModal from '../../components/LoginPromptModal';
import AttemptPolicyBlockModal from '../../components/AttemptPolicyBlockModal';
import { useMsUntilIso, formatCountdownMs } from '../../lib/challengeAttemptUtils';
import './challenges.css';
import './ChallengeDetail.css';
import TutorialTour from '../../components/tutorial/TutorialTour';
import { DOCS_PATHS } from '../../tutorial/tourDefinitions';
import { useTourSteps } from '../../lib/tourSteps';
import { usePageMeta } from '../../lib/usePageMeta';

export default function ChallengeDetail() {
  const { t, i18n } = useTranslation('challenges');
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const staffBypass = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [attemptPolicy, setAttemptPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [attemptBlockModalOpen, setAttemptBlockModalOpen] = useState(false);
  const tourSteps = useTourSteps('challengeDetail');

  const policyBlocks = useMemo(
    () => !staffBypass && attemptPolicy && attemptPolicy.allowed === false,
    [staffBypass, attemptPolicy],
  );

  const blockTargetIso = useMemo(() => {
    if (!attemptPolicy || attemptPolicy.allowed !== false) return null;
    return attemptPolicy.blockReason === 'DAILY_LIMIT'
      ? attemptPolicy.dailyLimitResetsAtIso
      : attemptPolicy.cooldownUntilIso;
  }, [attemptPolicy]);

  const bannerMsLeft = useMsUntilIso(policyBlocks ? blockTargetIso : null);

  usePageMeta({
    title: challenge?.title
      ? `${challenge.title} ${t('detail.pageTitleSuffix')}`
      : t('detail.pageTitleChallenge'),
    description: challenge?.description
      ? String(challenge.description).slice(0, 158)
      : t('detail.pageDescription'),
    path: `/challenges/${id}`,
  });

  const handleStartChallenge = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    if (!staffBypass && policyLoading) return;
    if (policyBlocks) {
      setAttemptBlockModalOpen(true);
      return;
    }
    navigate(`/challenges/${id}/submit`);
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await challengesApi.getChallengePreview(id);
        if (!cancelled) setChallenge(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || t('detail.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated || staffBypass) {
      setAttemptPolicy(null);
      setPolicyLoading(false);
      return;
    }
    let cancelled = false;
    setPolicyLoading(true);
    (async () => {
      try {
        const p = await getChallengeAttemptStatus(id);
        if (!cancelled) setAttemptPolicy(p);
      } catch {
        if (!cancelled) setAttemptPolicy({ allowed: true, attemptsUsedToday: 0, maxAttemptsPerDay: 3 });
      } finally {
        if (!cancelled) setPolicyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, staffBypass]);

  const diff = challenge?.difficulty?.toLowerCase() || 'easy';
  const diffBadgeClass = {
    easy: 'ch-badge-easy',
    medium: 'ch-badge-medium',
    hard: 'ch-badge-hard',
    expert: 'ch-badge-expert',
  }[diff] ?? 'ch-badge-cat';

  if (loading) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="chd-main">
          <div className="chd-loading">{t('detail.loading')}</div>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="chd-main">
          <p className="chd-error">{error || t('detail.notFound')}</p>
          <button type="button" className="chd-btn-back" onClick={() => navigate('/challenges')}>
            {t('detail.backToChallenges')}
          </button>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString(i18n.language?.startsWith('es') ? 'es-ES' : 'en-US') : '—';

  return (
    <div className="challenges-page chd-page">
      <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
      <main className="chd-main">
        <div className="chd-container">
          {isAuthenticated && !staffBypass && policyBlocks && bannerMsLeft != null && (
            <div className="chd-policy-banner" role="status">
              <div className="chd-policy-banner-title">
                {attemptPolicy.blockReason === 'DAILY_LIMIT'
                  ? t('detail.dailyLimitBanner')
                  : t('detail.cooldownBanner')}
              </div>
              <div className="chd-policy-banner-count">{formatCountdownMs(bannerMsLeft)}</div>
              <p className="chd-policy-banner-copy">
                {attemptPolicy.blockReason === 'DAILY_LIMIT'
                  ? t('detail.dailyBannerCopy')
                  : t('detail.cooldownBannerCopy')}
              </p>
              <div className="chd-policy-banner-actions">
                <button type="button" className="chd-policy-banner-link" onClick={() => setAttemptBlockModalOpen(true)}>
                  {t('detail.viewDetails')}
                </button>
              </div>
            </div>
          )}
          <div className="chd-top-actions" data-tutorial="challenge-detail-actions">
            <button type="button" className="chd-btn-back" onClick={() => navigate('/challenges')}>
              {t('detail.backToChallengesArrow')}
            </button>
            <button
              type="button"
              className={`chd-btn-start${policyBlocks ? ' chd-btn-start--blocked' : ''}`}
              onClick={handleStartChallenge}
              disabled={isAuthenticated && !staffBypass && policyLoading}
            >
              {policyLoading && isAuthenticated && !staffBypass
                ? t('detail.checkingLimits')
                : policyBlocks
                  ? attemptPolicy?.blockReason === 'DAILY_LIMIT'
                    ? t('detail.dailyLimitBtn')
                    : t('detail.cooldownBtn')
                  : t('detail.startChallenge')}
            </button>
          </div>

          <header className="chd-hero" data-tutorial="challenge-detail-hero">
            <div className="chd-hero-tags">
              <span className={`ch-badge ${diffBadgeClass}`}>{challenge.difficulty}</span>
              <span className="ch-badge ch-badge-cat">{challenge.category}</span>
              <span className={`ch-badge ${(challenge.origin || 'LEGACY') === 'COMMUNITY' ? 'ch-badge-community' : 'ch-badge-legacy'}`}>
                {(challenge.origin || 'LEGACY') === 'COMMUNITY' ? t('community') : t('legacy')}
              </span>
              {challenge.featured && <span className="ch-badge ch-badge-new">{t('featuredBadge')}</span>}
              {challenge.isActive === false && (
                <span className="ch-badge" style={{ background: 'var(--red)' }}>
                  {t('detail.inactive')}
                </span>
              )}
            </div>
            <h1 className="chd-hero-title">{challenge.title}</h1>
            <p className="chd-hero-slug">/{challenge.slug}</p>

            <div className="chd-hero-stats">
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.maxScore ?? 1000}</span>
                <span className="chd-stat-label">{t('detail.maxPoints')}</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.timeLimitMinutes ?? 60}</span>
                <span className="chd-stat-label">{t('detail.minutes')}</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.xpReward ?? 200}</span>
                <span className="chd-stat-label">{t('detail.xpReward')}</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.timesAttempted ?? 0}</span>
                <span className="chd-stat-label">{t('detail.attempts')}</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.timesCompleted ?? 0}</span>
                <span className="chd-stat-label">{t('detail.completed')}</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{Number(challenge.averageScore ?? 0).toFixed(1)}</span>
                <span className="chd-stat-label">{t('detail.averageScore')}</span>
              </div>
            </div>

            <div className="chd-hero-meta">
              <span>ID: {challenge.id}</span>
              <span>{t('detail.created')} {formatDate(challenge.createdAt)}</span>
              <span>{t('detail.updated')} {formatDate(challenge.updatedAt)}</span>
            </div>
          </header>

          <section className="chd-section chd-description">
            <h2 className="chd-section-title">{t('detail.description')}</h2>
            <p className="chd-description-text">{challenge.description || t('detail.noDescription')}</p>
          </section>

          <section className="chd-specs-teaser" aria-labelledby="chd-specs-teaser-title" data-tutorial="challenge-detail-specs-note">
            <h2 id="chd-specs-teaser-title" className="chd-specs-teaser-title">
              {t('detail.fullRequirements')}
            </h2>
            <p className="chd-specs-teaser-copy">
              {t('detail.specsTeaser')}{' '}
              <strong>{t('detail.startChallengeStrong')}</strong>{' '}
              {t('detail.specsTeaserAfter')}
            </p>
            <p className="chd-specs-teaser-foot">{t('detail.specsFoot')}</p>
          </section>
        </div>
      </main>
      <BottomNav />
      <LoginPromptModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        variant="challenge"
      />
      <AttemptPolicyBlockModal
        open={attemptBlockModalOpen}
        blockReason={attemptPolicy?.blockReason}
        cooldownUntilIso={attemptPolicy?.cooldownUntilIso}
        dailyLimitResetsAtIso={attemptPolicy?.dailyLimitResetsAtIso}
        challengeTitle={challenge?.title}
        primaryLabelKey="close"
        onDismiss={() => setAttemptBlockModalOpen(false)}
      />
      <TutorialTour
        tourKey="challengeDetail"
        steps={tourSteps}
        docsHref={DOCS_PATHS.challengeDetail}
        when
      />
      <CustomCursor />
    </div>
  );
}
