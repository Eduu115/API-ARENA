/**
 * UI tours: targets are [data-tutorial="…"] on the page.
 * Copy is English (product chrome language).
 */

export const TOUR_LANDING = [
  {
    target: "landing-nav",
    title: "Find your way",
    body: "Use the top bar to open Challenges, Leaderboard, and Docs. Sign in or create an account from Enter Arena when you are ready to compete.",
  },
  {
    target: "landing-hero-cta",
    title: "Start here",
    body: "Register to track scores and ELO, or browse challenges first. Everything runs on real builds and HTTP tests against your API.",
  },
  {
    target: "landing-hero-content",
    title: "What API Arena does",
    body: "You ship a Maven project as a ZIP, we build it in a sandbox, run the challenge test suite, and score correctness, performance, design, and AI review.",
  },
];

export const TOUR_DASHBOARD = [
  {
    target: "topbar",
    title: "Main navigation",
    body: "Dashboard, Challenges, Submissions, Friends, Leaderboard, Docs, and Replay are always one click away. Alerts and your profile are on the right.",
  },
  {
    target: "dashboard-sidebar",
    title: "Your stats",
    body: "The sidebar shows level, XP, solved challenges, and category breakdown. Use it as a quick read on your progress.",
  },
  {
    target: "dashboard-main",
    title: "Continue from here",
    body: "Featured and recommended challenges appear in the main area. Pick one to read the briefing and start a timed run when you are ready.",
  },
];

export const TOUR_CHALLENGES = [
  {
    target: "topbar",
    title: "Catalog navigation",
    body: "The same top bar works on every page. Docs links to guides on ZIP layout, ELO, and troubleshooting.",
  },
  {
    target: "challenges-sidebar",
    title: "Filter the list",
    body: "Search by name, filter by difficulty and status, and sort. Your progress summary is at the bottom of the sidebar.",
  },
  {
    target: "challenges-main",
    title: "Open a challenge",
    body: "Click a card to see the public briefing. After you sign in, Start Challenge opens the full specs and the submit workspace with timer and ZIP upload.",
  },
];

export const TOUR_CHALLENGE_DETAIL = [
  {
    target: "challenge-detail-actions",
    title: "Start a run",
    body: "Back returns to the catalog. Start Challenge begins your timed session: you will see full endpoints, tests, and the ZIP submit screen. Limits (cooldown, daily cap) apply to students.",
  },
  {
    target: "challenge-detail-hero",
    title: "Read the briefing",
    body: "Difficulty, category, time limit, and XP reward are shown here. The detailed contract appears only after you start—this page is the overview.",
  },
  {
    target: "challenge-detail-specs-note",
    title: "Full requirements",
    body: "Endpoints, status codes, performance, and hints unlock inside the submit workspace. If you are new, read Docs → First Steps and Preconfigure Project before starting.",
  },
];

export const TOUR_CHALLENGE_SUBMIT = [
  {
    target: "submit-limits",
    title: "Fair play rules",
    body: "Daily attempts (UTC) and cooldown between runs keep rankings fair. Staff accounts skip these limits.",
  },
  {
    target: "submit-timer",
    title: "Session timer",
    body: "The timer keeps running if you leave the tab. When time is up you cannot submit—plan your implementation before you start.",
  },
  {
    target: "submit-zip",
    title: "Upload your project",
    body: "Only .zip files. Put pom.xml at the root of the archive, include your Spring (or compatible) API, and avoid secrets. Drag and drop or click the zone to browse.",
  },
  {
    target: "submit-button",
    title: "Send to the pipeline",
    body: "Submit Solution uploads your ZIP to the build and test pipeline. Wait until it finishes—closing the tab can fail the run. See Docs → Submitting a Challenge for the full checklist.",
  },
];

export const DOCS_PATHS = {
  landing: "/docs/guia-para-empezar",
  dashboard: "/docs/guia-para-empezar",
  challenges: "/docs/challenges-catalog",
  challengeDetail: "/docs/challenge-workspace",
  challengeSubmit: "/docs/submitting-a-challenge",
};
