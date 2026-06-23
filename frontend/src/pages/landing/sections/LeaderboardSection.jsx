import LocaleLink from '../../../components/LocaleLink';
import { Trans, useTranslation } from 'react-i18next';
import { LB_ENTRIES } from '../landing.data';

function LeaderboardRow({ rank, initials, name, score, time, tier, avatarGradient, scoreColor }) {
  const isMuted = !tier;
  return (
    <div className={`lb-row${tier ? ` ${tier}` : ''}`}>
      <span
        className="lb-rank"
        style={isMuted ? { color: 'var(--muted)' } : undefined}
      >
        {rank}
      </span>
      <div className="lb-user">
        <div className="lb-avatar" style={{ background: avatarGradient }}>
          {initials}
        </div>
        <span className="lb-username">{name}</span>
      </div>
      <span
        className="lb-score"
        style={{
          color: scoreColor ?? undefined,
          fontSize: isMuted ? '22px' : undefined,
        }}
      >
        {score}
      </span>
      <span className="lb-time">{time}</span>
    </div>
  );
}

export default function LeaderboardSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="lb-section">
      <div className="lb-grid">
        <div>
          <div className="live-badge">
            <span className="live-dot" />
            {t('leaderboard.live')}
          </div>
          <div className="lb-table">
            <div className="lb-header-row">
              <span className="lb-head-cell">{t('leaderboard.colRank')}</span>
              <span className="lb-head-cell">{t('leaderboard.colPlayer')}</span>
              <span className="lb-head-cell">{t('leaderboard.colScore')}</span>
              <span className="lb-head-cell" style={{ textAlign: 'right' }}>{t('leaderboard.colTime')}</span>
            </div>
            {LB_ENTRIES.map((entry) => (
              <LeaderboardRow key={entry.rank} {...entry} />
            ))}
          </div>
        </div>

        <div className="lb-right">
          <div className="section-label">{t('leaderboard.label')}</div>
          <h2 className="section-title">
            {t('leaderboard.title1')}<br />{t('leaderboard.title2')}<br /><em>{t('leaderboard.titleEm')}</em>
          </h2>
          <p className="lb-right-desc">
            <Trans i18nKey="leaderboard.desc" t={t} />
          </p>
          <LocaleLink to="/leaderboard" className="btn-primary">
            {t('leaderboard.cta')}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
