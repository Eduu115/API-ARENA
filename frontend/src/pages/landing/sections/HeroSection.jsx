import { useEffect, useState } from 'react';
import LocaleLink from '../../../components/LocaleLink';
import { Trans, useTranslation } from 'react-i18next';
import TerminalWindow from '../../../components/landing/TerminalWindow';
import AlphaBadge from '../../../components/landing/AlphaBadge';
import ArrowRightIcon from '../../../components/icons/ArrowRightIcon';
import { getChallenges } from '../../../lib/challengesApi';
import LandingStackPanel from '../../../components/landing/LandingStackPanel';

export default function HeroSection() {
  const { t } = useTranslation('landing');
  const statLabels = t('hero.stats', { returnObjects: true });
  const [activeChallengeCount, setActiveChallengeCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getChallenges();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setActiveChallengeCount(list.filter((c) => c.isActive !== false).length);
      } catch {
        if (!cancelled) setActiveChallengeCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      num: activeChallengeCount != null ? String(activeChallengeCount) : '—',
      text: false,
      label: statLabels?.[0]?.label ?? '',
    },
    {
      num: '1000',
      text: false,
      label: statLabels?.[1]?.label ?? '',
    },
    {
      num: statLabels?.[2]?.value ?? 'Real HTTP',
      text: true,
      label: statLabels?.[2]?.label ?? '',
    },
  ];

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

        <LandingStackPanel variant="hero" />

        <div className="hero-actions" data-tutorial="landing-hero-cta">
          <LocaleLink to="/register" className="btn-primary">{t('hero.ctaPrimary')}</LocaleLink>
          <LocaleLink to="/challenges" className="btn-secondary">
            {t('hero.ctaSecondary')}
            <ArrowRightIcon />
          </LocaleLink>
        </div>

        <div className="hero-stats">
          {stats.map(({ num, text, label }, i) => (
            <div key={i} className="stat-item">
              <span className={`stat-num${text ? ' stat-num--text' : ''}`}>{num}</span>
              <span className="stat-label">{label}</span>
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
