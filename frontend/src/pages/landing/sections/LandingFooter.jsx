import { FOOTER_LINKS } from '../landing.data';

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
        Proyecto TFG · Universidad
      </div>

      <div className="footer-right">
        {FOOTER_LINKS.map(({ label, href }) => (
          <a key={label} href={href}>{label}</a>
        ))}
      </div>
    </footer>
  );
}
