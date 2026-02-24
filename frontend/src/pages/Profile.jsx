import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../lib/authApi';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import './challenges/challenges.css';
import './Profile.css';

export default function Profile() {
  const { user, isLoading, isAuthenticated, loadUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    avatarUrl: '',
    bio: '',
    githubUsername: '',
  });

  if (isLoading) {
    return (
      <div className="challenges-page profile-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
        <main className="profile-main">
          <div className="profile-loading">Cargando perfil...</div>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login', { replace: true });
    return null;
  }

  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : (user.email || '??').slice(0, 2).toUpperCase();

  const formatDate = (d) => (d ? new Date(d).toLocaleString('es-ES') : 'Nunca');

  const handleEdit = () => {
    setForm({
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
      githubUsername: user.githubUsername || '',
    });
    setEditing(true);
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authApi.updateProfile(form);
      setEditing(false);
      await loadUser();
    } catch (e) {
      setError(e?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  return (
    <div className="challenges-page profile-page">
      <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
      <main className="profile-main">
        <div className="profile-container">
          <Link to="/dashboard" className="profile-back-link">
            ← Volver al Dashboard
          </Link>

          <header className="profile-hero">
            <div
              className="profile-avatar"
              style={{
                background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : undefined,
              }}
            >
              {!user.avatarUrl && initials}
            </div>

            <div className="profile-hero-info">
              <h1 className="profile-username">{user.username}</h1>
              <p className="profile-email">{user.email}</p>
              <div className="profile-badges">
                <span className="profile-badge">{user.role || 'STUDENT'}</span>
                {user.isActive !== false && (
                  <span className="profile-badge profile-badge-active">Activo</span>
                )}
                {user.emailVerified && (
                  <span className="profile-badge profile-badge-verified">Verificado</span>
                )}
              </div>
            </div>
          </header>

          <section className="profile-section">
            <h2 className="profile-section-title">Información del perfil</h2>

            {!editing ? (
              <div className="profile-info-display">
                {user.bio && <p className="profile-bio">{user.bio}</p>}
                {user.githubUsername && (
                  <p className="profile-github">
                    GitHub: <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer">@{user.githubUsername}</a>
                  </p>
                )}
                {!user.bio && !user.githubUsername && (
                  <p className="profile-empty">Sin información adicional.</p>
                )}
                <button type="button" className="profile-btn-edit" onClick={handleEdit}>
                  Editar perfil
                </button>
              </div>
            ) : (
              <form className="profile-form" onSubmit={handleSave}>
                {error && <div className="profile-error">{error}</div>}
                <div className="profile-form-group">
                  <label htmlFor="avatarUrl">URL del avatar</label>
                  <input
                    id="avatarUrl"
                    type="url"
                    value={form.avatarUrl}
                    onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="profile-form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="Cuéntanos algo sobre ti..."
                  />
                </div>
                <div className="profile-form-group">
                  <label htmlFor="githubUsername">Usuario de GitHub</label>
                  <input
                    id="githubUsername"
                    type="text"
                    value={form.githubUsername}
                    onChange={(e) => setForm((f) => ({ ...f, githubUsername: e.target.value }))}
                    placeholder="tu-usuario"
                  />
                </div>
                <div className="profile-form-actions">
                  <button type="submit" className="profile-btn-save" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" className="profile-btn-cancel" onClick={handleCancel}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Estadísticas</h2>
            <div className="profile-stats-grid">
              <div className="profile-stat">
                <span className="profile-stat-value">{user.rating ?? 1000}</span>
                <span className="profile-stat-label">Rating (ELO)</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{user.level ?? 1}</span>
                <span className="profile-stat-label">Nivel</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{user.experiencePoints ?? 0}</span>
                <span className="profile-stat-label">Puntos de experiencia</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{user.totalChallengesCompleted ?? 0}</span>
                <span className="profile-stat-label">Challenges completados</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{user.totalTestsPassed ?? 0}</span>
                <span className="profile-stat-label">Tests aprobados</span>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Información de la cuenta</h2>
            <div className="profile-meta-grid">
              <div className="profile-meta-item">
                <span className="profile-meta-label">ID</span>
                <span className="profile-meta-value">{user.id}</span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-label">Fecha de registro</span>
                <span className="profile-meta-value">{formatDate(user.createdAt)}</span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-label">Último acceso</span>
                <span className="profile-meta-value">{formatDate(user.lastLogin)}</span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-label">Estado</span>
                <span className="profile-meta-value">{user.isActive !== false ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-label">Email verificado</span>
                <span className="profile-meta-value">{user.emailVerified ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
      <CustomCursor />
    </div>
  );
}
