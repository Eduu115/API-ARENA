import { Link } from 'react-router-dom';
import { LB_ENTRIES } from '../landing.data';

function LeaderboardRow({ rank, initials, name, score, time, tier, avatarGradient, scoreColor }) {
  const isMuted = !tier;
  return (
    <div className={`lb-row${tier ? ` ${tier}` : ''}`}>
      <span
        className="lb-rank"
        style={isMuted ? { color: 'var(--muted)' } : undefined}
      >
        {rank}
      </span>
      <div className="lb-user">
        <div className="lb-avatar" style={{ background: avatarGradient }}>
          {initials}
        </div>
        <span className="lb-username">{name}</span>
      </div>
      <span
        className="lb-score"
        style={{
          color: scoreColor ?? undefined,
          fontSize: isMuted ? '22px' : undefined,
        }}
      >
        {score}
      </span>
      <span className="lb-time">{time}</span>
    </div>
  );
}

export default function LeaderboardSection() {
  return (
    <section className="lb-section">
      <div className="lb-grid">

        <div>
          <div className="live-badge">
            <span className="live-dot" />
            Live Leaderboard
          </div>
          <div className="lb-table">
            <div className="lb-header-row">
              <span className="lb-head-cell">Rank</span>
              <span className="lb-head-cell">Player</span>
              <span className="lb-head-cell">Score</span>
              <span className="lb-head-cell" style={{ textAlign: 'right' }}>Time</span>
            </div>
            {LB_ENTRIES.map((entry) => (
              <LeaderboardRow key={entry.rank} {...entry} />
            ))}
          </div>
        </div>

        <div className="lb-right">
          <div className="section-label">Competition</div>
          <h2 className="section-title">
            Your code<br />vs the world.<br /><em>Real time.</em>
          </h2>
          <p className="lb-right-desc">
            The leaderboard updates through WebSocket. Every incoming submission
            and every position change appears instantly, no refresh needed.<br /><br />
            The ELO system ensures that climbing one spot in the top 10
            matters more than dominating the top 100.
          </p>
          <Link to="/leaderboard" className="btn-primary">
            View Global Leaderboard
          </Link>
        </div>

      </div>
    </section>
  );
}
