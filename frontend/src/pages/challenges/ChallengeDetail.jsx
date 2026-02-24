import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as challengesApi from '../../lib/challengesApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import './challenges.css';
import './ChallengeDetail.css';

function JsonBlock({ title, data }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;
  return (
    <section className="chd-section">
      <h2 className="chd-section-title">{title}</h2>
      <pre className="chd-json-block">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}

function ListBlock({ title, items }) {
  if (!items || (Array.isArray(items) && items.length === 0)) return null;
  const list = Array.isArray(items) ? items : (items?.objectives ?? Object.values(items));
  if (!list?.length) return null;
  return (
    <section className="chd-section">
      <h2 className="chd-section-title">{title}</h2>
      <ul className="chd-list">
        {list.map((item, i) => (
          <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    </section>
  );
}

function HintsBlock({ hints }) {
  if (!hints || (typeof hints === 'object' && Object.keys(hints).length === 0)) return null;
  const entries = typeof hints === 'object' ? Object.entries(hints) : [];
  return (
    <section className="chd-section">
      <h2 className="chd-section-title">Pistas</h2>
      <ul className="chd-hints-list">
        {entries.map(([key, val]) => (
          <li key={key}>
            <span className="chd-hint-num">{key}</span>
            <span>{typeof val === 'string' ? val : JSON.stringify(val)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await challengesApi.getChallengeById(id);
        if (!cancelled) setChallenge(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Error al cargar el challenge');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const diff = challenge?.difficulty?.toLowerCase() || 'easy';
  const diffBadgeClass = {
    easy: 'ch-badge-easy',
    medium: 'ch-badge-medium',
    hard: 'ch-badge-hard',
    expert: 'ch-badge-expert',
  }[diff] ?? 'ch-badge-cat';

  if (loading) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
        <main className="chd-main">
          <div className="chd-loading">Cargando challenge...</div>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="challenges-page chd-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
        <main className="chd-main">
          <p className="chd-error">{error || 'Challenge no encontrado'}</p>
          <button type="button" className="chd-btn-back" onClick={() => navigate('/challenges')}>
            Volver a Challenges
          </button>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleString('es-ES') : '—');

  return (
    <div className="challenges-page chd-page">
      <Topbar onMenuToggle={() => {}} sidebarOpen={false} />
      <main className="chd-main">
        <div className="chd-container">
          <div className="chd-top-actions">
            <button type="button" className="chd-btn-back" onClick={() => navigate('/challenges')}>
              ← Volver a Challenges
            </button>
            <button type="button" className="chd-btn-start" onClick={() => {}}>
              Iniciar Challenge
            </button>
          </div>

          <header className="chd-hero">
            <div className="chd-hero-tags">
              <span className={`ch-badge ${diffBadgeClass}`}>{challenge.difficulty}</span>
              <span className="ch-badge ch-badge-cat">{challenge.category}</span>
              {challenge.featured && <span className="ch-badge ch-badge-new">Featured</span>}
              {challenge.isActive === false && <span className="ch-badge" style={{ background: 'var(--red)' }}>Inactivo</span>}
            </div>
            <h1 className="chd-hero-title">{challenge.title}</h1>
            <p className="chd-hero-slug">/{challenge.slug}</p>

            <div className="chd-hero-stats">
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.maxScore ?? 1000}</span>
                <span className="chd-stat-label">Puntos máx</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.timeLimitMinutes ?? 60}</span>
                <span className="chd-stat-label">Minutos</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.timesAttempted ?? 0}</span>
                <span className="chd-stat-label">Intentos</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{challenge.timesCompleted ?? 0}</span>
                <span className="chd-stat-label">Completados</span>
              </div>
              <div className="chd-stat">
                <span className="chd-stat-value">{Number(challenge.averageScore ?? 0).toFixed(1)}</span>
                <span className="chd-stat-label">Puntuación media</span>
              </div>
            </div>

            <div className="chd-hero-meta">
              <span>ID: {challenge.id}</span>
              {challenge.createdBy != null && <span>Creado por: {challenge.createdBy}</span>}
              <span>Creado: {formatDate(challenge.createdAt)}</span>
              <span>Actualizado: {formatDate(challenge.updatedAt)}</span>
            </div>
          </header>

          <section className="chd-section chd-description">
            <h2 className="chd-section-title">Descripción</h2>
            <p className="chd-description-text">{challenge.description || 'Sin descripción.'}</p>
          </section>

          <JsonBlock title="Endpoints requeridos" data={challenge.requiredEndpoints} />
          <JsonBlock title="Códigos de estado requeridos" data={challenge.requiredStatusCodes} />
          <JsonBlock title="Headers requeridos" data={challenge.requiredHeaders} />
          <JsonBlock title="Test suite" data={challenge.testSuite} />
          <JsonBlock title="Requisitos de rendimiento" data={challenge.performanceRequirements} />
          <JsonBlock title="Criterios de diseño" data={challenge.designCriteria} />
          <HintsBlock hints={challenge.hints} />
          <ListBlock title="Objetivos de aprendizaje" items={challenge.learningObjectives} />
          {challenge.solutionExplanation && (
            <section className="chd-section">
              <h2 className="chd-section-title">Explicación de la solución</h2>
              <p className="chd-solution-text">{challenge.solutionExplanation}</p>
            </section>
          )}

        </div>
      </main>
      <BottomNav />
      <CustomCursor />
    </div>
  );
}
