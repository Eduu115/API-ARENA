import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TeacherLayout from "./TeacherLayout";
import * as groupsApi from "../../lib/groupsApi";

export default function TeacherGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupsApi.getMyGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const loadDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const data = await groupsApi.getGroupById(id);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) loadDetail(selected);
    else setDetail(null);
  }, [selected, loadDetail]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQ || searchQ.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await groupsApi.searchStudents(searchQ);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQ]);

  const memberIds = useMemo(
    () => new Set((detail?.members || []).map((m) => m.userId)),
    [detail]
  );

  async function handleCreate(e) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await groupsApi.createGroup({ name: createName.trim(), description: createDesc.trim() || null });
      setCreateName("");
      setCreateDesc("");
      setShowCreate(false);
      await loadGroups();
    } finally {
      setCreating(false);
    }
  }

  async function handleAdd(userId) {
    if (!selected) return;
    try {
      const updated = await groupsApi.addMember(selected, userId);
      setDetail(updated);
      setGroups((prev) => prev.map((g) => (g.id === selected ? { ...g, studentCount: updated.studentCount } : g)));
    } catch (err) {
      alert(err.message || "Error al añadir alumno");
    }
  }

  async function handleRemove(userId) {
    if (!selected) return;
    try {
      const updated = await groupsApi.removeMember(selected, userId);
      setDetail(updated);
      setGroups((prev) => prev.map((g) => (g.id === selected ? { ...g, studentCount: updated.studentCount } : g)));
    } catch (err) {
      alert(err.message || "Error al eliminar alumno");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este grupo y quitar todos los alumnos?")) return;
    try {
      await groupsApi.deleteGroup(id);
      if (selected === id) { setSelected(null); setDetail(null); }
      await loadGroups();
    } catch (err) {
      alert(err.message || "Error al eliminar grupo");
    }
  }

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="db-page-eyebrow">// Group Manager</div>
          <h1 className="db-page-title">
            Mis<em>Grupos</em>
          </h1>
          <div className="db-page-sub">
            Crea grupos de alumnos y gestiona miembros.
          </div>
        </div>
        <div className="db-header-actions">
          <button type="button" className="db-btn db-btn-primary" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? "Cancelar" : "+ Crear grupo"}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="db-panel" style={{ marginBottom: 18 }}>
          <div className="db-panel-head">
            <div className="db-panel-title">Nuevo grupo</div>
          </div>
          <form onSubmit={handleCreate} style={{ padding: "14px 18px", display: "grid", gap: 10 }}>
            <input
              className="ch-search-input"
              placeholder="Nombre del grupo (ej: DAW 2ºA)"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            <input
              className="ch-search-input"
              placeholder="Descripción (opcional)"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            <button type="submit" className="db-btn db-btn-primary" disabled={creating} style={{ justifySelf: "start" }}>
              {creating ? "Creando..." : "Crear grupo"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "280px 1fr" : "1fr", gap: 16, alignItems: "start" }}>
        {/* --- groups list --- */}
        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">Grupos ({groups.length})</div>
          </div>
          <div style={{ padding: "6px 0" }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                Cargando...
              </div>
            ) : groups.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                No tienes grupos aún
              </div>
            ) : (
              groups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setSelected(selected === g.id ? null : g.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 18px",
                    cursor: "pointer",
                    borderLeft: selected === g.id ? "2px solid var(--cyan)" : "2px solid transparent",
                    background: selected === g.id ? "rgba(0,217,255,0.04)" : "transparent",
                    transition: "all .15s",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "var(--text)" }}>{g.name}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {g.studentCount} alumno{g.studentCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}
                    style={{
                      background: "none", border: "none", color: "var(--red)",
                      cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11,
                      opacity: 0.6,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- detail panel --- */}
        {selected && (
          <div style={{ display: "grid", gap: 16 }}>
            {/* search */}
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">Añadir alumno</div>
              </div>
              <div style={{ padding: "12px 18px" }}>
                <div className="ch-search-wrap" style={{ marginBottom: 8 }}>
                  <span className="ch-search-icon">/</span>
                  <input
                    type="text"
                    className="ch-search-input"
                    placeholder="Buscar por username o email..."
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                  />
                </div>
                {searching && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", padding: "4px 0" }}>
                    Buscando...
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {searchResults.map((u) => {
                      const already = memberIds.has(u.id);
                      return (
                        <div
                          key={u.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "7px 0",
                            borderBottom: "1px solid var(--dim)",
                          }}
                        >
                          <div>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>
                              @{u.username}
                            </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                              {u.email}
                            </span>
                          </div>
                          {already ? (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)" }}>
                              YA MIEMBRO
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAdd(u.id)}
                              style={{
                                background: "rgba(0,255,163,0.1)",
                                border: "1px solid rgba(0,255,163,0.3)",
                                color: "var(--green)",
                                borderRadius: 4,
                                padding: "3px 10px",
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              + Añadir
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* members */}
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">
                  {detail?.name ?? "Grupo"} — Miembros ({detail?.members?.length ?? 0})
                </div>
              </div>
              <div style={{ padding: "6px 18px" }}>
                {detailLoading ? (
                  <div style={{ padding: 20, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                    Cargando miembros...
                  </div>
                ) : !detail?.members?.length ? (
                  <div style={{ padding: 20, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                    Sin miembros todavía. Usa el buscador de arriba.
                  </div>
                ) : (
                  detail.members.map((m) => (
                    <div
                      key={m.userId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--dim)",
                      }}
                    >
                      <div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>
                          @{m.username}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                          {m.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(m.userId)}
                        style={{
                          background: "rgba(255,77,106,0.1)",
                          border: "1px solid rgba(255,77,106,0.3)",
                          color: "var(--red)",
                          borderRadius: 4,
                          padding: "3px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
