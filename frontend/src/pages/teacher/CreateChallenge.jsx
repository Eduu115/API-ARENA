import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TeacherLayout from "./TeacherLayout";
import * as challengesApi from "../../lib/challengesApi";
import { usePageMeta } from "../../lib/usePageMeta";

// EXTREME is intentionally excluded: it is reserved for admin/console-authored
// challenges (anti-cheat). The backend also rejects EXTREME from non-admin creators.
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"];

export default function CreateChallenge() {
  const { t } = useTranslation("teacher");

  usePageMeta({ title: t("createChallenge.pageTitle"), path: "/teacher/challenges/new" });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [jsonErrors, setJsonErrors] = useState({});
  const [advancedErrors, setAdvancedErrors] = useState({});
  const [form, setForm] = useState({
    title: "",
    categoryId: null,
    difficulty: "MEDIUM",
    timeLimitMinutes: 60,
    maxScore: 1000,
    description: "",
    requiredEndpoints: [{ method: "GET", path: "/health", description: "" }],
    requiredStatusCodes: [{ code: "200", for: "GET /health", description: "" }],
    requiredHeaders: [{ name: "Authorization", value: "Bearer <token>", required: true }],
    testSuite: [{ name: "basic", value: "" }],
    performanceRequirements: [{ name: "latency_p95_ms", value: "200" }],
    designCriteria: [{ name: "rest_conventions", value: "true" }],
    hints: [{ text: "" }],
    learningObjectives: [{ text: "" }],
    requiredEndpointsText: "{}",
    requiredStatusCodesText: "{}",
    requiredHeadersText: "{}",
    testSuiteText: "{}",
    performanceRequirementsText: "{}",
    designCriteriaText: "{}",
    hintsText: "{}",
    learningObjectivesText: "{}",
    solutionExplanation: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingCats(true);
      try {
        const cats = await challengesApi.getCategories();
        const list = Array.isArray(cats) ? cats : [];
        if (!cancelled) {
          setCategories(list);
          setForm((f) => ({ ...f, categoryId: f.categoryId ?? list?.[0]?.id ?? null }));
        }
      } catch (e) {
        if (!cancelled) setServerError(e?.message || t("createChallenge.errorLoadCategories"));
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const isValid = useMemo(() => {
    const hasJsonErrors = Object.values(jsonErrors || {}).some(Boolean);
    const hasAdvancedErrors = Object.values(advancedErrors || {}).some(Boolean);
    return (
      form.title.trim().length >= 4 &&
      form.description.trim().length >= 20 &&
      Number.isFinite(Number(form.categoryId)) &&
      !hasJsonErrors &&
      !hasAdvancedErrors
    );
  }, [form.title, form.description, form.categoryId, jsonErrors, advancedErrors]);

  const parseJsonOrThrow = (text) => {
    const trimmed = String(text ?? "").trim();
    if (!trimmed) return {};
    const parsed = JSON.parse(trimmed);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error(t("createChallenge.jsonMustBeObject"));
    }
    return parsed;
  };

  const onJsonField = (key) => (e) => {
    const value = e?.target?.value ?? "";
    setForm((f) => ({ ...f, [key]: value }));
    try {
      parseJsonOrThrow(value);
      setJsonErrors((prev) => ({ ...prev, [key]: null }));
    } catch (err) {
      setJsonErrors((prev) => ({ ...prev, [key]: err?.message || t("createChallenge.invalidJson") }));
    }
  };

  const buildObjFromPairs = (pairs, { keyProp = "name", valProp = "value" } = {}) => {
    const out = {};
    for (const row of pairs || []) {
      const k = String(row?.[keyProp] ?? "").trim();
      if (!k) continue;
      const v = row?.[valProp];
      out[k] = v;
    }
    return out;
  };

  const buildAdvancedPayload = () => {
    const endpoints = (form.requiredEndpoints || [])
      .map((e) => ({
        method: String(e?.method || "").trim().toUpperCase(),
        path: String(e?.path || "").trim(),
        description: String(e?.description || "").trim(),
      }))
      .filter((e) => e.method && e.path);

    const statusCodes = (form.requiredStatusCodes || [])
      .map((s) => ({
        code: String(s?.code || "").trim(),
        for: String(s?.for || "").trim(),
        description: String(s?.description || "").trim(),
      }))
      .filter((s) => s.code);

    const headers = (form.requiredHeaders || [])
      .map((h) => ({
        name: String(h?.name || "").trim(),
        value: String(h?.value ?? "").trim(),
        required: !!h?.required,
      }))
      .filter((h) => h.name);

    const hints = (form.hints || [])
      .map((h) => String(h?.text || "").trim())
      .filter(Boolean);

    const learningObjectives = (form.learningObjectives || [])
      .map((h) => String(h?.text || "").trim())
      .filter(Boolean);

    return {
      requiredEndpoints: { items: endpoints },
      requiredStatusCodes: { items: statusCodes },
      requiredHeaders: { items: headers },
      testSuite: buildObjFromPairs(form.testSuite),
      performanceRequirements: buildObjFromPairs(form.performanceRequirements),
      designCriteria: buildObjFromPairs(form.designCriteria),
      hints: { items: hints },
      learningObjectives: { items: learningObjectives },
      solutionExplanation: String(form.solutionExplanation ?? ""),
    };
  };

  async function doCreate({ publish }) {
    setServerError(null);
    const advanced = buildAdvancedPayload();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      categoryId: Number(form.categoryId),
      maxScore: Number(form.maxScore),
      timeLimitMinutes: Number(form.timeLimitMinutes),
      requiredEndpoints: advanced.requiredEndpoints,
      requiredStatusCodes: advanced.requiredStatusCodes,
      requiredHeaders: advanced.requiredHeaders,
      testSuite: advanced.testSuite,
      performanceRequirements: advanced.performanceRequirements,
      designCriteria: advanced.designCriteria,
      hints: advanced.hints,
      solutionExplanation: advanced.solutionExplanation,
      learningObjectives: advanced.learningObjectives,
    };

    const created = await challengesApi.createChallenge(payload);
    const id = created?.id ?? null;
    if (id) setSavedId(id);

    if (!publish) {
      // Draft = inactive
      if (id) await challengesApi.updateChallenge(id, { isActive: false });
      return { id, mode: "draft" };
    }

    // Publish = active
    if (id) await challengesApi.updateChallenge(id, { isActive: true });
    return { id, mode: "published" };
  }

  async function handleSaveDraft(e) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    try {
      await doCreate({ publish: false });
    } catch (e2) {
      setServerError(e2?.message || t("createChallenge.errorSaveDraft"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(e) {
    e.preventDefault();
    if (!isValid) return;
    setPublishing(true);
    try {
      await doCreate({ publish: true });
    } catch (e2) {
      setServerError(e2?.message || t("createChallenge.errorPublish"));
    } finally {
      setPublishing(false);
    }
  }

  const on = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setListItem = (key, idx, patch) => {
    setForm((f) => {
      const next = Array.isArray(f[key]) ? [...f[key]] : [];
      next[idx] = { ...(next[idx] || {}), ...patch };
      return { ...f, [key]: next };
    });
  };
  const addListItem = (key, item) => {
    setForm((f) => ({ ...f, [key]: [...(Array.isArray(f[key]) ? f[key] : []), item] }));
  };
  const removeListItem = (key, idx) => {
    setForm((f) => {
      const arr = Array.isArray(f[key]) ? [...f[key]] : [];
      arr.splice(idx, 1);
      return { ...f, [key]: arr.length ? arr : [itemDefaults(key)] };
    });
  };
  const itemDefaults = (key) => {
    switch (key) {
      case "requiredEndpoints": return { method: "GET", path: "", description: "" };
      case "requiredStatusCodes": return { code: "", for: "", description: "" };
      case "requiredHeaders": return { name: "", value: "", required: true };
      case "testSuite":
      case "performanceRequirements":
      case "designCriteria": return { name: "", value: "" };
      case "hints":
      case "learningObjectives": return { text: "" };
      default: return {};
    }
  };

  const validateAdvanced = () => {
    const errors = {};
    for (const e of form.requiredEndpoints || []) {
      const hasAny = String(e?.method || "").trim() || String(e?.path || "").trim() || String(e?.description || "").trim();
      if (hasAny && !String(e?.path || "").trim()) errors.requiredEndpoints = t("createChallenge.endpointPathMissing");
    }
    setAdvancedErrors(errors);
  };

  useEffect(() => {
    validateAdvanced();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.requiredEndpoints, form.requiredStatusCodes, form.requiredHeaders, form.testSuite, form.performanceRequirements, form.designCriteria, form.hints, form.learningObjectives]);

  return (
    <TeacherLayout>
      <div className="ch-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ch-page-eyebrow">{t("createChallenge.eyebrow")}</div>
          <h1 className="ch-page-title">
            {t("createChallenge.titleBefore")}<em>{t("createChallenge.titleEm")}</em>
          </h1>
        </div>
      </div>

      <div className="db-content-grid" style={{ gridTemplateColumns: "1fr 340px" }}>
        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">{t("createChallenge.details")}</div>
            <div className="db-panel-action" style={{ cursor: "default" }}>
              {savedId ? `#${savedId}` : t("createChallenge.draftPublish")}
            </div>
          </div>

          <form style={{ padding: "18px" }}>
            <div style={{ display: "grid", gap: 14 }}>
              {serverError && (
                <div style={{ border: "1px solid rgba(255,77,106,0.35)", background: "rgba(255,77,106,0.08)", padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)" }}>
                  {serverError}
                </div>
              )}
              <div>
                <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                  {t("createChallenge.title")}
                </div>
                <input
                  className="ch-search-input"
                  style={{ width: "100%" }}
                  value={form.title}
                  onChange={on("title")}
                  placeholder={t("createChallenge.titlePlaceholder")}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                    {t("createChallenge.category")}
                  </div>
                  <select
                    className="ch-sort-select"
                    value={form.categoryId ?? ""}
                    onChange={on("categoryId")}
                    disabled={loadingCats}
                  >
                    {loadingCats ? (
                      <option value="">{t("createChallenge.loadingCategories")}</option>
                    ) : categories.length === 0 ? (
                      <option value="">{t("createChallenge.noCategories")}</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {String(c.name || "").toUpperCase()}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                    {t("createChallenge.difficulty")}
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
                    {t("createChallenge.timeMin")}
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
                    {t("createChallenge.maxScore")}
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
                  {t("createChallenge.description")}
                </div>
                <textarea
                  className="ch-search-input"
                  style={{ width: "100%", minHeight: 140, resize: "vertical", paddingTop: 10 }}
                  value={form.description}
                  onChange={on("description")}
                  placeholder={t("createChallenge.descriptionPlaceholder")}
                />
                <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  {t("createChallenge.descriptionMin", { count: form.description.trim().length })}
                </div>
              </div>

              <div className="db-panel" style={{ background: "transparent", border: "1px solid var(--dim)" }}>
                <div
                  className="db-panel-head"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowAdvanced((s) => !s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setShowAdvanced((s) => !s);
                  }}
                >
                  <div className="db-panel-title">{t("createChallenge.advanced")}</div>
                  <div className="db-panel-action" style={{ cursor: "pointer" }}>
                    {showAdvanced ? t("createChallenge.hide") : t("createChallenge.show")} →
                  </div>
                </div>

                {showAdvanced && (
                  <div style={{ padding: 14, display: "grid", gap: 14 }}>
                    <div>
                      <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                        requiredEndpoints
                      </div>
                      {advancedErrors.requiredEndpoints && (
                        <div style={{ margin: "6px 0 8px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)" }}>
                          {advancedErrors.requiredEndpoints}
                        </div>
                      )}
                      {(form.requiredEndpoints || []).map((row, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px", gap: 8, marginBottom: 8 }}>
                          <select
                            className="ch-sort-select"
                            value={row.method}
                            onChange={(e) => setListItem("requiredEndpoints", idx, { method: e.target.value })}
                          >
                            {["GET","POST","PUT","PATCH","DELETE"].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input
                            className="ch-search-input"
                            value={row.path}
                            onChange={(e) => setListItem("requiredEndpoints", idx, { path: e.target.value })}
                            placeholder="/users/{id}"
                          />
                          <button type="button" className="db-btn" onClick={() => removeListItem("requiredEndpoints", idx)}>
                            {t("createChallenge.remove")}
                          </button>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <input
                              className="ch-search-input"
                              value={row.description}
                              onChange={(e) => setListItem("requiredEndpoints", idx, { description: e.target.value })}
                              placeholder={t("createChallenge.descriptionOptional")}
                            />
                          </div>
                        </div>
                      ))}
                      <button type="button" className="db-btn" onClick={() => addListItem("requiredEndpoints", itemDefaults("requiredEndpoints"))}>
                        {t("createChallenge.addEndpoint")}
                      </button>
                    </div>

                    <div>
                      <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                        requiredStatusCodes
                      </div>
                      {(form.requiredStatusCodes || []).map((row, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "110px 1fr 110px", gap: 8, marginBottom: 8 }}>
                          <input
                            className="ch-search-input"
                            value={row.code}
                            onChange={(e) => setListItem("requiredStatusCodes", idx, { code: e.target.value })}
                            placeholder="200"
                          />
                          <input
                            className="ch-search-input"
                            value={row.for}
                            onChange={(e) => setListItem("requiredStatusCodes", idx, { for: e.target.value })}
                            placeholder="GET /users"
                          />
                          <button type="button" className="db-btn" onClick={() => removeListItem("requiredStatusCodes", idx)}>
                            {t("createChallenge.remove")}
                          </button>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <input
                              className="ch-search-input"
                              value={row.description}
                              onChange={(e) => setListItem("requiredStatusCodes", idx, { description: e.target.value })}
                              placeholder={t("createChallenge.descriptionOptional")}
                            />
                          </div>
                        </div>
                      ))}
                      <button type="button" className="db-btn" onClick={() => addListItem("requiredStatusCodes", itemDefaults("requiredStatusCodes"))}>
                        {t("createChallenge.addStatusCode")}
                      </button>
                    </div>

                    <div>
                      <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                        requiredHeaders
                      </div>
                      {(form.requiredHeaders || []).map((row, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 110px", gap: 8, marginBottom: 8 }}>
                          <input
                            className="ch-search-input"
                            value={row.name}
                            onChange={(e) => setListItem("requiredHeaders", idx, { name: e.target.value })}
                            placeholder="Authorization"
                          />
                          <input
                            className="ch-search-input"
                            value={row.value}
                            onChange={(e) => setListItem("requiredHeaders", idx, { value: e.target.value })}
                            placeholder="Bearer <token>"
                          />
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
                            <input
                              type="checkbox"
                              checked={!!row.required}
                              onChange={(e) => setListItem("requiredHeaders", idx, { required: e.target.checked })}
                            />
                            {t("createChallenge.required")}
                          </label>
                          <button type="button" className="db-btn" onClick={() => removeListItem("requiredHeaders", idx)}>
                            {t("createChallenge.remove")}
                          </button>
                        </div>
                      ))}
                      <button type="button" className="db-btn" onClick={() => addListItem("requiredHeaders", itemDefaults("requiredHeaders"))}>
                        {t("createChallenge.addHeader")}
                      </button>
                    </div>

                    {[
                      { key: "testSuite", label: "testSuite" },
                      { key: "performanceRequirements", label: "performanceRequirements" },
                      { key: "designCriteria", label: "designCriteria" },
                    ].map((block) => (
                      <div key={block.key}>
                        <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                          {block.label}
                        </div>
                        {(form[block.key] || []).map((row, idx) => (
                          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px", gap: 8, marginBottom: 8 }}>
                            <input
                              className="ch-search-input"
                              value={row.name}
                              onChange={(e) => setListItem(block.key, idx, { name: e.target.value })}
                              placeholder={t("createChallenge.keyPlaceholder")}
                            />
                            <input
                              className="ch-search-input"
                              value={row.value}
                              onChange={(e) => setListItem(block.key, idx, { value: e.target.value })}
                              placeholder={t("createChallenge.valuePlaceholder")}
                            />
                            <button type="button" className="db-btn" onClick={() => removeListItem(block.key, idx)}>
                              {t("createChallenge.remove")}
                            </button>
                          </div>
                        ))}
                        <button type="button" className="db-btn" onClick={() => addListItem(block.key, itemDefaults(block.key))}>
                          {t("createChallenge.addField")}
                        </button>
                      </div>
                    ))}

                    <div>
                      <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                        hints
                      </div>
                      {(form.hints || []).map((row, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, marginBottom: 8 }}>
                          <input
                            className="ch-search-input"
                            value={row.text}
                            onChange={(e) => setListItem("hints", idx, { text: e.target.value })}
                            placeholder={t("createChallenge.hintPlaceholder")}
                          />
                          <button type="button" className="db-btn" onClick={() => removeListItem("hints", idx)}>
                            {t("createChallenge.remove")}
                          </button>
                        </div>
                      ))}
                      <button type="button" className="db-btn" onClick={() => addListItem("hints", itemDefaults("hints"))}>
                        {t("createChallenge.addHint")}
                      </button>
                    </div>

                    <div>
                      <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                        learningObjectives
                      </div>
                      {(form.learningObjectives || []).map((row, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, marginBottom: 8 }}>
                          <input
                            className="ch-search-input"
                            value={row.text}
                            onChange={(e) => setListItem("learningObjectives", idx, { text: e.target.value })}
                            placeholder={t("createChallenge.objectivePlaceholder")}
                          />
                          <button type="button" className="db-btn" onClick={() => removeListItem("learningObjectives", idx)}>
                            {t("createChallenge.remove")}
                          </button>
                        </div>
                      ))}
                      <button type="button" className="db-btn" onClick={() => addListItem("learningObjectives", itemDefaults("learningObjectives"))}>
                        {t("createChallenge.addObjective")}
                      </button>
                    </div>

                    <div>
                      <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                        solutionExplanation
                      </div>
                      <textarea
                        className="ch-search-input"
                        style={{ width: "100%", minHeight: 90, resize: "vertical", paddingTop: 10 }}
                        value={form.solutionExplanation}
                        onChange={on("solutionExplanation")}
                        placeholder={t("createChallenge.solutionPlaceholder")}
                      />
                    </div>

                    <div className="db-panel" style={{ background: "transparent", border: "1px solid var(--dim)" }}>
                      <div
                        className="db-panel-head"
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowRawJson((s) => !s)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setShowRawJson((s) => !s);
                        }}
                      >
                        <div className="db-panel-title">{t("createChallenge.jsonOptional")}</div>
                        <div className="db-panel-action" style={{ cursor: "pointer" }}>
                          {showRawJson ? t("createChallenge.hide") : t("createChallenge.show")} →
                        </div>
                      </div>

                      {showRawJson && (
                        <div style={{ padding: 14, display: "grid", gap: 14 }}>
                          {[
                            { key: "requiredEndpointsText", label: "requiredEndpoints" },
                            { key: "requiredStatusCodesText", label: "requiredStatusCodes" },
                            { key: "requiredHeadersText", label: "requiredHeaders" },
                            { key: "testSuiteText", label: "testSuite" },
                            { key: "performanceRequirementsText", label: "performanceRequirements" },
                            { key: "designCriteriaText", label: "designCriteria" },
                            { key: "hintsText", label: "hints" },
                            { key: "learningObjectivesText", label: "learningObjectives" },
                          ].map((f) => (
                            <div key={f.key}>
                              <div className="ch-sidebar-label" style={{ paddingTop: 0 }}>
                                {f.label}
                              </div>
                              <textarea
                                className="ch-search-input"
                                style={{
                                  width: "100%",
                                  minHeight: 90,
                                  resize: "vertical",
                                  paddingTop: 10,
                                  borderColor: jsonErrors[f.key] ? "rgba(255,77,106,0.55)" : undefined,
                                }}
                                value={form[f.key]}
                                onChange={onJsonField(f.key)}
                                placeholder="{}"
                              />
                              {jsonErrors[f.key] && (
                                <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)" }}>
                                  {jsonErrors[f.key]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  className="db-btn"
                  disabled={!isValid || saving || publishing}
                  onClick={handleSaveDraft}
                >
                  {saving ? t("createChallenge.saving") : t("createChallenge.saveDraft")}
                </button>
                <button
                  type="button"
                  className="db-btn db-btn-primary"
                  disabled={!isValid || saving || publishing}
                  onClick={handlePublish}
                >
                  {publishing ? t("createChallenge.publishing") : t("createChallenge.publish")}
                </button>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  {isValid ? t("createChallenge.ready") : t("createChallenge.missingData")}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="db-panel">
          <div className="db-panel-head">
            <div className="db-panel-title">{t("createChallenge.preview")}</div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: 20, color: "var(--white)" }}>
              {form.title.trim() || t("createChallenge.previewTitle")}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="ch-badge ch-badge-cat">
                {(categories.find((c) => String(c.id) === String(form.categoryId))?.name) || "—"}
              </span>
              <span className="ch-badge ch-badge-new">{form.difficulty}</span>
              <span className="ch-badge ch-badge-cat">{form.timeLimitMinutes}m</span>
              <span className="ch-badge ch-badge-cat">{form.maxScore} {t("createChallenge.pts")}</span>
              <span className="ch-badge ch-badge-cat" style={{ color: savedId ? "var(--green)" : "var(--warn)" }}>
              {savedId ? t("createChallenge.saved") : t("createChallenge.notSaved")}
              </span>
            </div>
            <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>
              {form.description.trim() || t("createChallenge.previewDescription")}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

