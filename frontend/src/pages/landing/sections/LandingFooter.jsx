import LocaleLink from '../../../components/LocaleLink';
import { useTranslation } from 'react-i18next';
import { FOOTER_LINKS } from '../landing.data';
import { openConsentManager } from '../../../lib/cookieConsent';

export default function LandingFooter() {
  const { t } = useTranslation('landing');
  const linkLabels = t('footer.links', { returnObjects: true });
  const legal = t('footer.legal', { returnObjects: true });

  const legalLinks = [
    { label: legal?.aviso, to: '/aviso-legal' },
    { label: legal?.privacidad, to: '/privacidad' },
    { label: legal?.cookies, to: '/cookies' },
    { label: legal?.terminos, to: '/terminos' },
  ];

  const footerLinkKeys = ['github', 'docs', 'api', 'status'];

  return (
    <footer>
      <div className="footer-left">
        <strong style={{
          color: 'var(--cyan)',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: '18px',
          letterSpacing: '2px',
          fontWeight: '900',
        }}>
          <span style={{ color: 'var(--cyan)' }}>API</span>Arena
        </strong>
        <br />
        {t('footer.tagline')}<br />
        {t('footer.project')}
      </div>

      <div className="footer-right">
        {FOOTER_LINKS.map(({ href }, i) => (
          <a key={footerLinkKeys[i]} href={href}>
            {linkLabels?.[footerLinkKeys[i]] ?? footerLinkKeys[i]}
          </a>
        ))}
        {legalLinks.map(({ label, to }) => (
          <LocaleLink key={to} to={to}>{label}</LocaleLink>
        ))}
        <button type="button" onClick={openConsentManager}>
          {t('footer.cookiePrefs')}
        </button>
      </div>
    </footer>
  );
}
