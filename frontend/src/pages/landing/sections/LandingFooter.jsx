import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '../landing.data';
import { openConsentManager } from '../../../lib/cookieConsent';

const LEGAL_LINKS = [
  { label: 'Aviso Legal', to: '/aviso-legal' },
  { label: 'Privacidad', to: '/privacidad' },
  { label: 'Cookies', to: '/cookies' },
  { label: 'Términos', to: '/terminos' },
];

export default function LandingFooter() {
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
        © 2025 · Compete. Build. Conquer.<br />
        Proyecto TFG · Ciclo Formativo de Grado Superior
      </div>

      <div className="footer-right">
        {FOOTER_LINKS.map(({ label, href }) => (
          <a key={label} href={href}>{label}</a>
        ))}
        {LEGAL_LINKS.map(({ label, to }) => (
          <Link key={label} to={to}>{label}</Link>
        ))}
        <button type="button" onClick={openConsentManager}>
          Cookie preferences
        </button>
      </div>
    </footer>
  );
}
