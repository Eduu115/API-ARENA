export const MOCK_GROUPS = [
  { id: "g1", name: "DAW 2ºA", students: 24 },
  { id: "g2", name: "ASIR 1ºB", students: 18 },
  { id: "g3", name: "Bootcamp APIs", students: 12 },
];

export const MOCK_CORRECTIONS = [
  {
    id: "s-101",
    student: "alba",
    groupId: "g1",
    challenge: "JWT Authentication System",
    status: "PENDING",
    submittedAt: "2026-03-30T10:12:00Z",
    score: null,
  },
  {
    id: "s-102",
    student: "marc",
    groupId: "g1",
    challenge: "REST API Design Basics",
    status: "NEEDS_REVIEW",
    submittedAt: "2026-03-29T16:40:00Z",
    score: 640,
  },
  {
    id: "s-201",
    student: "sofia",
    groupId: "g2",
    challenge: "SQL Injection Prevention",
    status: "GRADED",
    submittedAt: "2026-03-28T09:05:00Z",
    score: 920,
  },
];

export const MOCK_TEACHER_CHALLENGES = [
  {
    id: "tc-1",
    title: "Rate limiter básico",
    category: "Security",
    difficulty: "MEDIUM",
    createdAt: "2026-03-20T12:00:00Z",
    published: true,
  },
  {
    id: "tc-2",
    title: "Diseño de contratos REST (v2)",
    category: "REST API Design",
    difficulty: "HARD",
    createdAt: "2026-03-22T08:30:00Z",
    published: false,
  },
];

export function formatTeacherDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "2-digit" });
}

