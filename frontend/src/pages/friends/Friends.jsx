import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import { useAuth } from '../../context/AuthContext';
import { usePageMeta } from '../../lib/usePageMeta';
import * as friendsApi from '../../lib/friendsApi';
import '../challenges/challenges.css';
import './friends.css';

export default function Friends() {
  const { t } = useTranslation('friends');
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionId, setActionId] = useState(null);
  const debounceRef = useRef(null);

  usePageMeta({ title: t('pageTitle'), path: '/friends' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([
        friendsApi.getFriends().catch(() => []),
        friendsApi.getPendingFriends().catch(() => ({ incoming: [], outgoing: [] })),
      ]);
      setFriends(Array.isArray(f) ? f : []);
      setPending(
        p && typeof p === 'object'
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
      setSearchQ('');
      setSearchResults([]);
    } catch (e) {
      alert(e?.message || t('errorSend'));
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
      alert(t('errorAccept'));
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
      alert(t('errorUpdate'));
    } finally {
      setActionId(null);
    }
  }

  async function handleUnfriend(peerUserId) {
    if (!window.confirm(t('confirmRemove'))) return;
    setActionId(`u-${peerUserId}`);
    try {
      await friendsApi.removeFriend(peerUserId);
      await loadAll();
    } catch {
      alert(t('errorRemove'));
    } finally {
      setActionId(null);
    }
  }

  const uid = user?.id;

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="ch-page-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="ch-page-eyebrow">{t('eyebrow')}</div>
              <h1 className="ch-page-title">
                {t('titleBefore')}
                <em>{t('titleEm')}</em>
              </h1>
              <p className="fr-lead">{t('lead')}</p>
            </div>
          </div>

          <div className="fr-page-grid">
            <div className="fr-col-main">
              <section aria-labelledby="fr-find-label">
                <div id="fr-find-label" className="fr-block-label">
                  {t('findPlayers')}
                </div>
                <div className="ch-search-wrap" style={{ marginBottom: 4 }}>
                  <span className="ch-search-icon">/</span>
                  <input
                    type="search"
                    className="ch-search-input"
                    placeholder={t('searchPlaceholder')}
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {searching && <p className="fr-search-hint">{t('searching')}</p>}

                {searchQ.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="fr-muted" style={{ padding: '12px 0', borderBottom: '1px solid var(--dim)' }}>
                    {t('noMatches')}
                  </p>
                )}

                {searchResults.length > 0 && (
                  <div className="fr-table" style={{ marginTop: 8 }}>
                    {searchResults.map((row) => {
                      const u = row.user;
                      if (!u) return null;
                      if (uid != null && u.id === uid) return null;
                      const rel = row.relationship || 'NONE';
                      return (
                        <div key={u.id} className="fr-table-row">
                          <div className="fr-cell-main">
                            <span className="fr-name">{u.username}</span>
                            <span className="fr-meta">
                              ELO {u.rating ?? '—'} · {u.role || 'STUDENT'}
                            </span>
                          </div>
                          <div className="fr-row-actions">
                            {rel === 'FRIEND' && <span className="fr-badge">{t('badgeFriends')}</span>}
                            {rel === 'PENDING_OUTGOING' && (
                              <span className="fr-badge fr-badge-warn">{t('badgeRequestSent')}</span>
                            )}
                            {rel === 'PENDING_INCOMING' && (
                              <span className="fr-badge fr-badge-warn">{t('badgeWantsConnect')}</span>
                            )}
                            {rel === 'NONE' && (
                              <button
                                type="button"
                                className="fr-btn fr-btn-primary"
                                disabled={actionId !== null}
                                onClick={() => handleSendRequest(u.id)}
                              >
                                {actionId === `req-${u.id}` ? '…' : t('addFriend')}
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
                  {t('yourFriends')}
                </div>
                {loading ? (
                  <p className="fr-muted" style={{ padding: '18px 0' }}>
                    {t('loading')}
                  </p>
                ) : friends.length === 0 ? (
                  <p className="fr-muted" style={{ padding: '18px 0' }}>
                    {t('emptyFriends')}
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
                            <span className="fr-meta">ELO {u.rating ?? '—'}</span>
                          </div>
                          <button
                            type="button"
                            className="fr-btn fr-btn-ghost"
                            disabled={actionId !== null}
                            onClick={() => handleUnfriend(u.id)}
                          >
                            {actionId === `u-${u.id}` ? '…' : t('remove')}
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
                {t('pending')}
              </div>
              {loading ? (
                <p className="fr-muted" style={{ padding: '18px 0' }}>
                  {t('loading')}
                </p>
              ) : (
                <>
                  <h3 className="fr-subhead">{t('incoming')}</h3>
                  {(pending.incoming || []).length === 0 ? (
                    <p className="fr-muted" style={{ padding: '0 0 12px' }}>
                      {t('noIncoming')}
                    </p>
                  ) : (
                    <div className="fr-table" style={{ marginBottom: 8 }}>
                      {(pending.incoming || []).map((p) => (
                        <div key={p.friendshipId} className="fr-table-row">
                          <div className="fr-cell-main">
                            <span className="fr-name">{p.user?.username}</span>
                            <span className="fr-meta">ELO {p.user?.rating ?? '—'}</span>
                          </div>
                          <div className="fr-row-actions">
                            <button
                              type="button"
                              className="fr-btn fr-btn-primary"
                              disabled={actionId !== null}
                              onClick={() => handleAccept(p.friendshipId)}
                            >
                              {actionId === `in-${p.friendshipId}` ? '…' : t('accept')}
                            </button>
                            <button
                              type="button"
                              className="fr-btn fr-btn-ghost"
                              disabled={actionId !== null}
                              onClick={() => handleDecline(p.friendshipId)}
                            >
                              {t('decline')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 className="fr-subhead">{t('outgoing')}</h3>
                  {(pending.outgoing || []).length === 0 ? (
                    <p className="fr-muted" style={{ padding: '0 0 8px' }}>
                      {t('noOutgoing')}
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
                            {actionId === `d-${p.friendshipId}` ? '…' : t('cancel')}
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
