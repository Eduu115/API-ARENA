import { Link } from "react-router-dom";
import "../pages/landing/landing.css";

export default function Header() {
  return (
    <nav>
      <div className="nav-logo">
        <img className="nav-logo-hex" src="/icons/logo-hex-lg.svg" alt="API Arena logo" width="40" height="40" />
        <Link to="/" className="nav-logo-text"><span>API</span>Arena</Link>
      </div>

      <ul className="nav-links">
        <li><Link to="/challenges">Challenges</Link></li>
        <li><Link to="/leaderboard">Leaderboard</Link></li>
        <li><a href="#">Docs</a></li>
        <li><a href="#">About</a></li>
      </ul>

      <Link to="/register" className="nav-cta">Enter Arena</Link>
    </nav>
  );
}
