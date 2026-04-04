import { useCallback, useEffect, useRef, useState } from "react";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import { useAuth } from "../../context/AuthContext";
import * as friendsApi from "../../lib/friendsApi";
import "../challenges/challenges.css";
import "./friends.css";

export default function Friends() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionId, setActionId] = useState(null);
  const debounceRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([
        friendsApi.getFriends().catch(() => []),
        friendsApi.getPendingFriends().catch(() => ({ incoming: [], outgoing: [] })),
      ]);
      setFriends(Array.isArray(f) ? f : []);
      setPending(
        p && typeof p === "object"
          ? {
              incoming: Array.isArray(p.incoming) ? p.incoming : [],
              outgoing: Array.isArray(p.outgoing) ? p.outgoing : [],
            }
          : { incoming: [], outgoing: [] }
      );
    } catch {
      setFriends([]);
      setPending({ incoming: [], outgoing: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQ || searchQ.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await friendsApi.searchFriends(searchQ);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQ]);

  async function handleSendRequest(userId) {
    setActionId(`req-${userId}`);
    try {
      await friendsApi.sendFriendRequest(userId);
      await loadAll();
      setSearchQ("");
      setSearchResults([]);
    } catch (e) {
      alert(e?.message || "Could not send request");
    } finally {
      setActionId(null);
    }
  }

  async function handleAccept(friendshipId) {
    setActionId(`in-${friendshipId}`);
    try {
      await friendsApi.acceptFriendRequest(friendshipId);
      await loadAll();
    } catch {
      alert("Could not accept request");
    } finally {
      setActionId(null);
    }
  }

  async function handleDecline(friendshipId) {
    setActionId(`d-${friendshipId}`);
    try {
      await friendsApi.cancelFriendRequest(friendshipId);
      await loadAll();
    } catch {
      alert("Could not update request");
    } finally {
      setActionId(null);
    }
  }

  async function handleUnfriend(peerUserId) {
    if (!window.confirm("Remove this friend?")) return;
    setActionId(`u-${peerUserId}`);
    try {
      await friendsApi.removeFriend(peerUserId);
      await loadAll();
    } catch {
      alert("Could not remove friend");
    } finally {
      setActionId(null);
    }
  }

  const uid = user?.id;

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="ch-page-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="ch-page-eyebrow">// Social</div>
              <h1 className="ch-page-title">
                Your<em>Friends</em>
              </h1>
              <p className="fr-lead">
                Search by username or email. Pending requests stay on the right; accepted friends appear below for
                invites and future online features.
              </p>
            </div>
          </div>

          <div className="fr-page-grid">
            <div className="fr-col-main">
              <section aria-labelledby="fr-find-label">
                <div id="fr-find-label" className="fr-block-label">
                  Find players
                </div>
                <div className="ch-search-wrap" style={{ marginBottom: 4 }}>
                  <span className="ch-search-icon">/</span>
                  <input
                    type="search"
                    className="ch-search-input"
                    placeholder="Username or email (min. 2 characters)"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {searching && <p className="fr-search-hint">Searching…</p>}

                {searchQ.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="fr-muted" style={{ padding: "12px 0", borderBottom: "1px solid var(--dim)" }}>
                    No matches.
                  </p>
                )}

                {searchResults.length > 0 && (
                  <div className="fr-table" style={{ marginTop: 8 }}>
                    {searchResults.map((row) => {
                      const u = row.user;
                      if (!u) return null;
                      if (uid != null && u.id === uid) return null;
                      const rel = row.relationship || "NONE";
                      return (
                        <div key={u.id} className="fr-table-row">
                          <div className="fr-cell-main">
                            <span className="fr-name">{u.username}</span>
                            <span className="fr-meta">
                              ELO {u.rating ?? "—"} · {u.role || "STUDENT"}
                            </span>
                          </div>
                          <div className="fr-row-actions">
                            {rel === "FRIEND" && <span className="fr-badge">Friends</span>}
                            {rel === "PENDING_OUTGOING" && (
                              <span className="fr-badge fr-badge-warn">Request sent</span>
                            )}
                            {rel === "PENDING_INCOMING" && (
                              <span className="fr-badge fr-badge-warn">Wants to connect</span>
                            )}
                            {rel === "NONE" && (
                              <button
                                type="button"
                                className="fr-btn fr-btn-primary"
                                disabled={actionId !== null}
                                onClick={() => handleSendRequest(u.id)}
                              >
                                {actionId === `req-${u.id}` ? "…" : "Add friend"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section aria-labelledby="fr-list-label" style={{ marginTop: 36 }}>
                <div id="fr-list-label" className="fr-block-label">
                  Your friends
                </div>
                {loading ? (
                  <p className="fr-muted" style={{ padding: "18px 0" }}>
                    Loading…
                  </p>
                ) : friends.length === 0 ? (
                  <p className="fr-muted" style={{ padding: "18px 0" }}>
                    No friends yet. Use search above to invite someone.
                  </p>
                ) : (
                  <div className="fr-table">
                    {friends.map((entry) => {
                      const u = entry.user;
                      if (!u) return null;
                      return (
                        <div key={entry.friendshipId} className="fr-table-row">
                          <div className="fr-cell-main">
                            <span className="fr-name">{u.username}</span>
                            <span className="fr-meta">ELO {u.rating ?? "—"}</span>
                          </div>
                          <button
                            type="button"
                            className="fr-btn fr-btn-ghost"
                            disabled={actionId !== null}
                            onClick={() => handleUnfriend(u.id)}
                          >
                            {actionId === `u-${u.id}` ? "…" : "Remove"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="fr-col-pending" aria-labelledby="fr-pending-label">
              <div id="fr-pending-label" className="fr-block-label">
                Pending
              </div>
              {loading ? (
                <p className="fr-muted" style={{ padding: "18px 0" }}>
                  Loading…
                </p>
              ) : (
                <>
                  <h3 className="fr-subhead">Incoming</h3>
                  {(pending.incoming || []).length === 0 ? (
                    <p className="fr-muted" style={{ padding: "0 0 12px" }}>
                      No incoming requests.
                    </p>
                  ) : (
                    <div className="fr-table" style={{ marginBottom: 8 }}>
                      {(pending.incoming || []).map((p) => (
                        <div key={p.friendshipId} className="fr-table-row">
                          <div className="fr-cell-main">
                            <span className="fr-name">{p.user?.username}</span>
                            <span className="fr-meta">ELO {p.user?.rating ?? "—"}</span>
                          </div>
                          <div className="fr-row-actions">
                            <button
                              type="button"
                              className="fr-btn fr-btn-primary"
                              disabled={actionId !== null}
                              onClick={() => handleAccept(p.friendshipId)}
                            >
                              {actionId === `in-${p.friendshipId}` ? "…" : "Accept"}
                            </button>
                            <button
                              type="button"
                              className="fr-btn fr-btn-ghost"
                              disabled={actionId !== null}
                              onClick={() => handleDecline(p.friendshipId)}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 className="fr-subhead">Outgoing</h3>
                  {(pending.outgoing || []).length === 0 ? (
                    <p className="fr-muted" style={{ padding: "0 0 8px" }}>
                      No outgoing requests.
                    </p>
                  ) : (
                    <div className="fr-table">
                      {(pending.outgoing || []).map((p) => (
                        <div key={p.friendshipId} className="fr-table-row">
                          <div className="fr-cell-main">
                            <span className="fr-name">{p.user?.username}</span>
                          </div>
                          <button
                            type="button"
                            className="fr-btn fr-btn-ghost"
                            disabled={actionId !== null}
                            onClick={() => handleDecline(p.friendshipId)}
                          >
                            {actionId === `d-${p.friendshipId}` ? "…" : "Cancel"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </aside>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
