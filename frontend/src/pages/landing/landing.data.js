/* ============================================================
   LANDING PAGE — Static Data
   Centraliza todos los datos estáticos de la landing page.
   ============================================================ */

export const HERO_STATS = [
  { num: '2.4K', label: 'Submissions' },
  { num: '48',   label: 'Challenges' },
  { num: '312',  label: 'Developers' },
];

export const TERMINAL_SCORE_DIMS = [
  {
    label: 'CORRECTNESS',
    pct: 98, value: 980,
    color: '#00D9FF',
    gradient: 'linear-gradient(90deg,#00D9FF,#00FFA3)',
  },
  {
    label: 'PERFORMANCE',
    pct: 85, value: 850,
    color: '#B24BF3',
    gradient: 'linear-gradient(90deg,#B24BF3,#00D9FF)',
  },
  {
    label: 'REST DESIGN',
    pct: 94, value: 940,
    color: '#00FFA3',
    gradient: 'linear-gradient(90deg,#00FFA3,#00D9FF)',
  },
  {
    label: 'AI REVIEW',
    pct: 91, value: 910,
    color: '#FFB800',
    gradient: 'linear-gradient(90deg,#FFB800,#FF6B8A)',
  },
];

export const TICKER_ITEMS = [
  'Docker-in-Docker execution',
  'Real-time leaderboard',
  'AI code review',
  'Performance benchmarks',
  'REST design analysis',
  'Multiplayer mode',
  'Replay system',
  'ELO rating',
];

export const ABOUT_METRICS = [
  { name: 'Functional',  pct: 97, display: '97%', color: '#00D9FF', gradient: 'linear-gradient(90deg,#00D9FF,#00FFA3)' },
  { name: 'Performance', pct: 82, display: '82%', color: '#B24BF3', gradient: 'linear-gradient(90deg,#B24BF3,#00D9FF)' },
  { name: 'REST Design', pct: 88, display: '88%', color: '#00FFA3', gradient: 'linear-gradient(90deg,#00FFA3,#00D9FF)' },
  { name: 'AI Review',   pct: 91, display: '91%', color: '#FFB800', gradient: 'linear-gradient(90deg,#FFB800,#FF6B8A)' },
  {
    name: 'TOTAL SCORE',
    pct: 90, display: '900',
    color: '#ffffff',
    gradient: 'linear-gradient(90deg,#00D9FF,#B24BF3)',
    total: true,
  },
];

export const ABOUT_TAGS = [
  { label: 'REST APIs',        active: true },
  { label: 'Spring Boot',      active: true },
  { label: 'Node.js',          active: false },
  { label: 'FastAPI',          active: false },
  { label: 'Go',               active: false },
  { label: 'Cualquier lenguaje', active: false },
];

export const STEPS = [
  {
    num: '01',
    title: ['Elige', 'el reto'],
    desc: 'Explora challenges de distintas dificultades. CRUD, Auth, Performance, Design. Cada uno tiene su especificación de API y tests ocultos.',
  },
  {
    num: '02',
    title: ['Crea', 'tu API'],
    desc: 'Usa el lenguaje y framework que quieras. Spring Boot, Node, Go, Rust. Lo que sea. Dockeriza y sube tu código.',
  },
  {
    num: '03',
    title: ['Sandbox', '& Tests'],
    desc: 'Tu API se lanza en un contenedor aislado. Tests automáticos, análisis de rendimiento con 1000 RPS, validación REST y review de IA.',
  },
  {
    num: '04',
    title: ['Sube en', 'el ranking'],
    desc: 'Tu score entra al leaderboard en tiempo real. Analiza tu replay, itera tu API, reenvía y escala posiciones.',
  },
];

export const FEATURES = [
  {
    num: '01',
    title: 'Sandbox Aislado',
    desc: 'Docker-in-Docker. Tu API corre en un entorno completamente aislado con límites de CPU y RAM. Sin trucos, sin trampas.',
    wide: true,
    badges: [
      { label: 'CPU Limit',        color: 'cyan' },
      { label: 'RAM Limit',        color: 'purple' },
      { label: 'Network Isolated', color: 'green' },
    ],
  },
  {
    num: '02',
    title: 'AI Review',
    desc: 'Claude analiza tu código. Arquitectura, seguridad, best practices. Feedback real, no genérico.',
  },
  {
    num: '03',
    title: 'Sistema Replay',
    desc: 'Reproduce cada request, cada respuesta, cada métrica. Analiza dónde fallaste frame a frame.',
  },
  {
    num: '04',
    title: 'Multiplayer',
    desc: 'Compite 1vs1 en tiempo real. Mismo challenge, mismo tiempo. El mejor score gana.',
  },
  {
    num: '05',
    title: 'Métricas en Tiempo Real',
    desc: 'InfluxDB + Grafana integrado. P95, P99 response times, throughput, error rates. Todo mientras tu API se ejecuta.',
    wide: true,
    badges: [
      { label: 'InfluxDB',        color: 'cyan' },
      { label: 'Grafana',         color: 'purple' },
      { label: 'WebSocket Live',  color: 'green' },
    ],
  },
];

export const LB_ENTRIES = [
  {
    rank: 1, initials: 'CX', name: 'CodeX_Dev',
    score: 987, time: '04:12',
    tier: 'gold',
    avatarGradient: 'linear-gradient(135deg,#FFD700,#FF6B8A)',
    scoreColor: null,
  },
  {
    rank: 2, initials: 'NN', name: 'n1nja_net',
    score: 961, time: '05:47',
    tier: 'silver',
    avatarGradient: 'linear-gradient(135deg,#00D9FF,#B24BF3)',
    scoreColor: '#B24BF3',
  },
  {
    rank: 3, initials: 'AW', name: 'api_wizard',
    score: 943, time: '06:03',
    tier: 'bronze',
    avatarGradient: 'linear-gradient(135deg,#00FFA3,#00D9FF)',
    scoreColor: '#00FFA3',
  },
  {
    rank: 4, initials: 'RG', name: 'restguru',
    score: 918, time: '07:22',
    tier: null,
    avatarGradient: 'linear-gradient(135deg,#1A2040,#B24BF3)',
    scoreColor: 'var(--muted)',
  },
  {
    rank: 5, initials: 'DK', name: 'dev_kira',
    score: 897, time: '08:11',
    tier: null,
    avatarGradient: 'linear-gradient(135deg,#1A2040,#FFB800)',
    scoreColor: 'var(--muted)',
  },
];

export const FOOTER_LINKS = [
  { label: 'GitHub', href: '#' },
  { label: 'Docs',   href: '#' },
  { label: 'API',    href: '#' },
  { label: 'Status', href: '#' },
];
