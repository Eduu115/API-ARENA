import { useTranslation } from 'react-i18next';

export default function LandingStackPanel({ variant = 'hero' }) {
  const { t } = useTranslation('landing');
  const tags = t('about.tags', { returnObjects: true });
  const list = Array.isArray(tags) ? tags : [];
  const stackTags = list.filter((tag) => tag.active || tag.comingSoon);

  return (
    <div
      className={`hero-stack${variant === 'about' ? ' hero-stack--about' : ''}`}
      role="note"
      aria-label={t('stacks.aria')}
    >
      <p className="hero-stack-note">{t('stacks.note')}</p>
      <div className="about-tags">
        {stackTags.map(({ label, active, comingSoon }) => (
          <span
            key={label}
            className={`tag${active ? ' active' : ''}${comingSoon ? ' tag--soon' : ''}`}
          >
            {label}
            {comingSoon && (
              <span className="tag-soon-label">{t('features.comingSoon')}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
