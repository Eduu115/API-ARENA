import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  archivePost,
  createPost,
  getAdminPost,
  importMarkdown,
  publishPost,
  retranslatePost,
  updatePost,
} from "../../lib/contentApi";
import { safeUrl, toHtml } from "../../lib/markdownSafe";

const TOOLS = [
  { id: "bold", label: "B", wrap: ["**", "**"] },
  { id: "italic", label: "I", wrap: ["*", "*"] },
  { id: "h2", label: "H2", prefix: "## " },
  { id: "ul", label: "List", prefix: "- " },
  { id: "ol", label: "1.", prefix: "1. " },
  { id: "quote", label: "Quote", prefix: "> " },
  { id: "code", label: "Code", wrap: ["`", "`"] },
  { id: "fence", label: "```", block: "```\ncode\n```" },
  { id: "table", label: "Table", block: "| A | B |\n| --- | --- |\n| 1 | 2 |\n" },
];

function applyEdit(value, start, end, tool, extra) {
  const selected = value.slice(start, end);
  if (tool.wrap) {
    const inner = selected || "text";
    const next = value.slice(0, start) + tool.wrap[0] + inner + tool.wrap[1] + value.slice(end);
    return { next, cursor: start + tool.wrap[0].length + inner.length };
  }
  if (tool.prefix) {
    const line = selected || "item";
    const next = value.slice(0, start) + tool.prefix + line + value.slice(end);
    return { next, cursor: start + tool.prefix.length + line.length };
  }
  const block = extra || tool.block || "";
  const next = value.slice(0, start) + block + value.slice(end);
  return { next, cursor: start + block.length };
}

function emptyForm() {
  return {
    type: "NEWS",
    slug: "",
    sourceLocale: "en",
    versionLabel: "",
    coverImageUrl: "",
    title: "",
    excerpt: "",
    bodyMd: "",
    tags: "",
    otherTitle: "",
    otherExcerpt: "",
    otherBody: "",
  };
}

