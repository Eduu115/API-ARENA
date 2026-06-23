import { Trans, useTranslation } from 'react-i18next';
import AboutScoreRubric from '../../../components/landing/AboutScoreRubric';
import LandingStackPanel from '../../../components/landing/LandingStackPanel';

export default function AboutSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="section">
      <div className="about-grid">
        <div className="about-left">
          <div className="section-label">{t('about.label')}</div>
          <h2 className="section-title">
            {t('about.title1')}<br />
            {t('about.title2')}<br />
            <em>{t('about.titleEm')}</em>
          </h2>
          <p className="about-desc">
            <Trans i18nKey="about.desc" t={t} components={{ 1: <strong />, 2: <strong /> }} />
          </p>
          <LandingStackPanel variant="about" />
        </div>

        <div className="about-right">
          <div className="about-corner-text">API</div>
          <AboutScoreRubric />
        </div>
      </div>
    </section>
  );
}
