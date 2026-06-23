import { useTranslation } from 'react-i18next';

export default function CtaSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="cta-section">
      <div className="cta-bg-text">ARENA</div>
      <div className="cta-glow" />

      <div className="cta-content">
        <div
          className="section-label"
          style={{ justifyContent: 'center', marginBottom: '24px' }}
        >
          {t('cta.label')}
        </div>

        <h2 className="cta-title">
          <span className="white">{t('cta.titleWhite')}</span>
          <span className="outlined">{t('cta.titleOutlined')}</span>
        </h2>

        <p className="cta-sub">{t('cta.sub')}</p>

        <div className="cta-input-row">
          <input
            className="cta-input"
            type="email"
            placeholder={t('cta.placeholder')}
          />
          <button className="cta-btn">{t('cta.button')}</button>
        </div>

        <p className="cta-fine">{t('cta.fine')}</p>
      </div>
    </section>
  );
}
