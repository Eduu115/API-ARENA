import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import "./landing.css";

export default function Landing() {
  useEffect(() => {
    const cursor = document.getElementById("cursor");
    const ring = document.getElementById("cursorRing");
    if (!cursor || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let animId;

    const onMouseMove = (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + "px";
      cursor.style.top = my + "px";
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      animId = requestAnimationFrame(animateRing);
    };
    animId = requestAnimationFrame(animateRing);
    document.addEventListener("mousemove", onMouseMove);

    const hoverEls = document.querySelectorAll("button, a, .bento-cell, .lb-row, .metric-bar-item");
    const onEnter = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(2)";
      ring.style.transform = "translate(-50%, -50%) scale(1.5)";
      ring.style.opacity = "0.8";
    };
    const onLeave = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      ring.style.transform = "translate(-50%, -50%) scale(1)";
      ring.style.opacity = "0.4";
    };
    hoverEls.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
      hoverEls.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Custom Cursor */}
      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="cursorRing"></div>

      {/* NAV */}
      <Header />

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-glow-2"></div>

        <div className="hero-content">
          <div className="hero-eyebrow">Season 01 · Open Beta Active</div>
          <h1 className="hero-title">
            <span className="line-1">Code</span>
            <span className="line-2">Faster.</span>
            <span className="line-3">Win.</span>
          </h1>
          <p className="hero-sub">
            La primera arena competitiva para <strong>APIs</strong>.<br />
            Envía tu código. Supera los tests. <strong>Domina el leaderboard.</strong><br />
            No simulaciones. No teoría. Código real en producción real.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">▶ Start Competing</Link>
            <Link to="/challenges" className="btn-secondary">
              Ver challenges
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">2.4K</span>
              <span className="stat-label">Submissions</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">48</span>
              <span className="stat-label">Challenges</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">312</span>
              <span className="stat-label">Developers</span>
            </div>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="hero-visual">
          <div className="terminal-window">
            <div className="terminal-bar">
              <div className="t-dot"></div>
              <div className="t-dot"></div>
              <div className="t-dot"></div>
              <span className="t-title">apiarena · submission #2847</span>
              <span className="t-status">
                <span className="t-status-dot"></span>
                LIVE
              </span>
            </div>
            <div className="terminal-body">
              <div className="t-line"><span className="t-prompt">$</span><span className="t-cmd">arena submit ./my-api --challenge crud-master</span></div>
              <div className="t-output">→ Building Docker image...</div>
              <div className="t-output">→ Spinning up sandbox...</div>
              <div className="t-success">✓ Container ready on :8080</div>
              <hr className="t-separator" />
              <div className="t-output">→ Running functional tests [47/47]</div>
              <div className="t-success">✓ All tests passed · 47/47</div>
              <div className="t-output">→ Performance analysis (1000 RPS)</div>
              <div className="t-success">✓ Avg: 12ms · P99: 28ms</div>
              <div className="t-output">→ REST design analysis...</div>
              <div className="t-info">ℹ 2 suggestions · Score: 94/100</div>
              <div className="t-output">→ AI code review...</div>
              <div className="t-success">✓ Claude review: excellent</div>
              <hr className="t-separator" />
              <div className="score-panel">
                <div className="score-row">
                  <span className="score-label">CORRECTNESS</span>
                  <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'98%',background:'linear-gradient(90deg,#00D9FF,#00FFA3)'}}></div></div>
                  <span className="score-val" style={{color:'#00D9FF'}}>980</span>
                </div>
                <div className="score-row">
                  <span className="score-label">PERFORMANCE</span>
                  <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'85%',background:'linear-gradient(90deg,#B24BF3,#00D9FF)'}}></div></div>
                  <span className="score-val" style={{color:'#B24BF3'}}>850</span>
                </div>
                <div className="score-row">
                  <span className="score-label">REST DESIGN</span>
                  <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'94%',background:'linear-gradient(90deg,#00FFA3,#00D9FF)'}}></div></div>
                  <span className="score-val" style={{color:'#00FFA3'}}>940</span>
                </div>
                <div className="score-row">
                  <span className="score-label">AI REVIEW</span>
                  <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'91%',background:'linear-gradient(90deg,#FFB800,#FF6B8A)'}}></div></div>
                  <span className="score-val" style={{color:'#FFB800'}}>910</span>
                </div>
              </div>
              <div className="t-line" style={{marginTop:'12px'}}>
                <span className="t-success" style={{padding:0,fontSize:'13px'}}>★ TOTAL SCORE: 920 · RANK #3 ↑2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          <span className="ticker-item">Docker-in-Docker execution</span>
          <span className="ticker-item">Real-time leaderboard</span>
          <span className="ticker-item">AI code review</span>
          <span className="ticker-item">Performance benchmarks</span>
          <span className="ticker-item">REST design analysis</span>
          <span className="ticker-item">Multiplayer mode</span>
          <span className="ticker-item">Replay system</span>
          <span className="ticker-item">ELO rating</span>
          <span className="ticker-item">Docker-in-Docker execution</span>
          <span className="ticker-item">Real-time leaderboard</span>
          <span className="ticker-item">AI code review</span>
          <span className="ticker-item">Performance benchmarks</span>
          <span className="ticker-item">REST design analysis</span>
          <span className="ticker-item">Multiplayer mode</span>
          <span className="ticker-item">Replay system</span>
          <span className="ticker-item">ELO rating</span>
        </div>
      </div>

      {/* ABOUT */}
      <section className="section">
        <div className="about-grid">
          <div className="about-left">
            <div className="section-label">¿Qué es APIArena?</div>
            <h2 className="section-title">
              No es un<br />
              curso.<br />
              <em>Es una guerra.</em>
            </h2>
            <p className="about-desc">
              Crea una API que resuelva el reto. Envía tu código.<br />
              Nuestro sistema la ejecuta en un sandbox aislado y la <strong>destroza con tests automáticos</strong>,
              análisis de rendimiento, validación REST y una revisión de IA.<br /><br />
              Tu puntuación entra al leaderboard. <strong>En tiempo real.</strong><br />
              Mejora, reenvía, escala posiciones.
            </p>
            <div className="about-tags">
              <span className="tag active">REST APIs</span>
              <span className="tag active">Spring Boot</span>
              <span className="tag">Node.js</span>
              <span className="tag">FastAPI</span>
              <span className="tag">Go</span>
              <span className="tag">Cualquier lenguaje</span>
            </div>
          </div>
          <div className="about-right">
            <div className="about-corner-text">API</div>
            <div className="metrics-stack">
              <div className="metric-bar-item bracket-hover">
                <span className="metric-name">Functional</span>
                <div className="metric-track"><div className="metric-fill" style={{width:'97%',background:'linear-gradient(90deg,#00D9FF,#00FFA3)'}}></div></div>
                <span className="metric-pct" style={{color:'#00D9FF'}}>97%</span>
              </div>
              <div className="metric-bar-item bracket-hover">
                <span className="metric-name">Performance</span>
                <div className="metric-track"><div className="metric-fill" style={{width:'82%',background:'linear-gradient(90deg,#B24BF3,#00D9FF)'}}></div></div>
                <span className="metric-pct" style={{color:'#B24BF3'}}>82%</span>
              </div>
              <div className="metric-bar-item bracket-hover">
                <span className="metric-name">REST Design</span>
                <div className="metric-track"><div className="metric-fill" style={{width:'88%',background:'linear-gradient(90deg,#00FFA3,#00D9FF)'}}></div></div>
                <span className="metric-pct" style={{color:'#00FFA3'}}>88%</span>
              </div>
              <div className="metric-bar-item bracket-hover">
                <span className="metric-name">AI Review</span>
                <div className="metric-track"><div className="metric-fill" style={{width:'91%',background:'linear-gradient(90deg,#FFB800,#FF6B8A)'}}></div></div>
                <span className="metric-pct" style={{color:'#FFB800'}}>91%</span>
              </div>
              <div className="metric-bar-item bracket-hover" style={{marginTop:'2px',background:'rgba(0,217,255,0.04)',borderLeft:'2px solid var(--cyan)'}}>
                <span className="metric-name" style={{color:'var(--cyan)'}}>TOTAL SCORE</span>
                <div className="metric-track"><div className="metric-fill" style={{width:'90%',background:'linear-gradient(90deg,#00D9FF,#B24BF3)'}}></div></div>
                <span className="metric-pct" style={{color:'white',fontSize:'28px'}}>900</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="slash-divider">// // // // // // // // // //</div>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-header">
          <div className="section-label">Protocolo</div>
          <h2 className="section-title">Cómo <em>funciona</em></h2>
        </div>
        <div className="steps-row">
          <div className="step">
            <div className="step-num">01</div>
            <h3 className="step-title">Elige<br />el reto</h3>
            <p className="step-desc">Explora challenges de distintas dificultades. CRUD, Auth, Performance, Design. Cada uno tiene su especificación de API y tests ocultos.</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3 className="step-title">Crea<br />tu API</h3>
            <p className="step-desc">Usa el lenguaje y framework que quieras. Spring Boot, Node, Go, Rust. Lo que sea. Dockeriza y sube tu código.</p>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h3 className="step-title">Sandbox<br />&amp; Tests</h3>
            <p className="step-desc">Tu API se lanza en un contenedor aislado. Tests automáticos, análisis de rendimiento con 1000 RPS, validación REST y review de IA.</p>
          </div>
          <div className="step">
            <div className="step-num">04</div>
            <h3 className="step-title">Sube en<br />el ranking</h3>
            <p className="step-desc">Tu score entra al leaderboard en tiempo real. Analiza tu replay, itera tu API, reenvía y escala posiciones.</p>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="features-section">
        <div className="features-header">
          <div>
            <div className="section-label">Arsenal</div>
            <h2 className="section-title">Features que<br />importan.</h2>
          </div>
          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'11px',color:'var(--muted)',maxWidth:'280px',lineHeight:'1.8',letterSpacing:'0.5px'}}>
            Evaluación multidimensional. No es solo si tu API funciona — es qué tan bien funciona.
          </p>
        </div>
        <div className="bento-grid">
          <div className="bento-cell bento-wide bracket-hover">
            <span className="bento-icon"></span>
            <div className="bento-num">01</div>
            <h3 className="bento-title">Sandbox Aislado</h3>
            <p className="bento-desc">Docker-in-Docker. Tu API corre en un entorno completamente aislado con límites de CPU y RAM. Sin trucos, sin trampas.</p>
            <div className="bento-extra">
              <span className="mini-badge cyan">CPU Limit</span>
              <span className="mini-badge purple">RAM Limit</span>
              <span className="mini-badge green">Network Isolated</span>
            </div>
          </div>
          <div className="bento-cell bracket-hover">
            <span className="bento-icon"></span>
            <div className="bento-num">02</div>
            <h3 className="bento-title">AI Review</h3>
            <p className="bento-desc">Claude analiza tu código. Arquitectura, seguridad, best practices. Feedback real, no genérico.</p>
          </div>
          <div className="bento-cell bracket-hover">
            <span className="bento-icon"></span>
            <div className="bento-num">03</div>
            <h3 className="bento-title">Sistema Replay</h3>
            <p className="bento-desc">Reproduce cada request, cada respuesta, cada métrica. Analiza dónde fallaste frame a frame.</p>
          </div>
          <div className="bento-cell bracket-hover">
            <span className="bento-icon"></span>
            <div className="bento-num">04</div>
            <h3 className="bento-title">Multiplayer</h3>
            <p className="bento-desc">Compite 1vs1 en tiempo real. Mismo challenge, mismo tiempo. El mejor score gana.</p>
          </div>
          <div className="bento-cell bento-wide bracket-hover">
            <span className="bento-icon"></span>
            <div className="bento-num">05</div>
            <h3 className="bento-title">Métricas en Tiempo Real</h3>
            <p className="bento-desc">InfluxDB + Grafana integrado. P95, P99 response times, throughput, error rates. Todo mientras tu API se ejecuta.</p>
            <div className="bento-extra">
              <span className="mini-badge cyan">InfluxDB</span>
              <span className="mini-badge purple">Grafana</span>
              <span className="mini-badge green">WebSocket Live</span>
            </div>
          </div>
        </div>
      </section>

      <div className="slash-divider">// // // // // // // // // //</div>

      {/* LEADERBOARD */}
      <section className="lb-section">
        <div className="lb-grid">
          <div>
            <div className="live-badge"><span className="live-dot"></span>Live Leaderboard</div>
            <div className="lb-table">
              <div className="lb-header-row">
                <span className="lb-head-cell">Rank</span>
                <span className="lb-head-cell">Player</span>
                <span className="lb-head-cell">Score</span>
                <span className="lb-head-cell" style={{textAlign:'right'}}>Time</span>
              </div>
              <div className="lb-row gold">
                <span className="lb-rank">1</span>
                <div className="lb-user">
                  <div className="lb-avatar" style={{background:'linear-gradient(135deg,#FFD700,#FF6B8A)'}}>CX</div>
                  <span className="lb-username">CodeX_Dev</span>
                </div>
                <span className="lb-score">987</span>
                <span className="lb-time">04:12</span>
              </div>
              <div className="lb-row silver">
                <span className="lb-rank">2</span>
                <div className="lb-user">
                  <div className="lb-avatar" style={{background:'linear-gradient(135deg,#00D9FF,#B24BF3)'}}>NN</div>
                  <span className="lb-username">n1nja_net</span>
                </div>
                <span className="lb-score" style={{color:'#B24BF3'}}>961</span>
                <span className="lb-time">05:47</span>
              </div>
              <div className="lb-row bronze">
                <span className="lb-rank">3</span>
                <div className="lb-user">
                  <div className="lb-avatar" style={{background:'linear-gradient(135deg,#00FFA3,#00D9FF)'}}>AW</div>
                  <span className="lb-username">api_wizard</span>
                </div>
                <span className="lb-score" style={{color:'#00FFA3'}}>943</span>
                <span className="lb-time">06:03</span>
              </div>
              <div className="lb-row">
                <span className="lb-rank" style={{color:'var(--muted)'}}>4</span>
                <div className="lb-user">
                  <div className="lb-avatar" style={{background:'linear-gradient(135deg,#1A2040,#B24BF3)'}}>RG</div>
                  <span className="lb-username">restguru</span>
                </div>
                <span className="lb-score" style={{color:'var(--muted)',fontSize:'22px'}}>918</span>
                <span className="lb-time">07:22</span>
              </div>
              <div className="lb-row">
                <span className="lb-rank" style={{color:'var(--muted)'}}>5</span>
                <div className="lb-user">
                  <div className="lb-avatar" style={{background:'linear-gradient(135deg,#1A2040,#FFB800)'}}>DK</div>
                  <span className="lb-username">dev_kira</span>
                </div>
                <span className="lb-score" style={{color:'var(--muted)',fontSize:'22px'}}>897</span>
                <span className="lb-time">08:11</span>
              </div>
            </div>
          </div>
          <div className="lb-right">
            <div className="section-label">Competencia</div>
            <h2 className="section-title">Tu código<br />vs el mundo.<br /><em>Real time.</em></h2>
            <p className="lb-right-desc">
              El leaderboard se actualiza vía WebSocket. Cada submission que entra, cada posición que cambia — lo ves en el momento. Sin recargar.<br /><br />
              El sistema ELO asegura que subir una posición en el top 10 valga más que dominar el top 100.
            </p>
            <Link to="/leaderboard" className="btn-primary">Ver Leaderboard Global</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-bg-text">ARENA</div>
        <div className="cta-glow"></div>
        <div className="cta-content">
          <div className="section-label" style={{justifyContent:'center',marginBottom:'24px'}}>
            Season 01 · Early Access
          </div>
          <h2 className="cta-title">
            <span className="white">¿Listo para</span>
            <span className="outlined">entrar?</span>
          </h2>
          <p className="cta-sub">Early access abierto · Sin tarjeta de crédito</p>
          <div className="cta-input-row">
            <input className="cta-input" type="email" placeholder="your@email.com" />
            <button className="cta-btn">Join Arena</button>
          </div>
          <p className="cta-fine">312 developers ya en la arena · Gratis durante beta</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-left">
          <strong style={{color:'var(--cyan)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:'18px',letterSpacing:'2px',fontWeight:'900'}}>
            <span style={{color:'var(--cyan)'}}>API</span>Arena
          </strong><br />
          © 2025 · Compete. Build. Conquer.<br />
          Proyecto TFG · Universidad
        </div>
        <div className="footer-right">
          <a href="#">GitHub</a>
          <a href="#">Docs</a>
          <a href="#">API</a>
          <a href="#">Status</a>
        </div>
      </footer>
    </div>
  );
}
