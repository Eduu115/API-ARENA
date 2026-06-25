import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigateLocalized } from '../../routes/LocaleLayout';
import { useTranslation } from 'react-i18next';
import { getMySubmissions, getSubmissionById } from '../../lib/submissionsApi';
import { useAuth } from '../../context/AuthContext';
import { getUserPublicProfile } from '../../lib/authApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import { usePageMeta } from '../../lib/usePageMeta';
import '../challenges/challenges.css';
import './submissions.css';
import './submissionResults.css';

const MIN_RANKED_CHALLENGES = 3;

function useCountUp(target, duration = 1400, delay = 400) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target == null) {
      setValue(0);
      return;
    }
    const absTarget = Math.abs(target);
    if (absTarget === 0) {
      setValue(0);
      return;
    }
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

function normalizeAiReview(rawSuggestions, aiScoreRaw, fallbackSummary) {
  const aiScore = Number(aiScoreRaw) || 0;
  const source = rawSuggestions && typeof rawSuggestions === 'object' ? rawSuggestions : {};
  const summary = typeof source.summary === 'string' ? source.summary : fallbackSummary;
  const provider = typeof source.provider === 'string' ? source.provider : 'heuristic';
  const suggestions = Array.isArray(source.suggestions) ? source.suggestions.filter(Boolean) : [];
  return { aiScore, summary, provider, suggestions };
}

