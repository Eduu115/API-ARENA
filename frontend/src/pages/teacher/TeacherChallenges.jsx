import { Link } from "react-router-dom";
import TeacherLayout from "./TeacherLayout";
import { MOCK_TEACHER_CHALLENGES, formatTeacherDate } from "./teacher.mock";

export default function TeacherChallenges() {
  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ch-page-eyebrow">// Gestión</div>
          <h1 className="ch-page-title">
            Mis<em>Challenges</em>
          </h1>
        </div>
        <div className="ch-page-controls">
          <Link to="/teacher/challenges/new" className="db-btn db-btn-primary">
            Crear challenge
          </Link>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div className="db-panel-title">Listado</div>
          <Link to="/teacher/challenges/new" className="db-panel-action">
            Nuevo →
          </Link>
        </div>

        <div className="sub-table" style={{ border: "none" }}>
          <div className="sub-table-head">
            <div className="sub-th">Título</div>
            <div className="sub-th">Categoría</div>
            <div className="sub-th">Dificultad</div>
            <div className="sub-th sub-th-right">Estado</div>
            <div className="sub-th sub-th-right">Creado</div>
          </div>

          {MOCK_TEACHER_CHALLENGES.map((c) => (
            <div key={c.id} className="sub-row">
              <div style={{ minWidth: 0 }}>
                <div className="sub-row-challenge-title">{c.title}</div>
                <div className="sub-row-challenge-meta">
                  <span style={{ color: "var(--muted)" }}>id</span>
                  <span style={{ color: "var(--dim)" }}>·</span>
                  <span>{c.id}</span>
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{c.category}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>{c.difficulty}</div>
              <div className="sub-row-time" style={{ color: c.published ? "var(--green)" : "var(--warn)" }}>
                {c.published ? "PUBLISHED" : "DRAFT"}
              </div>
              <div className="sub-row-time">{formatTeacherDate(c.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </TeacherLayout>
  );
}

