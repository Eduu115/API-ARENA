import LocaleLink from "./LocaleLink";
import "../pages/landing/landing.css";

export default function Header() {
  return (
    <nav data-tutorial="landing-nav">
      <div className="nav-logo">
        <img className="nav-logo-hex" src="/icons/logo-hex-lg.svg" alt="API Arena logo" width="40" height="40" />
        <LocaleLink to="/" className="nav-logo-text"><span>API</span>Arena</LocaleLink>
      </div>

      <ul className="nav-links">
        <li><LocaleLink to="/challenges">Challenges</LocaleLink></li>
        <li><LocaleLink to="/leaderboard">Leaderboard</LocaleLink></li>
        <li><LocaleLink to="/docs">Docs</LocaleLink></li>
        <li><a href="#">About</a></li>
      </ul>

      <LocaleLink to="/register" className="nav-cta">Enter Arena</LocaleLink>
    </nav>
  );
}
