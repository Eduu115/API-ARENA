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
          <div className="section-label">Competencia</div>
          <h2 className="section-title">
            Tu código<br />vs el mundo.<br /><em>Real time.</em>
          </h2>
          <p className="lb-right-desc">
            El leaderboard se actualiza vía WebSocket. Cada submission que
            entra, cada posición que cambia — lo ves en el momento. Sin
            recargar.<br /><br />
            El sistema ELO asegura que subir una posición en el top 10
            valga más que dominar el top 100.
          </p>
          <Link to="/leaderboard" className="btn-primary">
            Ver Leaderboard Global
          </Link>
        </div>

      </div>
    </section>
  );
}
