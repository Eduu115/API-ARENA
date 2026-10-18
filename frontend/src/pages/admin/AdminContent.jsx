import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminPosts } from "../../lib/contentApi";

export default function AdminContent() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listAdminPosts({ type, status, page })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Could not load content"); });
    return () => { cancelled = true; };
  }, [type, status, page]);

  const items = data?.items || [];
  return (
    <>
      <div className="admin-eyebrow">// Content</div>
      <h1 className="admin-h1">News & changelog</h1>
      <div className="admin-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select className="admin-input admin-input--sm" value={type} onChange={(e) => { setPage(0); setType(e.target.value); }} aria-label="Type">
          <option value="">All types</option>
          <option value="NEWS">News</option>
          <option value="CHANGELOG">Changelog</option>
        </select>
        <select className="admin-input admin-input--sm" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }} aria-label="Status">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Link className="admin-btn admin-btn--primary" to="/admin/content/new">New post</Link>
      </div>
      {error && <p>{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><Link to={`/admin/content/${item.id}`}>{item.title || item.slug}</Link></td>
                <td>{item.type}</td>
                <td>{item.status}</td>
                <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ""}</td>
              </tr>
            ))}
            {data && items.length === 0 && (
              <tr><td colSpan={4}>No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