export default function SubmissionResults() {
  const { t } = useTranslation('submissions');
  const { id } = useParams();
  const navigate = useNavigateLocalized();
  const { user } = useAuth();

  const [sub, setSub] = useState(null);
  const [submissionLabel, setSubmissionLabel] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showEloZeroHelp, setShowEloZeroHelp] = useState(false);
  const [celebrateRank, setCelebrateRank] = useState(false);

  usePageMeta({
    title: sub ? submissionLabel || t('results.challengeFallback', { id: sub.challengeId }) : t('results.loading'),
    path: id ? `/submissions/${id}/results` : '/submissions',
  });

  useEffect(() => {
    if (!id) return;
    getSubmissionById(id)
      .then((data) => {
        setSub(data);
        setLoading(false);
        setTimeout(() => setRevealed(true), 200);
        if (data.userId) {
          getUserPublicProfile(data.userId).then(setProfile).catch(() => {});
        }
        getMySubmissions()
          .then((items) => {
            const list = Array.isArray(items) ? items : [];
            const sameChallenge = list
              .filter((s) => Number(s.challengeId) === Number(data.challengeId))
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const idx = sameChallenge.findIndex((s) => Number(s.id) === Number(data.id));
            const attempt = idx >= 0 ? idx + 1 : null;
            const challengeName =
              sameChallenge.find((s) => Number(s.id) === Number(data.id))?.challengeTitle ||
              t('results.challengeFallback', { id: data.challengeId });
            setSubmissionLabel(
              attempt ? t('results.attemptLabel', { name: challengeName, n: attempt }) : challengeName
            );
          })
          .catch(() => setSubmissionLabel(t('results.challengeFallback', { id: data.challengeId })));
      })
      .catch((e) => {
        setError(e?.message || t('results.loadError'));
        setLoading(false);
      });
  }, [id, t]);

  // First time the (own) user becomes ranked: celebrate once (localStorage-gated per user).
  useEffect(() => {
    if (!sub || !profile || !user?.id) return;
    if (Number(user.id) !== Number(sub.userId)) return;
    const ranked = (profile.totalChallengesCompleted ?? 0) >= MIN_RANKED_CHALLENGES;
    const eloApplied = (sub.eloChange || 0) !== 0;
    if (!ranked || !eloApplied) return;
    const key = `apiarena_first_rank_celebrated_${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setCelebrateRank(true);
  }, [sub, profile, user?.id]);

  const xpDisplay = useCountUp(sub?.xpEarned, 1400, 800);
  const eloAbsDisplay = useCountUp(sub?.eloChange, 1200, 1200);
  const scoreDisplay = useCountUp(sub ? Math.round(Number(sub.totalScore) || 0) : 0, 1000, 400);
  const aiDisplay = useCountUp(sub ? Math.round(Number(sub.aiReviewScore) || 0) : 0, 1000, 700);

  if (loading) {
    return (
      <div className="challenges-page">
        <CustomCursor />
        <div className="ch-grid-bg" />
        <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} hideElo />
          <main className="ch-main">
            <div className="sr-loading">{t('results.loading')}</div>
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
          <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} hideElo />
          <main className="ch-main">
            <div className="sr-error">
              <p>{error || t('results.notFound')}</p>
              <button className="sd-back-btn" onClick={() => navigate('/submissions')}>
                {t('results.backToSubmissions')}
              </button>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  const isFirst = sub.isFirstCompletion === true;
  const improved = !isFirst && sub.previousBestScore != null && Number(sub.totalScore) > Number(sub.previousBestScore);
  const notImproved = !isFirst && !improved;
  const prevBest = sub.previousBestScore != null ? Number(sub.previousBestScore).toFixed(1) : null;
  const aiReview = normalizeAiReview(sub.aiSuggestions, sub.aiReviewScore, t('results.aiUnavailable'));
  const headerLabel = submissionLabel || t('results.challengeFallback', { id: sub.challengeId });

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
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} hideElo />
        <main className="ch-main">
          {celebrateRank && (
            <div className="sr-rankup" role="dialog" aria-label={t('results.rankedTitle')} onClick={() => setCelebrateRank(false)}>
              <div className="sr-rankup-glow" />
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className={`sr-confetti sr-confetti-${i % 8}`} />
              ))}
              <div className="sr-rankup-card" onClick={(e) => e.stopPropagation()}>
                <div className="sr-rankup-spark">★</div>
                <div className="sr-rankup-title">{t('results.rankedTitle')}</div>
                <div className="sr-rankup-elo">
                  <span className="sr-rankup-elo-val">{Math.round(profile?.rating ?? user?.rating ?? 0)}</span>
                  <span className="sr-rankup-elo-lbl">ELO</span>
                </div>
                <div className="sr-rankup-sub">{t('results.rankedSubtitle')}</div>
                <button className="sr-rankup-btn" onClick={() => setCelebrateRank(false)}>
                  {t('results.rankedDismiss')}
                </button>
              </div>
            </div>
          )}
          <div className={`sr-container ${revealed ? 'sr-revealed' : ''}`}>
            <div className="sr-header">
              <div className="sr-header-label">{t('results.complete')}</div>
              <div className="sr-submission-name">{headerLabel}</div>
              <div className="sr-score-big">{scoreDisplay}</div>
              <div className="sr-score-sub">{t('results.pointsSuffix')}</div>
            </div>

            <div className="sr-badges">
              {isFirst && <span className="sr-badge sr-badge-first">{t('results.badgeFirst')}</span>}
              {improved && <span className="sr-badge sr-badge-record">{t('results.badgeRecord')}</span>}
              {notImproved && <span className="sr-badge sr-badge-repeat">{t('results.badgeRepeat')}</span>}
            </div>

            {prevBest && (
              <div className="sr-prev-best">
                {t('results.prevBest')} <span className="sr-prev-val">{prevBest}</span>
              </div>
            )}

            <div className="sr-rewards">
              <div className="sr-reward-card sr-xp-card">
                <div className="sr-reward-icon">XP</div>
                <div className="sr-reward-value sr-xp-value">+{xpDisplay}</div>
                <div className="sr-reward-label">{t('results.xpLabel')}</div>
                {notImproved && <div className="sr-penalty-note">{t('results.penaltyNoImprove')}</div>}
              </div>

              <div className="sr-reward-card sr-elo-card">
                <div className="sr-reward-icon">ELO</div>
                {isUnranked ? (
                  <>
                    <div className="sr-elo-unranked-wrap">
                      <div className="sr-reward-value sr-elo-unranked">{t('results.unranked')}</div>
                      <div className="sr-elo-unranked-tooltip">
                        {t('results.unrankedTooltip', { min: MIN_RANKED_CHALLENGES })}
                        {challengesUntilRanked > 0
                          ? ` ${t('results.unrankedRemaining', { count: challengesUntilRanked })}`
                          : ''}
                      </div>
                    </div>
                    <div className="sr-reward-label">
                      {challengesUntilRanked > 0
                        ? t('results.rankMore', { count: challengesUntilRanked })
                        : t('results.ratingChange')}
                    </div>
                  </>
                ) : (
                  <>
                    {eloVal === 0 ? (
                      <div className="sr-elo-zero-wrap">
                        <div className="sr-reward-value sr-elo-zero">0</div>
                        <button
                          type="button"
                          className="sr-elo-help-btn"
                          onClick={() => setShowEloZeroHelp((v) => !v)}
                          aria-label={t('results.whyNoElo')}
                        >
                          ?
                        </button>
                        {showEloZeroHelp && (
                          <div className="sr-elo-help-pop">
                            {t('results.eloZeroHelp')}
                            <button
                              type="button"
                              className="sr-elo-help-link"
                              onClick={() => navigate('/docs/sistema-xp-elo')}
                            >
                              {t('results.viewEloDocs')}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`sr-reward-value ${eloPositive ? 'sr-elo-up' : 'sr-elo-down'}`}>
                        {eloPositive ? `+${eloAbsDisplay}` : `-${eloAbsDisplay}`}
                      </div>
                    )}
                    <div className="sr-reward-label">{t('results.ratingChange')}</div>
                    {eloNegative && (
                      <div className="sr-penalty-note sr-elo-loss-note">{t('results.belowExpected')}</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {profile && !isUnranked && (
              <div className="sr-current-rating">
                {t('results.currentElo')} <span className="sr-rating-val">{profile.rating}</span>
              </div>
            )}

            <div className="sr-ai-review">
              <div className="sr-ai-head">
                <span className="sr-ai-title">{t('results.aiTitle')}</span>
                <span className="sr-ai-provider">{aiReview.provider}</span>
              </div>
              <div className="sr-ai-score">
                {aiDisplay} <span>/ 200</span>
              </div>
              <p className="sr-ai-summary">{aiReview.summary}</p>
              {aiReview.suggestions.length > 0 && (
                <ul className="sr-ai-list">
                  {aiReview.suggestions.slice(0, 3).map((item, idx) => (
                    <li key={`ai-sug-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sr-actions">
              <button className="sr-btn-primary" onClick={() => navigate('/challenges')}>
                {t('results.backToChallenges')}
              </button>
              <button className="sr-btn-secondary" onClick={() => navigate(`/submissions/${id}`)}>
                {t('results.viewDetails')}
              </button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
