import { useMemo, useState } from "react";
import TeacherLayout from "./TeacherLayout";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"];
const CATEGORIES = ["REST API Design", "Authentication", "Security", "CRUD Operations", "Performance", "Database", "Microservices"];

export default function CreateChallenge() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    difficulty: "MEDIUM",
    timeLimitMinutes: 60,
    maxScore: 1000,
    description: "",
    published: false,
  });

  const isValid = useMemo(() => {
    return form.title.trim().length >= 4 && form.description.trim().length >= 20;
  }, [form.title, form.description]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    try {
      // TODO: integrar con challenge-service (endpoint docente)
      await new Promise((r) => setTimeout(r, 700));
      alert("Challenge guardado (mock).");
    } finally {
      setSaving(false);
    }
  }

  const on = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ch-page-eyebrow">// Builder</div>
          <h1 className="ch-page-title">
            Crear<em>Challenge</em>
          </h1>
        </div>
      </div>

      <div className="db-content-grid" style={{ gridTemplateColumns: "1fr 340px" }}>
        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">Datos</div>
            <div className="db-panel-action" style={{ cursor: "default" }}>
              // mock
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "18px" }}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                  Título
                </div>
                <input
                  className="ch-search-input"
                  style={{ width: "100%" }}
                  value={form.title}
                  onChange={on("title")}
                  placeholder="Ej: Rate limiter básico"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                    Categoría
                  </div>
                  <select className="ch-sort-select" value={form.category} onChange={on("category")}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                    Dificultad
                  </div>
                  <select className="ch-sort-select" value={form.difficulty} onChange={on("difficulty")}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                    Tiempo (min)
                  </div>
                  <input
                    className="ch-search-input"
                    style={{ width: "100%" }}
                    type="number"
                    min={5}
                    max={240}
                    value={form.timeLimitMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, timeLimitMinutes: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                    Max score
                  </div>
                  <input
                    className="ch-search-input"
                    style={{ width: "100%" }}
                    type="number"
                    min={100}
                    max={5000}
                    value={form.maxScore}
                    onChange={(e) => setForm((f) => ({ ...f, maxScore: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                  Descripción
                </div>
                <textarea
                  className="ch-search-input"
                  style={{ width: "100%", minHeight: 140, resize: "vertical", paddingTop: 10 }}
                  value={form.description}
                  onChange={on("description")}
                  placeholder="Define el objetivo, requisitos, endpoints esperados, etc."
                />
                <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  Mínimo 20 caracteres. {form.description.trim().length}/20
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: 12 }}>
                <input type="checkbox" checked={form.published} onChange={on("published")} />
                Publicar al guardar
              </label>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button type="submit" className="db-btn db-btn-primary" disabled={!isValid || saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  {isValid ? "// listo" : "// faltan datos"}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">Preview</div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: 20, color: "var(--white)" }}>
              {form.title.trim() || "Título del challenge"}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="ch-badge ch-badge-cat">{form.category}</span>
              <span className="ch-badge ch-badge-new">{form.difficulty}</span>
              <span className="ch-badge ch-badge-cat">{form.timeLimitMinutes}m</span>
              <span className="ch-badge ch-badge-cat">{form.maxScore} pts</span>
              <span className="ch-badge ch-badge-cat" style={{ color: form.published ? "var(--green)" : "var(--warn)" }}>
                {form.published ? "PUBLISHED" : "DRAFT"}
              </span>
            </div>
            <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>
              {form.description.trim() || "Aquí se verá la descripción…"}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

