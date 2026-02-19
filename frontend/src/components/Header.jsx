import { Link } from "react-router-dom";
import "../pages/landing/landing.css";

export default function Header() {
  return (
    <nav>
      <div className="nav-logo">
        <svg className="nav-logo-hex" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="nc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#00D9FF'}} />
              <stop offset="100%" style={{stopColor:'#00FFA3'}} />
            </linearGradient>
            <filter id="ng">
              <feGaussianBlur stdDeviation="1.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#1A2040" stroke="url(#nc)" strokeWidth="1.2" />
          <g filter="url(#ng)">
            <path d="M11,14 L9,14 Q7,14 7,16 L7,20 Q7,22 5,22 Q7,22 7,24 L7,28 Q7,30 9,30 L11,30" fill="none" stroke="url(#nc)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M29,14 L31,14 Q33,14 33,16 L33,20 Q33,22 35,22 Q33,22 33,24 L33,28 Q33,30 31,30 L29,30" fill="none" stroke="url(#nc)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="17" y1="31" x2="23" y2="13" stroke="#B24BF3" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </svg>
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
