import { useTranslation } from 'react-i18next';

const BADGE_COLORS = {
  cyan: 'cyan',
  purple: 'purple',
  green: 'green',
  warn: 'warn',
};

function BentoCell({ num, title, desc, wide, badges, comingSoon, soonLabel, resolveBadgeLabel }) {
  return (
    <div className={`bento-cell${wide ? ' bento-wide' : ''}${comingSoon ? ' bento-cell--soon' : ''} bracket-hover`}>
      <span className="bento-icon" />
      <div className="bento-num">{num}</div>
      <h3 className="bento-title">
        {title}
        {comingSoon && soonLabel && (
          <span className="bento-soon-badge">{soonLabel}</span>
        )}
      </h3>
      <p className="bento-desc">{desc}</p>
      {badges?.length > 0 && (
        <div className="bento-extra">
          {badges.map((badge) => {
            const label = resolveBadgeLabel(badge);
            return (
              <span key={label} className={`mini-badge ${BADGE_COLORS[badge.color] ?? badge.color}`}>
                {label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FeaturesSection() {
  const { t } = useTranslation('landing');
  const features = t('features.items', { returnObjects: true });

  return (
    <section className="features-section">
      <div className="features-header">
        <div>
          <div className="section-label">{t('features.label')}</div>
          <h2 className="section-title">{t('features.title1')}<br />{t('features.title2')}</h2>
        </div>
        <p style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '11px',
          color: 'var(--muted)',
          maxWidth: '280px',
          lineHeight: '1.8',
          letterSpacing: '0.5px',
        }}>
          {t('features.aside')}
        </p>
      </div>

      <div className="bento-grid">
        {(Array.isArray(features) ? features : []).map((feature) => (
          <BentoCell
            key={feature.num}
            {...feature}
            soonLabel={feature.comingSoon ? t('features.comingSoon') : undefined}
            resolveBadgeLabel={(badge) =>
              badge.labelKey ? t(`features.${badge.labelKey}`) : badge.label
            }
          />
        ))}
      </div>
    </section>
  );
}
