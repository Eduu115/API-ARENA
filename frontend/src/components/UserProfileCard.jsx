import { useEffect, useState, useRef, useCallback } from 'react';
import { getUserPublicProfile } from '../lib/authApi';
import './UserProfileCard.css';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, var(--cyan), var(--purple))',
  'linear-gradient(135deg, var(--green), var(--cyan))',
  'linear-gradient(135deg, var(--warn), var(--red))',
  'linear-gradient(135deg, var(--purple), var(--red))',
  'linear-gradient(135deg, var(--cyan), var(--green))',
];

const profileCache = new Map();

export default function UserProfileCard({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      if (profileCache.has(userId)) {
        setProfile(profileCache.get(userId));
        setLoading(false);
        return;
      }
      try {
        const data = await getUserPublicProfile(userId);
        if (!cancelled) {
          profileCache.set(userId, data);
          setProfile(data);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!userId) return null;

  const initials = profile?.username?.slice(0, 2).toUpperCase() || '??';
  const avatarBg = AVATAR_GRADIENTS[(userId ?? 0) % AVATAR_GRADIENTS.length];
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="upc-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="upc-card">
        <button className="upc-close" onClick={onClose} aria-label="Close">×</button>

        {loading ? (
          <div className="upc-loading">Loading profile...</div>
        ) : error ? (
          <div className="upc-loading">Could not load profile</div>
        ) : profile && (
          <>
            <div className="upc-header">
              <div className="upc-eyebrow">Public profile</div>
              <div className="upc-avatar" style={{ background: avatarBg }}>{initials}</div>
              <div className="upc-name">{profile.username}</div>
              <div className="upc-role">{profile.role}</div>
              {profile.bio && <div className="upc-bio">{profile.bio}</div>}
              {memberSince && <div className="upc-since">Member since {memberSince}</div>}
            </div>

            <div className="upc-stats">
              <div className="upc-stat">
                <div className="upc-stat-val" style={{ color: 'var(--warn)' }}>{profile.rating}</div>
                <div className="upc-stat-label">ELO</div>
              </div>
              <div className="upc-stat">
                <div className="upc-stat-val" style={{ color: 'var(--cyan)' }}>{profile.level}</div>
                <div className="upc-stat-label">Level</div>
              </div>
              <div className="upc-stat">
                <div className="upc-stat-val" style={{ color: 'var(--green)' }}>{profile.totalChallengesCompleted}</div>
                <div className="upc-stat-label">Solved</div>
              </div>
              <div className="upc-stat">
                <div className="upc-stat-val" style={{ color: 'var(--purple)' }}>{profile.totalTestsPassed}</div>
                <div className="upc-stat-label">Tests</div>
              </div>
            </div>

            <div className="upc-xp-row">
              <span className="upc-xp-label">XP</span>
              <div className="upc-xp-bar">
                <div
                  className="upc-xp-fill"
                  style={{ width: `${Math.min(100, ((profile.experiencePoints % 1000) / 1000) * 100)}%` }}
                />
              </div>
              <span className="upc-xp-val">{profile.experiencePoints?.toLocaleString()}</span>
            </div>

            {profile.githubUsername && (
              <div className="upc-github">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>{profile.githubUsername}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
