export const TERMINAL_SCORE_DIMS = [
  {
    group: 'http',
    labelKey: 'functional',
    score: 285,
    max: 300,
    pct: 95,
    color: '#00D9FF',
    gradient: 'linear-gradient(90deg,#00D9FF,#00FFA3)',
  },
  {
    group: 'http',
    labelKey: 'performance',
    score: 255,
    max: 300,
    pct: 85,
    color: '#B24BF3',
    gradient: 'linear-gradient(90deg,#B24BF3,#00D9FF)',
  },
  {
    group: 'http',
    labelKey: 'design',
    score: 190,
    max: 200,
    pct: 95,
    color: '#00FFA3',
    gradient: 'linear-gradient(90deg,#00FFA3,#00D9FF)',
  },
  {
    group: 'review',
    labelKey: 'review',
    score: 190,
    max: 200,
    pct: 95,
    color: '#FFB800',
    gradient: 'linear-gradient(90deg,#FFB800,#FF6B8A)',
  },
];

/** Max points per dimension (rubric caps, not example grades). */
export const SCORE_RUBRIC_HTTP = [
  {
    key: 'functional',
    points: 300,
    max: 300,
    pct: 100,
    color: '#00D9FF',
    gradient: 'linear-gradient(90deg,#00D9FF,#00FFA3)',
  },
  {
    key: 'performance',
    points: 300,
    max: 300,
    pct: 100,
    color: '#B24BF3',
    gradient: 'linear-gradient(90deg,#B24BF3,#00D9FF)',
  },
  {
    key: 'design',
    points: 200,
    max: 200,
    pct: 100,
    color: '#00FFA3',
    gradient: 'linear-gradient(90deg,#00FFA3,#00D9FF)',
  },
];

export const SCORE_RUBRIC_REVIEW = {
  points: 200,
  max: 200,
  pct: 100,
  color: '#FFB800',
  gradient: 'linear-gradient(90deg,#FFB800,#FF6B8A)',
};

export const ABOUT_TAGS = [
  { label: 'REST APIs',        active: true },
  { label: 'Spring Boot',      active: true },
  { label: 'Node.js',          active: false },
  { label: 'FastAPI',          active: false },
  { label: 'Any language', active: false },
];

export const STEPS = [
  {
    num: '01',
    title: ['Pick', 'the challenge'],
    desc: 'Explore challenges across difficulty levels. CRUD, Auth, Performance, Design. Each includes API specification and hidden tests.',
  },
  {
    num: '02',
    title: ['Build', 'your API'],
    desc: 'Use the language and framework you prefer. Spring Boot, Node, Go, Rust. Dockerize it and upload your code.',
  },
  {
    num: '03',
    title: ['Sandbox', '& Tests'],
    desc: 'Your API runs in an isolated container. Automated tests, performance analysis with 1000 RPS, REST validation, and AI review.',
  },
  {
    num: '04',
    title: ['Climb', 'the ranking'],
    desc: 'Your score enters the leaderboard in real time. Analyze replay, iterate your API, resubmit, and climb positions.',
  },
];

export const FEATURES = [
  {
    num: '01',
    title: 'Isolated Sandbox',
    desc: 'Docker-in-Docker. Your API runs in a fully isolated environment with CPU and RAM limits. No tricks, no shortcuts.',
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
    desc: 'AI analyzes your code: architecture, security, and best practices. Real feedback, not generic output.',
  },
  {
    num: '03',
    title: 'Replay System',
    desc: 'Replay every request, every response, every metric. Analyze where it failed step by step.',
  },
  {
    num: '04',
    title: 'Multiplayer',
    desc: 'Compete 1v1 in real time. Same challenge, same clock. Best score wins.',
  },
  {
    num: '05',
    title: 'Real-Time Metrics',
    desc: 'Integrated InfluxDB + Grafana. P95/P99 response times, throughput, error rates, all while your API runs.',
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
    rank: 1, initials: 'AR', name: 'arclight',
    score: 987, time: '04:12',
    tier: 'gold',
    avatarGradient: 'linear-gradient(135deg,#FFD700,#FF6B8A)',
    scoreColor: null,
  },
  {
    rank: 2, initials: 'BY', name: 'byterunner',
    score: 961, time: '05:47',
    tier: 'silver',
    avatarGradient: 'linear-gradient(135deg,#00D9FF,#B24BF3)',
    scoreColor: '#B24BF3',
  },
  {
    rank: 3, initials: 'MS', name: 'm.soto',
    score: 943, time: '06:03',
    tier: 'bronze',
    avatarGradient: 'linear-gradient(135deg,#00FFA3,#00D9FF)',
    scoreColor: '#00FFA3',
  },
  {
    rank: 4, initials: 'JV', name: 'jvallejo',
    score: 918, time: '07:22',
    tier: null,
    avatarGradient: 'linear-gradient(135deg,#1A2040,#B24BF3)',
    scoreColor: 'var(--muted)',
  },
  {
    rank: 5, initials: 'EP', name: 'elena_p',
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
