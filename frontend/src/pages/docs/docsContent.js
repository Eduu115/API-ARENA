export const DOC_DOCUMENTS = [
  {
    id: "guia-para-empezar",
    title: "Getting Started Guide",
    summary: "Mindset, work strategy, and delivery rhythm to progress fast without burning out.",
    readTime: "9 min",
    sections: [
      {
        id: "enfoque",
        heading: "Recommended approach to improve consistently",
        paragraphs: [
          "API Arena does not reward only final outcomes: it rewards consistent progress and your ability to iterate with technical judgment. If you start with a complex challenge before mastering build, test, and submission flow, frustration usually comes quickly.",
          "For most students, the most effective strategy is simple: stack small wins in EASY and MEDIUM challenges, internalize the pipeline, and then scale difficulty on top of a stable base."
        ],
        bullets: [
          "Work in 20-40 minute goals: one endpoint, one validation, or one test block.",
          "Submit incrementally: if something measurable improved, validate it before overcomplicating.",
          "Track recurring failures (status codes, payloads, headers) and turn them into your personal checklist."
        ]
      },
      {
        id: "flujo-estudio",
        heading: "Recommended study and practice flow",
        paragraphs: [
          "Before writing code, spend a few minutes reading the challenge carefully and separating mandatory requirements from optional improvements.",
          "When implementing, prioritize observable behavior over internal perfection. If an endpoint does not respond as expected, clean architecture alone will not pass functional tests."
        ],
        bullets: [
          "Step 1: review required endpoints and expected HTTP codes.",
          "Step 2: boot a minimal API with health + first working endpoint.",
          "Step 3: implement the main CRUD or domain flow.",
          "Step 4: tighten validations and error handling.",
          "Step 5: optimize performance and design details."
        ],
        visual: {
          type: "flow",
          title: "Visual workflow map",
          steps: [
            { label: "Read challenge", hint: "Endpoints + codes + constraints" },
            { label: "Implement baseline", hint: "Health + routing + JSON" },
            { label: "Complete core behavior", hint: "Main CRUD + validations" },
            { label: "Verify HTTP contract", hint: "Status + payload + errors" },
            { label: "Submit and measure", hint: "Logs + score + next iteration" }
          ]
        }
      },
      {
        id: "evitar-bloqueos",
        heading: "How to avoid beginner bottlenecks",
        paragraphs: [
          "When something fails, do not change ten things at once. Make small changes, verify impact, then continue.",
          "If you are stuck for 25-30 minutes, stop and return to a stable baseline. In API work, going back to basics often unblocks faster than forcing a complex fix."
        ],
        bullets: [
          "Track issue, hypothesis, applied change, and outcome.",
          "Use intentional local checkpoints (e.g. fix-404-books, validate-input-auth).",
          "If you cannot explain an error, reduce it to a minimal reproducible case."
        ]
      }
    ]
  },
  {
    id: "primeros-pasos",
    title: "First Steps",
    summary: "Practical checklist to prepare your first challenge from start to finish.",
    readTime: "11 min",
    sections: [
      {
        id: "antes-codificar",
        heading: "Before coding: prepare the ground",
        paragraphs: [
          "Your first challenge does not begin with controllers. It begins with technical reading and local environment validation.",
          "Define a minimum architecture up front: layers, entities, validations, and error handling. A clear starting structure avoids accidental debt."
        ],
        bullets: [
          "Verify Java and Maven versions are compatible with your project.",
          "Ensure packaging produces a runnable JAR.",
          "Confirm API port and context do not depend on exotic local settings."
        ]
      },
      {
        id: "implementacion-minima",
        heading: "Minimum viable implementation for an early submission",
        paragraphs: [
          "Do not solve everything at once. Build a stable backbone first: routing, JSON serialization, basic validation, and coherent HTTP responses.",
          "The goal of your first submission is not a perfect score. It is proving the full pipeline works with your foundation."
        ],
        bullets: [
          "Start with required GET endpoints to validate response structures.",
          "Then add POST/PUT/DELETE with essential validation.",
          "Handle 404, 400, and 500 consistently."
        ]
      },
      {
        id: "primera-entrega",
        heading: "First submission: what to verify before uploading ZIP",
        paragraphs: [
          "Most first-submission failures are not business-logic issues but packaging and project-structure issues. ZIP pre-check is mandatory.",
          "Assume evaluator environments are strict and know nothing about your local machine."
        ],
        bullets: [
          "ZIP must contain `pom.xml` at the root, not inside nested folders.",
          "Avoid undeclared local dependencies.",
          "Do not upload unnecessary artifacts (heavy target output, temp files, credentials)."
        ]
      }
    ]
  },

  {
    id: "preconfiguracion-proyecto",
    title: "Preconfigure Project for Challenges",
    summary: "Complete technical guide for prerequisites, minimum structure, and pre-submission validation.",
    readTime: "14 min",
    sections: [
      {
        id: "estructura-base",
        heading: "Base project structure requirements",
        paragraphs: [
          "For API Arena to compile and run your submission, keep a predictable standard Maven structure. If the build system cannot find expected files, it fails before tests run.",
          "Treat your project as a portable package: any environment should unzip, compile, and start it without manual help."
        ],
        bullets: [
          "ZIP root: `pom.xml`, `src/`, and required config files.",
          "Main code in `src/main/java`, resources in `src/main/resources` when needed.",
          "No absolute paths or scripts tied to your local machine."
        ],
        visual: {
          type: "tree",
          title: "Recommended ZIP structure",
          lines: [
            "my-challenge-api.zip",
            "├── pom.xml",
            "├── src/",
            "│   ├── main/java/com/yourapp/...",
            "│   └── main/resources/application.properties",
            "└── README.md (optional)"
          ]
        }
      },
      {
        id: "pom-dependencias",
        heading: "Maven configuration and dependencies",
        paragraphs: [
          "Your `pom.xml` is the challenge build contract. Missing dependencies or misconfigured plugins can break sandbox execution.",
          "A clean and explicit POM reduces variability and improves reproducibility."
        ],
        bullets: [
          "Declare compatible Java version and compiler plugin.",
          "Include only required web, serialization, and validation dependencies.",
          "Avoid unnecessary dependencies that increase build time or conflict."
        ]
      },
      {
        id: "arranque-api",
        heading: "API startup conditions",
        paragraphs: [
          "Your API must start autonomously and respond in a reasonable time. If startup is too slow or fails, tests cannot execute reliably.",
          "Use safe defaults for evaluation environments and do not block startup on optional variables."
        ],
        bullets: [
          "Provide a health endpoint or minimum response endpoint.",
          "Do not require external services just to boot.",
          "Handle initialization failures with clear logs."
        ]
      },
      {
        id: "checklist-envio",
        heading: "Final checklist before submit",
        paragraphs: [
          "This checklist often separates a valid submission from a failed packaging attempt. Always run it, even with experience.",
          "If you fail here, score reflects delivery issues, not real technical ability."
        ],
        bullets: [
          "Compile locally with `mvn clean package` without extra manual steps.",
          "Validate required endpoints and expected HTTP status codes.",
          "Generate final ZIP and manually inspect internal structure.",
          "Review logs once more and remove secrets/credentials."
        ],
        visual: {
          type: "checklist",
          title: "Quick pre-submit checklist",
          items: [
            { label: "Build local OK", status: "ok" },
            { label: "pom.xml at ZIP root", status: "ok" },
            { label: "Required endpoints covered", status: "ok" },
            { label: "Correct HTTP status codes", status: "ok" },
            { label: "No secrets inside bundle", status: "warn" }
          ]
        }
      }
    ]
  },
  {
    id: "platform-navigation",
    title: "Platform navigation",
    summary:
      "Where everything lives: landing, app chrome, dashboard, challenges, submissions, Docs, and account basics.",
    readTime: "6 min",
    sections: [
      {
        id: "map",
        heading: "High-level map",
        paragraphs: [
          "API Arena splits marketing pages (landing) from the authenticated app. Once you sign in, the same top bar follows you everywhere so muscle memory builds fast.",
          "Use Docs as the permanent reference. Guided tours only introduce the UI once; Docs stays available for deep dives (ZIP layout, ELO, troubleshooting)."
        ],
        bullets: [
          "Landing: public overview, links to Challenges and registration.",
          "App pages: Dashboard, Challenges catalog, Submissions, Friends, Leaderboard, Docs, Replay.",
          "Profile and Alerts live on the right side of the top bar when you are signed in."
        ]
      },
      {
        id: "chrome",
        heading: "Top bar (guest vs signed in)",
        paragraphs: [
          "Guests see Challenges, Leaderboard, Docs, and Replay plus Log in. Signed-in users also see Dashboard, Submissions, Friends, ELO, Alerts, theme toggle, and Profile.",
          "The bottom navigation on smaller screens mirrors the same destinations where applicable."
        ],
        bullets: [
          "Docs opens the learning hub with long-form guides — bookmark pages you reuse often.",
          "Replay shows pipeline timelines for past submissions when available.",
          "Teacher accounts may see an extra Teacher entry for class workflows."
        ]
      },
      {
        id: "dashboard",
        heading: "Dashboard",
        paragraphs: [
          "The dashboard is your home after login: KPI cards, recent challenges, and shortcuts into the catalog. The sidebar summarizes level, XP, solved count, and category mix.",
          "Treat it as a launch pad, not the only place to browse — the full catalog with filters lives under Challenges."
        ],
        bullets: [
          "Open a challenge from the table or featured cards to read the public briefing.",
          "Use Enter Arena or Browse all to jump into the full challenge list when you want filters."
        ]
      }
    ]
  },
  {
    id: "challenges-catalog",
    title: "Challenges catalog",
    summary: "How to search, filter, sort, and open a challenge before you start a timed run.",
    readTime: "5 min",
    sections: [
      {
        id: "sidebar",
        heading: "Sidebar filters",
        paragraphs: [
          "The left column is for narrowing the list: text search, difficulty, completion status, category chips, and a short progress summary.",
          "Filters combine — clear tags at the top of the main column when you want to reset one dimension."
        ],
        bullets: [
          "Difficulty filters match the badge on each card (easy → expert).",
          "Status helps you focus on unsolved, in-progress, or completed challenges when you are planning practice.",
          "Sort changes ordering only; it does not hide challenges unless combined with filters."
        ]
      },
      {
        id: "cards",
        heading: "Reading a card",
        paragraphs: [
          "Each card shows difficulty, category, origin (legacy vs community), points, description snippet, and community stats (attempts, solves). Your best score appears when you have history on that challenge.",
          "Click the card to open the challenge detail page — the public briefing before you commit to a timed run."
        ],
        bullets: [
          "Featured badges highlight editorial picks; they are still normal challenges with the same rules.",
          "Grid vs list view is preference only — content is identical."
        ]
      },
      {
        id: "next",
        heading: "What happens next",
        paragraphs: [
          "From detail, Start Challenge checks limits and then opens the submit workspace with the full contract, timer, and ZIP upload.",
          "If you only want to read, stay on the detail page — nothing is consumed until you start."
        ],
        bullets: [
          "Sign in is required to start — guests get a login prompt.",
          "See Challenge workspace for the difference between preview and full specs."
        ]
      }
    ]
  },
  {
    id: "challenge-workspace",
    title: "Challenge workspace",
    summary: "Challenge detail vs submit screen: what you see before and after you start a timed run.",
    readTime: "6 min",
    sections: [
      {
        id: "preview",
        heading: "Challenge detail (preview)",
        paragraphs: [
          "The detail page is the public briefing: title, difficulty, category, timing, XP reward, and a description. Full HTTP contracts, test expectations, and hints are intentionally gated.",
          "That keeps the catalog readable while protecting competitive integrity — you commit to the timer before seeing the complete specification."
        ],
        bullets: [
          "Back returns to the catalog; Start Challenge is the primary action when you are ready.",
          "If limits block you (daily cap or cooldown), the UI explains the next eligible time in UTC."
        ]
      },
      {
        id: "submit",
        heading: "Submit workspace (after start)",
        paragraphs: [
          "After you start, the submit route shows the full requirements: endpoints, status codes, tests, performance and design criteria, hints, and learning objectives.",
          "A live timer counts down for your session. Leaving the page does not pause the clock — plan before you start."
        ],
        bullets: [
          "Fair-play limits (attempts per day UTC, cooldown) appear at the top of the workspace.",
          "Staff roles may bypass student limits for operational testing — students should assume standard rules apply."
        ]
      },
      {
        id: "pedagogy",
        heading: "Pedagogy tips",
        paragraphs: [
          "If you are new, read First Steps and Preconfigure Project in Docs before your first start — it prevents most packaging failures.",
          "Use the guided tour the first time you open the workspace; you can skip it and still reread this document later."
        ],
        bullets: [
          "Treat each run as a single delivery: build, verify locally, then upload a clean ZIP.",
          "If time expires, you will need a new run when eligible — do not rely on pausing."
        ]
      }
    ]
  },
  {
    id: "submitting-a-challenge",
    title: "Submitting a challenge",
    summary: "ZIP rules, pipeline expectations, and what to do while your submission is processing.",
    readTime: "7 min",
    sections: [
      {
        id: "zip",
        heading: "ZIP packaging",
        paragraphs: [
          "Upload a single `.zip` archive. The build expects a Maven project with `pom.xml` at the root of the archive — not nested inside an extra folder unless the challenge explicitly allows it.",
          "Remove secrets, local paths, and unnecessary binaries. The sandbox builds from scratch."
        ],
        bullets: [
          "Drag and drop onto the panel or click to browse — only `.zip` is accepted.",
          "Confirm structure locally: unzip into a clean folder and run `mvn clean package` before uploading.",
          "If you replace the file, review the filename and size shown in the panel before submitting."
        ]
      },
      {
        id: "pipeline",
        heading: "What the pipeline does",
        paragraphs: [
          "After upload, the platform builds your project, runs the candidate API, and executes automated HTTP tests against it. Scores combine functional, performance, and design signals plus an AI-assisted review block.",
          "Keep the tab open until processing completes — interrupting during upload or early build can fail the run and still consume limits."
        ],
        bullets: [
          "You will navigate to the submission detail page on success — from there open Results or Replay when available.",
          "Logs and timelines help you debug; use them before blindly resubmitting."
        ]
      },
      {
        id: "limits",
        heading: "Limits and cooldown",
        paragraphs: [
          "Students have per-challenge daily attempt budgets and cooldown between submissions. These protect ranking quality — see the counters at the top of the workspace.",
          "Plan retries: read the failure, fix the root cause, then submit again when allowed."
        ],
        bullets: [
          "UTC is authoritative for daily resets — check the copy on the limit banner for exact times.",
          "If you are blocked, use the wait time to read Docs or improve tests locally."
        ]
      }
    ]
  },
  {
    id: "errores-comunes",
    title: "Common Errors",
    summary: "Recurring submission failures, why they happen, and how to prevent them systematically.",
    readTime: "10 min",
    sections: [
      {
        id: "errores-build",
        heading: "Build and packaging errors",
        paragraphs: [
          "The most common failures are structural: malformed ZIP, POM outside root, unresolved dependencies. A short pre-check prevents most of them.",
          "Do not confuse build failures with business-logic failures. They are different categories and need different fixes."
        ],
        bullets: [
          "POM not found at ZIP root.",
          "Dependencies missing from `pom.xml`.",
          "Configurations that work only on your machine."
        ]
      },
      {
        id: "errores-http",
        heading: "HTTP contract errors",
        paragraphs: [
          "Many challenges fail because of contract details: wrong status code, incomplete payload, or inconsistent endpoint naming.",
          "Pipeline tests are strict because they simulate real consumers: small differences can still break compatibility."
        ],
        bullets: [
          "Returning `200` where `201` or `204` is expected.",
          "Not returning `404` for missing resources.",
          "JSON format different from challenge contract."
        ]
      },
      {
        id: "errores-diseno-rendimiento",
        heading: "Design and performance errors",
        paragraphs: [
          "A functional API can still lose points in design/performance if consistency, validation, and latency are weak.",
          "You do not need extreme optimization for a good score, but you do need solid and measurable technical choices."
        ],
        bullets: [
          "Insufficient validation or ambiguous error responses.",
          "Unnecessary queries or transformations on hot endpoints.",
          "Lack of robust exception handling."
        ]
      }
    ]
  },
  {
    id: "sistema-xp-elo",
    title: "XP and ELO System",
    summary: "Complete guide to classification, ELO gains/losses, and ranking strategy.",
    readTime: "16 min",
    sections: [
      {
        id: "xp",
        heading: "XP: cumulative progress",
        paragraphs: [
          "XP represents your overall platform progression. It grows when you complete and improve challenges, rewarding consistency and technical evolution.",
          "It is not just an attempt counter: the system values result quality and effective learning."
        ],
        bullets: [
          "Completing challenges unlocks baseline progression.",
          "Improving previous submissions adds extra progression.",
          "Spam submissions without real improvement are limited by anti-abuse rules."
        ]
      },
      {
        id: "elo",
        heading: "ELO: how it really works",
        paragraphs: [
          "ELO compares expected competitive performance versus real outcomes. It is not an activity counter; it estimates skill stability and penalizes low-value competitive choices.",
          "Each relevant submission compares expected outcome (based on your state and challenge context) against your real result. Beat expectations and you climb; underperform and you drop."
        ],
        bullets: [
          "Not every submission has equal impact: quality, consistency, and timing matter.",
          "Repeated mediocre submissions can erode ELO even if XP still increases.",
          "Climbing ELO requires real score improvement, not just attempt volume."
        ],
        visual: {
          type: "flow",
          title: "ELO calculation flow (simplified)",
          steps: [
            { label: "Compute expectation", hint: "Current level + challenge context" },
            { label: "Evaluate real result", hint: "Technical score + AI review" },
            { label: "Compare delta", hint: "Result - expectation" },
            { label: "Apply adjustment", hint: "Positive delta up / negative delta down" }
          ]
        }
      },
      {
        id: "clasificacion",
        heading: "How to classify and become ranked",
        paragraphs: [
          "For rankings to be statistically meaningful, a minimum amount of valid activity is needed. Before that, your state may remain preliminary.",
          "Classification does not depend on one brilliant run. It requires enough results for the system to estimate your level with less noise."
        ],
        bullets: [
          "Complete a minimum set of challenges with consistent results to leave the initial state.",
          "Avoid concentrating all activity in one challenge: diversification reduces noise.",
          "Build a submission history with progressive, non-random improvement."
        ]
      },
      {
        id: "que-suma-elo",
        heading: "What usually adds ELO (and why)",
        paragraphs: [
          "What adds the most is not submitting more, but submitting better. The system rewards robust technical decisions that produce high and repeatable scores.",
          "Winning strategy combines functional reliability, clean design, and good latency."
        ],
        bullets: [
          "Beat your previous best score on a challenge with a clearly stronger submission.",
          "Reduce HTTP contract errors (status/payload) and improve correctness.",
          "Maintain quality across multiple challenges, not just one.",
          "Submit when improvement is proven, not impulsive."
        ]
      },
      {
        id: "que-no-suma-elo",
        heading: "What does not help (or hurts) ELO",
        paragraphs: [
          "Some actions feel productive by activity alone, but add little competitive value. In ELO, marginal quality per submission matters a lot.",
          "Spamming attempts without substantial changes increases negative-delta risk and hurts your relative position even when XP grows slowly."
        ],
        bullets: [
          "Resubmitting nearly identical projects without measurable improvements.",
          "Ignoring cooldown/limits and sending immediately without review.",
          "Neglecting design and API errors while only aiming to compile.",
          "Optimizing for submission volume instead of real technical improvement."
        ],
        visual: {
          type: "checklist",
          title: "Anti-patterns to avoid",
          items: [
            { label: "Submitting without reviewing previous error logs", status: "warn" },
            { label: "Retrying with no changes in critical endpoints", status: "warn" },
            { label: "Optimizing one area while breaking another", status: "warn" },
            { label: "Validating functional + design + performance before submit", status: "ok" }
          ]
        }
      },
      {
        id: "mantener-elo",
        heading: "How to maintain and consolidate ELO over time",
        paragraphs: [
          "Maintaining high ELO does not mean avoiding risk. It means managing technical risk with discipline.",
          "Best long-term strategy: small iterations, consistent quality, and smart submission timing."
        ],
        bullets: [
          "Run a fixed pre-checklist before every submission (build, endpoints, errors, performance).",
          "When stuck, return to a stable baseline and rebuild in layers.",
          "Do not overtrain one challenge only; alternate to sustain overall level.",
          "Prioritize weekly consistency over isolated spikes."
        ]
      },
      {
        id: "score-mixto",
        heading: "Technical score + AI review",
        paragraphs: [
          "Final submission score combines technical evaluation and assisted review: 800 technical points + 200 AI review points.",
          "This measures both functional/performance compliance and implementation quality."
        ],
        bullets: [
          "Correctness, performance, and design define the core technical block.",
          "AI review adds qualitative analysis and recommendations.",
          "Best outcomes come from balancing technical reliability with implementation cleanliness."
        ],
        visual: {
          type: "score",
          title: "Score distribution for strong ELO",
          items: [
            { label: "Correctness + Performance + Design", value: 800, max: 1000, color: "cyan" },
            { label: "AI Review", value: 200, max: 1000, color: "purple" }
          ]
        }
      }
    ]
  }
];

export const DOC_BY_ID = DOC_DOCUMENTS.reduce((acc, doc) => {
  acc[doc.id] = doc;
  return acc;
}, {});
