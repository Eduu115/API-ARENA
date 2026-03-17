import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import '../challenges/challenges.css';
import './submissions.css';

const MOCK_DETAIL = {
  1: {
    id: 1, challengeId: 1, challengeTitle: 'REST API Design Basics', category: 'REST API Design', difficulty: 'EASY',
    status: 'COMPLETED', totalScore: 872.50, maxScore: 1000,
    correctnessScore: 340, performanceScore: 280, designScore: 252.50, aiReviewScore: null,
    avgResponseMs: 45, p95ResponseMs: 120, p99ResponseMs: 230, rps: 1520, totalRequests: 4560, failedRequests: 12,
    restComplianceScore: 92.5,
    createdAt: '2025-06-10T14:32:00', completedAt: '2025-06-10T14:58:00',
    buildLogs: '[INFO] Scanning for projects...\n[INFO] Building submission-1 1.0-SNAPSHOT\n[INFO] Compiling 12 source files\n[INFO] BUILD SUCCESS\n[INFO] Total time: 8.432 s',
    testLogs: '[TEST] GET /api/items .............. PASS (23ms)\n[TEST] POST /api/items ............. PASS (31ms)\n[TEST] GET /api/items/:id .......... PASS (18ms)\n[TEST] PUT /api/items/:id .......... PASS (27ms)\n[TEST] DELETE /api/items/:id ....... PASS (15ms)\n[TEST] GET /api/items?filter=name .. PASS (42ms)\n[TEST] POST /api/items (invalid) ... PASS (12ms)\n[TEST] GET /api/items (pagination) . PASS (55ms)\n[WARN] GET /api/items/999 .......... FAIL (expected 404, got 500)\n[TEST] OPTIONS /api/items .......... PASS (8ms)\n\nResults: 9/10 passed',
    tests: [
      { name: 'GET /api/items', passed: true, time: 23 },
      { name: 'POST /api/items', passed: true, time: 31 },
      { name: 'GET /api/items/:id', passed: true, time: 18 },
      { name: 'PUT /api/items/:id', passed: true, time: 27 },
      { name: 'DELETE /api/items/:id', passed: true, time: 15 },
      { name: 'GET /api/items?filter=name', passed: true, time: 42 },
      { name: 'POST /api/items (invalid body)', passed: true, time: 12 },
      { name: 'GET /api/items (pagination)', passed: true, time: 55 },
      { name: 'GET /api/items/999 (not found)', passed: false, time: 35 },
      { name: 'OPTIONS /api/items (CORS)', passed: true, time: 8 },
    ],
  },
  2: {
    id: 2, challengeId: 3, challengeTitle: 'JWT Authentication System', category: 'Authentication', difficulty: 'HARD',
    status: 'COMPLETED', totalScore: 645.00, maxScore: 1000,
    correctnessScore: 280, performanceScore: 195, designScore: 170, aiReviewScore: null,
    avgResponseMs: 78, p95ResponseMs: 210, p99ResponseMs: 450, rps: 890, totalRequests: 2670, failedRequests: 85,
    restComplianceScore: 76.0,
    createdAt: '2025-06-09T10:15:00', completedAt: '2025-06-09T11:02:00',
    buildLogs: '[INFO] BUILD SUCCESS\n[INFO] Total time: 12.1 s',
    testLogs: '[TEST] POST /api/auth/register ..... PASS\n[TEST] POST /api/auth/login ........ PASS\n[TEST] GET /api/auth/me ............ PASS\n[TEST] POST /api/auth/refresh ...... FAIL\n[TEST] Token expiry ................ PASS\n\nResults: 4/5 passed',
    tests: [
      { name: 'POST /api/auth/register', passed: true, time: 45 },
      { name: 'POST /api/auth/login', passed: true, time: 38 },
      { name: 'GET /api/auth/me', passed: true, time: 22 },
      { name: 'POST /api/auth/refresh', passed: false, time: 120 },
      { name: 'Token expiry validation', passed: true, time: 55 },
    ],
  },
};

function fallbackDetail(id) {
  return {
    id: Number(id), challengeId: 0, challengeTitle: `Challenge Submission #${id}`, category: 'General', difficulty: 'MEDIUM',
    status: 'COMPLETED', totalScore: 750, maxScore: 1000,
    correctnessScore: 300, performanceScore: 230, designScore: 220, aiReviewScore: null,
    avgResponseMs: 60, p95ResponseMs: 150, p99ResponseMs: 300, rps: 1100, totalRequests: 3300, failedRequests: 30,
    restComplianceScore: 85.0,
    createdAt: '2025-06-05T12:00:00', completedAt: '2025-06-05T12:30:00',
    buildLogs: '[INFO] BUILD SUCCESS', testLogs: 'Results: 7/8 passed',
    tests: [
      { name: 'Test 1', passed: true, time: 20 },
      { name: 'Test 2', passed: true, time: 30 },
      { name: 'Test 3', passed: false, time: 45 },
    ],
  };
}

const TIMELINE_STEPS = ['PENDING', 'BUILDING', 'TESTING', 'COMPLETED'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-ES');
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sub = MOCK_DETAIL[id] || fallbackDetail(id);

  const stepIndex = TIMELINE_STEPS.indexOf(sub.status);
  const isFailed = sub.status === 'FAILED';

  const scoreBreakdown = useMemo(() => [
    { label: 'Correctness', value: sub.correctnessScore, max: 400, color: 'var(--green)' },
    { label: 'Performance', value: sub.performanceScore, max: 300, color: 'var(--cyan)' },
    { label: 'Design', value: sub.designScore, max: 300, color: 'var(--purple)' },
  ], [sub]);

  const perfMetrics = [
    { label: 'Avg Response', value: `${sub.avgResponseMs}ms` },
    { label: 'P95 Response', value: `${sub.p95ResponseMs}ms` },
    { label: 'P99 Response', value: `${sub.p99ResponseMs}ms` },
    { label: 'Requests/sec', value: sub.rps?.toLocaleString() },
    { label: 'Total Requests', value: sub.totalRequests?.toLocaleString() },
    { label: 'Failed Requests', value: sub.failedRequests },
    { label: 'REST Compliance', value: `${sub.restComplianceScore}%` },
  ];

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => { }} sidebarOpen={false} />
        <main className="ch-main">
          <div className="sd-container">
            <div className="sd-timeline">
              {TIMELINE_STEPS.map((step, i) => {
                const isDone = i < stepIndex || (i === stepIndex && sub.status === 'COMPLETED');
                const isActive = i === stepIndex && sub.status !== 'COMPLETED';
                const isFail = isFailed && i === stepIndex;
                return (
                  <div key={step} style={{ display: 'contents' }}>
                    <div className="sd-timeline-step">
                      <div className={`sd-timeline-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFail ? 'failed' : ''}`} />
                      <span className={`sd-timeline-label ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFail ? 'failed' : ''}`}>{step}</span>
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`sd-timeline-line ${isDone ? 'done' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
