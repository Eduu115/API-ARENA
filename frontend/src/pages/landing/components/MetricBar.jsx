export default function MetricBar({ name, pct, display, gradient, color, total }) {
  return (
    <div
      className="metric-bar-item bracket-hover"
      style={total ? {
        marginTop: '2px',
        background: 'rgba(0,217,255,0.04)',
        borderLeft: '2px solid var(--cyan)',
      } : undefined}
    >
      <span
        className="metric-name"
        style={total ? { color: 'var(--cyan)' } : undefined}
      >
        {name}
      </span>
      <div className="metric-track">
        <div
          className="metric-fill"
          style={{ width: `${pct}%`, background: gradient }}
        />
      </div>
      <span
        className="metric-pct"
        style={{
          color,
          fontSize: total ? '28px' : undefined,
        }}
      >
        {display}
      </span>
    </div>
  );
}
