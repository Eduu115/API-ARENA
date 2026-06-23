import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigateLocalized } from "../../routes/LocaleLayout";
import { useTranslation } from "react-i18next";
import TeacherLayout from "./TeacherLayout";
import * as groupsApi from "../../lib/groupsApi";
import * as submissionsApi from "../../lib/submissionsApi";
import SubmissionZipDownloadBlock from "../../components/teacher/SubmissionZipDownloadBlock";
import { usePageMeta } from "../../lib/usePageMeta";

export default function TeacherGroups() {
  const { t } = useTranslation("teacher");
  const navigate = useNavigateLocalized();

  usePageMeta({ title: t("groups.pageTitle"), path: "/teacher/groups" });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [submissionCountsLoading, setSubmissionCountsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [studentSubmissionsLoading, setStudentSubmissionsLoading] = useState(false);
  const [studentSubmissionsError, setStudentSubmissionsError] = useState(null);
  const [downloadingSubmissionId, setDownloadingSubmissionId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const [coSearchQ, setCoSearchQ] = useState("");
  const [coSearchResults, setCoSearchResults] = useState([]);
  const [coSearching, setCoSearching] = useState(false);
  const coDebounceRef = useRef(null);

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
    else {
      setDetail(null);
      setSelectedStudent(null);
      setStudentSubmissions([]);
      setSubmissionCounts({});
    }
  }, [selected, loadDetail]);

  useEffect(() => {
    const members = detail?.members || [];
    if (!members.length) {
      setSubmissionCounts({});
      return;
    }

    let cancelled = false;
    (async () => {
      setSubmissionCountsLoading(true);
      try {
        const ids = members.map((m) => m.userId).filter((id) => id != null);
        const counts = await submissionsApi.getTeacherStudentsSubmissionCounts(ids);
        if (!cancelled) {
          setSubmissionCounts(counts || {});
        }
      } catch {
        if (!cancelled) {
          setSubmissionCounts({});
        }
      } finally {
        if (!cancelled) {
          setSubmissionCountsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [detail]);

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

  useEffect(() => {
    if (coDebounceRef.current) clearTimeout(coDebounceRef.current);
    if (!coSearchQ || coSearchQ.trim().length < 2) {
      setCoSearchResults([]);
      return;
    }
    coDebounceRef.current = setTimeout(async () => {
      setCoSearching(true);
      try {
        const res = await groupsApi.searchTeachers(coSearchQ);
        setCoSearchResults(Array.isArray(res) ? res : []);
      } catch {
        setCoSearchResults([]);
      } finally {
        setCoSearching(false);
      }
    }, 350);
    return () => clearTimeout(coDebounceRef.current);
  }, [coSearchQ]);

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
      alert(err.message || t("groups.errorAddStudent"));
    }
  }

  async function handleRemove(userId) {
    if (!selected) return;
    try {
      const updated = await groupsApi.removeMember(selected, userId);
      setDetail(updated);
      setSelectedStudent((prev) => (prev?.userId === userId ? null : prev));
      setGroups((prev) => prev.map((g) => (g.id === selected ? { ...g, studentCount: updated.studentCount } : g)));
    } catch (err) {
      alert(err.message || t("groups.errorRemoveStudent"));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t("groups.confirmDelete"))) return;
    try {
      await groupsApi.deleteGroup(id);
      if (selected === id) { setSelected(null); setDetail(null); }
      await loadGroups();
    } catch (err) {
      alert(err.message || t("groups.errorDeleteGroup"));
    }
  }

  async function handleSetCoTeacher(userId) {
    if (!selected) return;
    try {
      const updated = await groupsApi.setCoTeacher(selected, userId);
      setDetail(updated);
      setCoSearchQ("");
      setCoSearchResults([]);
      await loadGroups();
    } catch (err) {
      alert(err.message || t("groups.errorUpdateCoTeacher"));
    }
  }

  async function handleRemoveCoTeacher() {
    if (!selected) return;
    try {
      const updated = await groupsApi.setCoTeacher(selected, null);
      setDetail(updated);
      await loadGroups();
    } catch (err) {
      alert(err.message || t("groups.errorRemoveCoTeacher"));
    }
  }

  async function handleViewStudentSubmissions(member) {
    setSelectedStudent(member);
    setStudentSubmissionsLoading(true);
    setStudentSubmissionsError(null);
    try {
      const data = await submissionsApi.getTeacherStudentSubmissions(member.userId);
      setStudentSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setStudentSubmissions([]);
      setStudentSubmissionsError(err?.message || t("groups.errorLoadSubmissions"));
    } finally {
      setStudentSubmissionsLoading(false);
    }
  }

  async function handleDownloadSubmission(submissionId) {
    setDownloadingSubmissionId(submissionId);
    try {
      const { blob, filename } = await submissionsApi.downloadSubmissionZip(submissionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.message || t("groups.errorDownload"));
    } finally {
      setDownloadingSubmissionId(null);
    }
  }

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="db-page-eyebrow">{t("groups.eyebrow")}</div>
          <h1 className="db-page-title">
            {t("groups.titleBefore")}<em>{t("groups.titleEm")}</em>
          </h1>
          <div className="db-page-sub">
            {t("groups.subtitle")}
          </div>
        </div>
        <div className="db-header-actions">
          <button type="button" className="db-btn db-btn-primary" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? t("groups.cancel") : t("groups.createGroup")}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="db-panel" style={{ marginBottom: 18 }}>
          <div className="db-panel-head">
            <div className="db-panel-title">{t("groups.newGroup")}</div>
          </div>
          <form onSubmit={handleCreate} style={{ padding: "14px 18px", display: "grid", gap: 10 }}>
            <input
              className="ch-search-input"
              placeholder={t("groups.groupNamePlaceholder")}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            <input
              className="ch-search-input"
              placeholder={t("groups.descriptionPlaceholder")}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            <button type="submit" className="db-btn db-btn-primary" disabled={creating} style={{ justifySelf: "start" }}>
              {creating ? t("groups.creating") : t("groups.createGroupSubmit")}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "280px 1fr" : "1fr", gap: 16, alignItems: "start" }}>
        {/* --- groups list --- */}
        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">{t("groups.groupsCount", { count: groups.length })}</div>
          </div>
          <div style={{ padding: "6px 0" }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                {t("groups.loading")}
              </div>
            ) : groups.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                {t("groups.empty")}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "var(--text)" }}>{g.name}</span>
                      {g.shared && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            color: "var(--purple)",
                            border: "1px solid rgba(189,102,255,0.45)",
                            borderRadius: 4,
                            padding: "1px 6px",
                          }}
                        >
                          {t("groups.shared")}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {t("groups.student", { count: g.studentCount })}
                      {g.currentUserIsPrimary === false && (
                        <span style={{ marginLeft: 8, color: "var(--dim)" }}>{t("groups.coTeaching")}</span>
                      )}
                    </div>
                  </div>
                  {g.currentUserIsPrimary !== false && (
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
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- detail panel --- */}
        {selected && (
          <div style={{ display: "grid", gap: 16 }}>
            {/* co-teacher */}
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">{t("groups.coTeacher")}</div>
              </div>
              <div style={{ padding: "12px 18px" }}>
                {detailLoading || !detail ? (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{t("groups.loading")}</div>
                ) : detail.currentUserIsPrimary === false ? (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    <div style={{ color: "var(--purple)", marginBottom: 6, fontSize: 11, letterSpacing: 1 }}>{t("groups.sharedGroup")}</div>
                    <div>
                      {t("groups.primaryTeacher")}{" "}
                      <span style={{ color: "var(--text)" }}>@{detail.primaryTeacherUsername || "—"}</span>
                    </div>
                    <div style={{ marginTop: 8, color: "var(--text)" }}>
                      {t("groups.coTeacherRole")}
                    </div>
                  </div>
                ) : detail.coTeacherId ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>
                      {t("groups.coTeacher")}: <span style={{ color: "var(--cyan)" }}>@{detail.coTeacherUsername}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoTeacher()}
                      style={{
                        background: "rgba(255,77,106,0.1)",
                        border: "1px solid rgba(255,77,106,0.35)",
                        color: "var(--red)",
                        borderRadius: 4,
                        padding: "4px 12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      {t("groups.removeCoTeacher")}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
                      {t("groups.inviteCoTeacher")}
                    </div>
                    <div className="ch-search-wrap" style={{ marginBottom: 8 }}>
                      <span className="ch-search-icon">/</span>
                      <input
                        type="text"
                        className="ch-search-input"
                        placeholder={t("groups.searchTeacherPlaceholder")}
                        value={coSearchQ}
                        onChange={(e) => setCoSearchQ(e.target.value)}
                      />
                    </div>
                    {coSearching && (
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", padding: "4px 0" }}>
                        {t("groups.searching")}
                      </div>
                    )}
                    {coSearchResults.length > 0 && (
                      <div style={{ maxHeight: 180, overflowY: "auto" }}>
                        {coSearchResults.map((u) => (
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
                            <button
                              type="button"
                              onClick={() => handleSetCoTeacher(u.id)}
                              style={{
                                background: "rgba(189,102,255,0.12)",
                                border: "1px solid rgba(189,102,255,0.35)",
                                color: "var(--purple)",
                                borderRadius: 4,
                                padding: "3px 10px",
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              {t("groups.addAsCoTeacher")}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* search */}
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">{t("groups.addStudent")}</div>
              </div>
              <div style={{ padding: "12px 18px" }}>
                <div className="ch-search-wrap" style={{ marginBottom: 8 }}>
                  <span className="ch-search-icon">/</span>
                  <input
                    type="text"
                    className="ch-search-input"
                    placeholder={t("groups.searchStudentPlaceholder")}
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                  />
                </div>
                {searching && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", padding: "4px 0" }}>
                    {t("groups.searching")}
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
                              {t("groups.alreadyMember")}
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
                              {t("groups.add")}
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
                  {t("groups.membersTitle", { name: detail?.name ?? t("groups.groupDefault"), count: detail?.members?.length ?? 0 })}
                </div>
              </div>
              <div style={{ padding: "6px 18px" }}>
                {detailLoading ? (
                  <div style={{ padding: 20, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                    {t("groups.loadingMembers")}
                  </div>
                ) : !detail?.members?.length ? (
                  <div style={{ padding: 20, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                    {t("groups.noMembers")}
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
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleViewStudentSubmissions(m)}
                          style={{
                            background: "rgba(0,217,255,0.08)",
                            border: "1px solid rgba(0,217,255,0.3)",
                            color: "var(--cyan)",
                            borderRadius: 4,
                            padding: "3px 10px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          {submissionCountsLoading ? "..." : t("groups.submissionsCount", { count: Number(submissionCounts[m.userId] ?? 0) })}
                        </button>
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
                          {t("groups.remove")}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedStudent && (
              <div className="db-panel">
                <div className="db-panel-head">
                  <div className="db-panel-title">
                    {t("groups.studentSubmissionsTitle", { username: selectedStudent.username, count: studentSubmissions.length })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSubmissions([]);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    {t("groups.close")}
                  </button>
                </div>
                <div style={{ padding: "10px 18px" }}>
                  {studentSubmissionsLoading ? (
                    <div style={{ padding: 16, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                      {t("groups.loadingSubmissions")}
                    </div>
                  ) : studentSubmissionsError ? (
                    <div style={{ padding: 16, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)" }}>
                      {studentSubmissionsError}
                    </div>
                  ) : studentSubmissions.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                      {t("groups.noStudentSubmissions")}
                    </div>
                  ) : (
                    studentSubmissions.map((sub) => {
                      const title = (sub.challengeTitle && String(sub.challengeTitle).trim()) || t("groups.challengeFallback", { id: sub.challengeId });
                      const score = Number(sub.totalScore) || 0;
                      return (
                        <div
                          key={sub.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 10,
                            padding: "10px 0",
                            borderBottom: "1px solid var(--dim)",
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "var(--text)" }}>
                              {title}
                            </div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                              {t("groups.submissionMeta", { id: sub.id, status: sub.status, score: score > 0 ? score.toFixed(1) : "—" })}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <button
                              type="button"
                              onClick={() => navigate(`/submissions/${sub.id}`)}
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
                              {t("groups.view")}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/submissions/${sub.id}/results`)}
                              style={{
                                background: "rgba(189,102,255,0.1)",
                                border: "1px solid rgba(189,102,255,0.3)",
                                color: "var(--purple)",
                                borderRadius: 4,
                                padding: "3px 10px",
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              {t("groups.results")}
                            </button>
                            <SubmissionZipDownloadBlock
                              zipDownloadExpiresAt={sub.zipDownloadExpiresAt}
                              downloading={downloadingSubmissionId === sub.id}
                              onDownload={() => handleDownloadSubmission(sub.id)}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