export default function AdminContentEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const bodyRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("DRAFT");
  const [otherDirty, setOtherDirty] = useState(false);
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    getAdminPost(id)
      .then((post) => {
        if (cancelled) return;
        const source = (post.translations || []).find((row) => row.locale === post.sourceLocale);
        const otherLocale = post.sourceLocale === "en" ? "es" : "en";
        const other = (post.translations || []).find((row) => row.locale === otherLocale);
        setStatus(post.status);
        setForm({
          type: post.type,
          slug: post.slug,
          sourceLocale: post.sourceLocale,
          versionLabel: post.versionLabel || "",
          coverImageUrl: post.coverImageUrl || "",
          title: source?.title || "",
          excerpt: source?.excerpt || "",
          bodyMd: source?.bodyMd || "",
          tags: (post.tags || []).join(", "),
          otherTitle: other?.title || "",
          otherExcerpt: other?.excerpt || "",
          otherBody: other?.bodyMd || "",
        });
        setOtherDirty(false);
      })
      .catch((e) => { if (!cancelled) setError(e?.message || "Could not load the post"); });
    return () => { cancelled = true; };
  }, [id, isNew]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function payload() {
    const otherLocale = form.sourceLocale === "en" ? "es" : "en";
    return {
      type: form.type,
      slug: form.slug || null,
      sourceLocale: form.sourceLocale,
      versionLabel: form.versionLabel || null,
      coverImageUrl: form.coverImageUrl || null,
      title: form.title,
      excerpt: form.excerpt,
      bodyMd: form.bodyMd,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      other: otherDirty ? {
        locale: otherLocale,
        title: form.otherTitle,
        excerpt: form.otherExcerpt,
        bodyMd: form.otherBody,
      } : null,
    };
  }

  function note(result) {
    setWarning(result?.translationWarning === "TRANSLATION_UNAVAILABLE"
      ? "DeepL did not return a translation. The text you wrote is saved. The public site will use the available language."
      : null);
    return result;
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const result = isNew ? await createPost(payload()) : await updatePost(id, payload());
      note(result);
      if (isNew) navigate(`/admin/content/${result.id}`, { replace: true });
      else setStatus(result.status);
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function act(fn) {
    if (isNew) return;
    setBusy(true);
    setError(null);
    try {
      note(await fn(id));
      const fresh = await getAdminPost(id);
      setStatus(fresh.status);
      const otherLocale = fresh.sourceLocale === "en" ? "es" : "en";
      const other = (fresh.translations || []).find((row) => row.locale === otherLocale);
      setForm((current) => ({
        ...current,
        otherTitle: other?.title || "",
        otherExcerpt: other?.excerpt || "",
        otherBody: other?.bodyMd || "",
      }));
      setOtherDirty(false);
    } catch (e) {
      setError(e?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function insert(tool) {
    const area = bodyRef.current;
    if (!area) return;
    let extra;
    if (tool.id === "link" || tool.id === "image") {
      const url = window.prompt(tool.id === "image" ? "Image URL" : "Link URL", "https://");
      if (!url) return;
      if (!safeUrl(url)) {
        setError("Only http(s) or site paths are allowed.");
        return;
      }
      const label = area.value.slice(area.selectionStart, area.selectionEnd) || (tool.id === "image" ? "image" : "link");
      extra = tool.id === "image" ? `![${label}](${url})` : `[${label}](${url})`;
    }
    const { next, cursor } = applyEdit(form.bodyMd, area.selectionStart, area.selectionEnd, tool, extra);
    setField("bodyMd", next);
    requestAnimationFrame(() => {
      area.focus();
      area.selectionStart = cursor;
      area.selectionEnd = cursor;
    });
  }

  async function onImport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const imported = await importMarkdown(await file.text());
      setForm((current) => ({
        ...current,
        title: imported.title || current.title,
        versionLabel: imported.versionLabel || current.versionLabel,
        tags: (imported.tags || []).join(", "),
        bodyMd: imported.bodyMd || "",
      }));
    } catch (e) {
      setError(e?.message || "Import failed");
    }
  }

  const otherLocale = form.sourceLocale === "en" ? "es" : "en";

  return (
    <div className="admin-content-editor">
      <div className="admin-eyebrow">// Content</div>
      <h1 className="admin-h1">{isNew ? "New post" : "Edit post"}</h1>
      <p><Link to="/admin/content">Back to list</Link> · {status}</p>
      {error && <p role="alert">{error}</p>}
      {warning && <p role="status">{warning}</p>}
      <div className="admin-content-grid">
        <label>Type
          <select className="admin-input" value={form.type} onChange={(e) => setField("type", e.target.value)}>
            <option value="NEWS">News</option>
            <option value="CHANGELOG">Changelog</option>
          </select>
        </label>
        <label>Source language
          <select className="admin-input" value={form.sourceLocale} onChange={(e) => setField("sourceLocale", e.target.value)}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </label>
        <label>Title
          <input className="admin-input" value={form.title} onChange={(e) => setField("title", e.target.value)} />
        </label>
        <label>Slug
          <input className="admin-input" value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="Generated from the title" />
        </label>
        <label>Excerpt
          <input className="admin-input" value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} />
        </label>
        <label>Version
          <input className="admin-input" value={form.versionLabel} onChange={(e) => setField("versionLabel", e.target.value)} />
        </label>
        <label>Cover image URL
          <input className="admin-input" value={form.coverImageUrl} onChange={(e) => setField("coverImageUrl", e.target.value)} />
        </label>
        <label>Tags
          <input className="admin-input" value={form.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="release, api" />
        </label>
      </div>
      <div className="admin-md-toolbar" role="toolbar" aria-label="Markdown">
        {TOOLS.map((tool) => (
          <button key={tool.id} type="button" className="admin-btn admin-btn--sm" onClick={() => insert(tool)}>{tool.label}</button>
        ))}
        <button type="button" className="admin-btn admin-btn--sm" onClick={() => insert({ id: "link" })}>Link</button>
        <button type="button" className="admin-btn admin-btn--sm" onClick={() => insert({ id: "image" })}>Image</button>
        <label className="admin-btn admin-btn--sm">
          Import .md
          <input type="file" accept=".md,text/markdown,text/plain" hidden onChange={onImport} />
        </label>
      </div>
      <div className="admin-md-split">
        <textarea
          ref={bodyRef}
          className="admin-input admin-md-input"
          value={form.bodyMd}
          onChange={(e) => setField("bodyMd", e.target.value)}
          aria-label="Markdown body"
          rows={18}
        />
        <div className="content-md admin-md-preview" dangerouslySetInnerHTML={{ __html: toHtml(form.bodyMd) }} />
      </div>
      <h2 className="admin-h2">Translation ({otherLocale})</h2>
      <p>Leave this untouched to generate it on save. Edit it to keep your wording. Re-translate replaces it.</p>
      <label>Title
        <input className="admin-input" value={form.otherTitle} onChange={(e) => { setOtherDirty(true); setField("otherTitle", e.target.value); }} />
      </label>
      <label>Excerpt
        <input className="admin-input" value={form.otherExcerpt} onChange={(e) => { setOtherDirty(true); setField("otherExcerpt", e.target.value); }} />
      </label>
      <label>Body
        <textarea className="admin-input" rows={8} value={form.otherBody} onChange={(e) => { setOtherDirty(true); setField("otherBody", e.target.value); }} />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <button type="button" className="admin-btn admin-btn--primary" disabled={busy} onClick={save}>Save</button>
        <button type="button" className="admin-btn" disabled={busy || isNew} onClick={() => act(publishPost)}>Publish</button>
        <button type="button" className="admin-btn" disabled={busy || isNew} onClick={() => act(archivePost)}>Archive</button>
        <button type="button" className="admin-btn admin-btn--ghost" disabled={busy || isNew} onClick={() => act(retranslatePost)}>Re-translate</button>
      </div>
    </div>
  );
}
