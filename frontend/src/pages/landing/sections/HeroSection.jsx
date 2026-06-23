import LocaleLink from '../../../components/LocaleLink';
import { Trans, useTranslation } from 'react-i18next';
import TerminalWindow from '../../../components/landing/TerminalWindow';
import AlphaBadge from '../../../components/landing/AlphaBadge';
import ArrowRightIcon from '../../../components/icons/ArrowRightIcon';
import { HERO_STATS } from '../landing.data';

export default function HeroSection() {
  const { t } = useTranslation('landing');
  const statLabels = t('hero.stats', { returnObjects: true });

  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-glow-2" />

      <div className="hero-content" data-tutorial="landing-hero-content">
        <p className="hero-eyebrow">{t('hero.eyebrow')}</p>

        <div className="hero-title-row">
          <h1 className="hero-title">
            <span className="line-1">{t('hero.title1')}</span>
            <span className="line-2">{t('hero.title2')}</span>
            <span className="line-3">{t('hero.title3')}</span>
          </h1>
          <AlphaBadge size="hero" className="hero-alpha-badge" />
        </div>

        <p className="hero-sub">
          <Trans i18nKey="hero.sub" t={t} components={{ 1: <strong />, 2: <strong /> }} />
        </p>

        <div className="hero-actions" data-tutorial="landing-hero-cta">
          <LocaleLink to="/register" className="btn-primary">{t('hero.ctaPrimary')}</LocaleLink>
          <LocaleLink to="/challenges" className="btn-secondary">
            {t('hero.ctaSecondary')}
            <ArrowRightIcon />
          </LocaleLink>
        </div>

        <div className="hero-stats">
          {HERO_STATS.map(({ num }, i) => (
            <div key={i} className="stat-item">
              <span className="stat-num">{num}</span>
              <span className="stat-label">{statLabels[i]?.label ?? ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-visual">
        <TerminalWindow />
      </div>
    </section>
  );
}
