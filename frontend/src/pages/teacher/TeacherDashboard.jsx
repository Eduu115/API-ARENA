import { Link } from "react-router-dom";
import TeacherLayout from "./TeacherLayout";
import { MOCK_CORRECTIONS, MOCK_TEACHER_CHALLENGES, MOCK_GROUPS } from "./teacher.mock";

export default function TeacherDashboard() {
  const pending = MOCK_CORRECTIONS.filter((c) => c.status !== "GRADED").length;
  const groups = MOCK_GROUPS.length;
  const challenges = MOCK_TEACHER_CHALLENGES.length;

  const kpis = [
    { icon: "◎", label: "Correcciones pendientes", value: String(pending), color: "var(--warn)", barWidth: "70%" },
    { icon: "◇", label: "Grupos", value: String(groups), color: "var(--cyan)", barWidth: "45%" },
    { icon: "⊕", label: "Challenges creados", value: String(challenges), color: "var(--purple)", barWidth: "55%" },
    { icon: "✓", label: "Publicados", value: String(MOCK_TEACHER_CHALLENGES.filter((c) => c.published).length), color: "var(--green)", barWidth: "40%" },
  ];

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 28 }}>
        <div>
          <div className="db-page-eyebrow">// Teacher Command Center</div>
          <h1 className="db-page-title">
            Panel<em>Profesor</em>
          </h1>
          <div className="db-page-sub">
            Acceso rápido a correcciones, grupos y creación de challenges.
          </div>
        </div>
        <div className="db-header-actions">
          <Link to="/teacher/corrections" className="db-btn db-btn-primary">
            Ir a correcciones
          </Link>
          <Link to="/teacher/challenges/new" className="db-btn">
            Crear challenge
          </Link>
        </div>
      </div>

      <div className="db-kpi-grid">
        {kpis.map((card) => (
          <div key={card.label} className="db-kpi-card" style={{ "--kpi-color": card.color }}>
            <div className="db-kpi-top">
              <span className="db-kpi-icon">{card.icon}</span>
            </div>
            <div className="db-kpi-val">{card.value}</div>
            <div className="db-kpi-label">{card.label}</div>
            <div className="db-kpi-bar" style={{ width: card.barWidth }} />
          </div>
        ))}
      </div>

      <div className="db-content-grid">
        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">
              <span className="db-live-dot" />
              Correcciones recientes
            </div>
            <Link to="/teacher/corrections" className="db-panel-action">
              Ver todo →
            </Link>
          </div>

          {MOCK_CORRECTIONS.slice(0, 6).map((c) => (
            <div key={c.id} className="db-activity-row">
              <div className="db-row-dot" style={{ background: "var(--warn)", boxShadow: "0 0 5px var(--warn)" }} />
              <div className="db-row-info">
                <div className="db-row-title">{c.challenge}</div>
                <div className="db-row-meta">
                  <span>@{c.student}</span>
                  <span style={{ color: "var(--dim)" }}>·</span>
                  <span>{c.status}</span>
                </div>
              </div>
              <div className="db-row-status" style={{ color: "var(--warn)" }}>
                {c.score == null ? "—" : `${c.score}`}
              </div>
            </div>
          ))}
        </div>

        <div className="db-right-stack">
          <div className="db-panel">
            <div className="db-panel-head">
              <div className="db-panel-title">Grupos</div>
              <Link to="/teacher/corrections" className="db-panel-action">
                Abrir →
              </Link>
            </div>
            <div style={{ padding: "12px 18px" }}>
              {MOCK_GROUPS.map((g) => (
                <div
                  key={g.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--dim)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  <span>{g.name}</span>
                  <span style={{ color: "var(--text)" }}>{g.students}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="db-panel">
            <div className="db-panel-head">
              <div className="db-panel-title">Challenges</div>
              <Link to="/teacher/challenges" className="db-panel-action">
                Gestionar →
              </Link>
            </div>
            <div style={{ padding: "12px 18px" }}>
              {MOCK_TEACHER_CHALLENGES.slice(0, 4).map((ch) => (
                <div
                  key={ch.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--dim)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  <span style={{ color: "var(--text)" }}>{ch.title}</span>
                  <span style={{ color: ch.published ? "var(--green)" : "var(--warn)" }}>
                    {ch.published ? "PUBLISHED" : "DRAFT"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

