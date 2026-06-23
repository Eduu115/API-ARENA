import { useTranslation } from 'react-i18next';

/**
 * Retro cartoon × API Arena neon — alpha / early-access stamp for the landing.
 */
export default function AlphaBadge({ size = 'hero', className = '' }) {
  const { t } = useTranslation('landing');
  const rootClass = ['alpha-badge', `alpha-badge--${size}`, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="status" aria-label={t('alphaAria')}>
      <div className="alpha-badge__stack">
        <span className="alpha-badge__burst" aria-hidden />
        <span className="alpha-badge__ring" aria-hidden />
        <div className="alpha-badge__core">
          <span className="alpha-badge__title">{t('alphaTitle')}</span>
          {size !== 'compact' && <span className="alpha-badge__ribbon">{t('alphaRibbon')}</span>}
        </div>
        <span className="alpha-badge__spark alpha-badge__spark--a" aria-hidden>
          ✦
        </span>
        <span className="alpha-badge__spark alpha-badge__spark--b" aria-hidden>
          ✦
        </span>
        <span className="alpha-badge__spark alpha-badge__spark--c" aria-hidden>
          +
        </span>
      </div>
    </div>
  );
}
