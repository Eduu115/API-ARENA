# Database architecture plan (AA-115)

**Status: documentation only. No SQL has been applied. Do not run any statement in this document against production, against the live Docker volume, or against any database that holds real users.**

Phase 2 (the first `alter-*.sql`, dual-write, and rehearsal) is **blocked** until `origin/main` contains `.cursor/rules/api-arena-db-backup-and-migrations.mdc` (Task 0). Checked at plan time: that path is absent from `origin/main` (`7ebc813`).

This plan audits every Postgres table owned by every service. API Arena uses **one database** (`apiarena`) and **one login** (`apiarena_user` / `POSTGRES_USER`) for auth, challenge, submission, sandbox, testing, leaderboard, notification, and metrics. `ai-review-service` has no database. `multiplayer-service` does not exist.

`init-db.sql` runs only when the Postgres volume is created. It is not the live schema. Production also has objects created by loose scripts and by `DatabaseSchemaMigrationRunner` / `MetricsAggregationService` on boot. Those objects are in the inventory below. Folding them into `init-db.sql` is a later file-only change; it is not done in this PR.

## Rules that every later PR must follow

1. **Expand → backfill → switch reads → contract.** New tables and nullable columns land first. Application code dual-writes and can still read the old column. The old column stays until a later PR.
2. **`DROP COLUMN` / `DROP TABLE` of a source column is a separate PR marked `DO NOT APPLY` until the new read path has been verified in production and a fresh backup exists.** This document does not authorize those drops.
3. SQL is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `ADD COLUMN IF NOT EXISTS`). Statements run in a transaction except `CREATE INDEX CONCURRENTLY` (and `DROP INDEX CONCURRENTLY`), which cannot run inside a transaction block.
4. Each applied script has a paired `docker/postgres/rollback-NNN-*.sql`. Rollback of an expand deletes or ignores the new table. It does not delete the original JSON/TEXT column, so a rollback cannot drop a row that still lives in the source column.
5. Foreign keys to seed users use a NULL-safe subquery (`created_by = (SELECT id FROM users WHERE username = 'profoak')`), never a hardcoded id.
6. The same DDL is copied into `docker/postgres/init-db.sql` in that PR so a new volume matches production. `backend/submission-service/src/main/resources/schema.sql` is a stale subset (no teacher columns, no `pipeline_total_score`, no FK on `replay_events`). Update it in the same PR or stop shipping it. Do not point Hibernate `defer-datasource-initialization` at it.
7. `ddl-auto=update` is on for every service except submission (`validate`). Hibernate must not be the migration tool. The first PR that touches a service sets that service to `validate` **after** the expand SQL is on the database the process will boot against. A global flip to `validate` before the schema matches the entities will refuse to start.
8. No array, `jsonb` list, or comma-separated `TEXT` column is introduced. A 1-N or N-N relationship is a table and a foreign key.
9. JSONB remains only where this document writes a justification (opaque payload, not queried by element). Known keys become columns or child rows.
10. Rehearsal is a restore into `apiarena_migration_test` only. `EXPLAIN (ANALYZE, BUFFERS)` runs there, never on production. Never `docker compose down -v`, `docker volume rm`, or `docker volume prune`.
11. Deploy order for a data block: fresh backup (Task 0) → rehearsal counts → empty expand on the copy → application build that dual-writes → backfill → row-count check → smoke of the REST shapes below → rollback drill on the copy. Code that only reads the old column may ship before the backfill. Code that requires the new table must ship after the empty table exists.
12. REST JSON field names, nesting, and null-vs-empty behavior stay as they are. The database change is invisible to the SPA, to Kafka `apiarena.submissions.completed`, and to internal HTTP between services.

There is **no comma-separated list column** in Postgres. `split(",")` in Java is only for `X-Forwarded-For` and `Accept-Language`. Teacher feedback accepts a newline-separated string in the request body and stores a JSON array; that array is block B10.

## Inventory

| Table | Owner | Created by | Verdict |
|---|---|---|---|
| `users` | auth | `init-db.sql` + ALTERs + Java runner | Relational. Harden types, CHECKs, secrets, indexes. No list column. |
| `refresh_tokens` | auth | `init-db.sql` | Already a child table. Token column is a SHA-256 hash. Harden timestamps. |
| `categories` | challenge | `init-db.sql` | Relational. `description` is prose. |
| `challenges` | challenge | `init-db.sql` | **Normalize** eight JSONB columns (B02–B06). |
| `teacher_groups` | auth | `init-db.sql` | Relational. `description` is prose. |
| `teacher_group_members` | auth | `init-db.sql` | Already the N-N bridge. |
| `friendships` | auth | `init-db.sql` | Relational. Has `CHECK (user_low_id < user_high_id)` and a pair unique. Add status CHECK (B17). |
| `sandbox_executions` | sandbox | `init-db.sql` | Relational logs. Missing FK to `submissions`. |
| `leaderboard_entries` | leaderboard | `init-db.sql` | Relational. `submission_id` has no FK. Denormalized `username` stays (snapshot at rank time; documented below). |
| `submissions` | submission | `init-db.sql` | **Normalize** teacher JSON and AI JSON (B07–B12). Four JSONB columns have no Java writer. |
| `replay_events` | submission | `init-db.sql` | **Normalize** `metadata` (B13). `message` stays TEXT. |
| `test_results` | testing | `init-db.sql` | Headers are maps (B14). Bodies and expected/actual text stay opaque TEXT. |
| `notifications` | notification | `init-db.sql` | **Normalize** `metadata_json` TEXT (B15). `body` stays TEXT. |
| `docs_feedback` | metrics | `init-db.sql` + JDBC on boot | Relational. Missing FK. No retention (GDPR note). |
| `product_events` | metrics | `init-db.sql` + JDBC on boot | `properties_json` stays opaque (B16 justification). |
| `achievement_definitions` | auth | `init-db.sql` | Relational catalog. Tier CHECK (B17). |
| `user_achievements` | auth | `init-db.sql` | Already the unlock bridge. |
| `profile_badge_definitions` | auth | `init-db.sql` | Relational catalog. |
| `user_profile_badges` | auth | `init-db.sql` | Already the ownership bridge (`displayed` is a column, not an array on `users`). |
| `user_streak_state` | auth | `init-db.sql` | Relational, PK = `user_id`. |
| `user_weekly_progress` | auth | `init-db.sql` | Relational. `qualified_via` CHECK (B17). |
| `user_weekly_streak_challenges` | auth | `init-db.sql` | Already the anti-repeat bridge. Missing FK to `challenges`. |
| `admin_permissions` | auth | `create-admin-permissions.sql` + entity. **Not in `init-db.sql`.** | Already one row per admin × capability. Add a capability catalog instead of a CHECK (B17). |
| `account_deletions` | auth | `create-account-deletions.sql` + entity. **Not in `init-db.sql`.** | `snapshot` stays opaque (justification below). |
| `moderation_record` | auth | **Java runner only.** Not in `init-db.sql`. | Relational. Missing FK. |
| `admin_audit_log` | auth | **Java runner only.** Not in `init-db.sql`. | Relational. `detail` is a short prose string. Missing FK. |

Columns that exist on the entity or in an alter script but are easy to miss on a fresh volume: `users.deactivated_at`, `users.warnings`, `users.ban_reason`, `users.banned_at`, `users.banned_until`, `users.totp_secret`, `users.totp_enabled`. Production has them if auth-service has booted since those runners shipped. A new volume does not, until the runner executes.

### Non-Postgres stores (audited, not redesigned here)

| Store | What it holds | Plan |
|---|---|---|
| MongoDB `replay_archives` | Opt-in mirror of `replay_events`, including `metadata`. | When B13 changes the Postgres shape, the mirror writer must persist the same logical event. Do not treat Mongo as the source of truth. Retention stays 30 days (`docs/GDPR-RAT.md` §2.2). |
| InfluxDB `submission_pipeline` | Duration, score, status. | Time series. No relational normalization. |
| Redis | Rate-limit counters and submission status cache. | Ephemeral. No relational normalization. |

### JSONB that stays, with a justification

| Column | Why it is not a table |
|---|---|
| `account_deletions.snapshot` | GDPR archive of `exportUserData`. The row is kept whole and purged by `purge_after`. No query filters inside the document. Export already omits `password_hash`, `totp_secret`, and raw tokens. |
| `product_events.properties_json` | Open bag supplied by the caller (`POST /api/metrics/events`). Keys are not a closed schema and are not joined. B16 only changes the storage type and adds a quarantine so a bad string cannot be lost. |
| `submissions.build_logs`, `test_logs`, `error_message`, `dockerfile`; `sandbox_executions.build_logs`, `runtime_logs`, `error_message`; `test_results.request_body`, `response_body`, `expected_result`, `actual_result`, `error_message`; `notifications.body`; `challenges.description`, `solution_explanation`; bios and group descriptions | Opaque prose or HTTP/log payloads. Not lists. |

`leaderboard_entries.username` is a denormalized copy written when the score is recorded, so a rename does not rewrite history. It is not a list. Leave it. Do not add a FK that would require the leaderboard role to own `users`.

## Ordered blocks

Highest value and lowest risk first. Phase 2, once Task 0 is on `main`, implements **only B02** (the first expand + backfill). B01 is indexes and does not backfill a column. Suggested branch for B02: `feat/db-challenge-required-endpoints`.

### B01 — Hot-path indexes

**Current state.** Single-column indexes exist for `submissions(user_id)`, `submissions(challenge_id)`, `challenges(difficulty|category_id|featured|slug)`, `leaderboard_entries(challenge_id, rank)`, `notifications(user_id, created_at DESC)`. `schema.sql` also creates `idx_submissions_status` and `idx_submissions_created_at`, but `init-db.sql` does not, so production may lack them. Catalog and teacher queries filter on composites those indexes do not cover. Admin user search and challenge search are `LOWER(col) LIKE '%' || q || '%'`, which a btree cannot serve.

**New DDL** (each statement outside a transaction; `IF NOT EXISTS`):

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_created
    ON submissions (user_id, created_at DESC, id DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_challenge_created
    ON submissions (user_id, challenge_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_challenge_status_completed
    ON submissions (challenge_id, status, completed_at DESC, id DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_zip_retention
    ON submissions (created_at) WHERE zip_file_path IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_best_completed
    ON submissions (user_id, challenge_id, total_score DESC)
    WHERE status = 'COMPLETED';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_active_created
    ON challenges (created_at DESC) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_active_difficulty
    ON challenges (difficulty, id) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_active_category
    ON challenges (category_id, id) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_active_featured
    ON challenges (id) WHERE is_active = TRUE AND featured = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_author_created
    ON challenges (created_by, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_challenge_score
    ON leaderboard_entries (challenge_id, score DESC, completion_time_seconds ASC NULLS LAST);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_user_score
    ON leaderboard_entries (user_id, score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_importance
    ON notifications (user_id, importance, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_student_elo
    ON users (rating DESC, experience_points DESC, id)
    WHERE role = 'STUDENT' AND is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_student_level
    ON users (level DESC, experience_points DESC, id)
    WHERE role = 'STUDENT' AND is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_events_user_time
    ON product_events (user_id, occurred_at DESC) WHERE user_id IS NOT NULL;
```

Trigram indexes for admin search and challenge search are a **rehearsal-gated** add-on, not part of the first apply. They need `CREATE EXTENSION IF NOT EXISTS pg_trgm` and:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_trgm
    ON users USING gin (lower(username) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_trgm
    ON users USING gin (lower(email) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_title_trgm
    ON challenges USING gin (lower(title) gin_trgm_ops);
```

Add the description trigram only if rehearsal `EXPLAIN` of `ChallengeRepository.searchChallenges` shows the title index is not enough. Do not add it speculatively on production.

**Backfill.** None.

**JPA / services.** None. Queries already in `SubmissionRepository` (`findByUserIdOrderByCreatedAtDesc`, attempt counts, best completed, `findByChallengeIdInAndStatusOrderByCompletedAtDescIdDesc`), `ChallengeRepository` (active/featured/difficulty/category/`created_by`/`searchChallenges`), `LeaderboardEntryRepository` (per-challenge order by score, global `SUM(score)`), `NotificationRepository` (unread and importance pages), `UserRepository.adminSearch` and the ELO/level leaderboard queries, `ZipRetentionService`.

**REST.** Unchanged.

**Risk.** Low. Extra indexes slow writes on `submissions` and `users`. Invalid concurrent indexes must be checked (`pg_index.indisvalid`) on the rehearsal copy before the same statements are considered. Trigram is optional because the extension and the GIN size are the only moving parts.

**Deploy.** Rehearsal `EXPLAIN` without `ANALYZE` is not enough; use `EXPLAIN (ANALYZE, BUFFERS)` on `apiarena_migration_test` only. Then the maintainer runs the concurrent creates. No service rebuild.

**Rollback.** `DROP INDEX CONCURRENTLY IF EXISTS` for each new name. Do not drop the pre-existing indexes in this block.

### B02 — `challenges.required_endpoints` → `challenge_required_endpoints`

**This is the first expand + backfill.** Branch example: `feat/db-challenge-required-endpoints`.

**Current state.** `challenges.required_endpoints JSONB`, mapped as `Map<String, Object>` on `Challenge`. Seed and `CreateChallenge.jsx` write:

```json
{"items":[{"method":"GET","path":"/api/books","description":"","expectStatus":200}]}
```

`description` comes from the teacher form. `expectStatus` is on the EXTREME seed and is read by `TestingService.parseExpectStatus`. `body` / `jsonBody` are read by `TestingService` when present. `submission-service` copies this object into the testing payload as `testSuite.requiredEndpoints`. Public preview (`ChallengePreviewDTO`) does not include it. `GET /api/challenges/{id}/specs` and the teacher create/update body do.

**New DDL.**

```sql
CREATE TABLE IF NOT EXISTS challenge_required_endpoints (
    id            BIGSERIAL PRIMARY KEY,
    challenge_id  BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    position      INTEGER NOT NULL CHECK (position >= 0),
    http_method   VARCHAR(16) NOT NULL,
    path          VARCHAR(500) NOT NULL,
    expect_status INTEGER,
    description   TEXT,
    request_body  TEXT,
    CONSTRAINT uq_challenge_required_endpoints_pos UNIQUE (challenge_id, position),
    CONSTRAINT ck_challenge_required_endpoints_method CHECK (
        http_method IN ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS','WS','WEBSOCKET')
    ),
    CONSTRAINT ck_challenge_required_endpoints_status CHECK (
        expect_status IS NULL OR (expect_status BETWEEN 100 AND 599)
    )
);
CREATE INDEX IF NOT EXISTS idx_challenge_required_endpoints_challenge
    ON challenge_required_endpoints (challenge_id, position);
```

Unknown keys on an item (anything other than `method`, `path`, `expectStatus`, `description`, `body`, `jsonBody`) go to a second table so the backfill cannot drop them:

```sql
CREATE TABLE IF NOT EXISTS challenge_required_endpoint_attrs (
    id           BIGSERIAL PRIMARY KEY,
    endpoint_id  BIGINT NOT NULL REFERENCES challenge_required_endpoints(id) ON DELETE CASCADE,
    attr_key     VARCHAR(100) NOT NULL,
    attr_value   TEXT NOT NULL,
    CONSTRAINT uq_challenge_required_endpoint_attrs UNIQUE (endpoint_id, attr_key)
);
```

`request_body` stores `body` if present, otherwise `jsonBody`. The DTO assembler emits the original key (`body` or `jsonBody`) so the testing service does not change.

**Backfill.** For each challenge where `required_endpoints` is not null:

- Accept either `{"items":[...]}` or a bare JSON array.
- `jsonb_array_elements` … `WITH ORDINALITY` supplies `position` (0-based, to match list order).
- Skip a non-object element only after copying its raw text into `challenge_required_endpoint_attrs` is impossible; instead **abort the rehearsal** if `jsonb_typeof` is not `object`, `array`, or `null`. Do not skip a challenge silently.
- Rows already inserted by dual-write use `ON CONFLICT (challenge_id, position) DO NOTHING` only when the method and path match. A mismatch aborts.
- Empty `items` inserts zero rows and is success.
- Count check: for every challenge, `jsonb_array_length` of the items array equals `COUNT(*)` from the new table. Challenges with SQL `NULL` must have zero child rows unless dual-write has since added some (compare against a snapshot taken at the start of the backfill, not against a live writer). Run the backfill in a transaction. Dual-write during the transaction is safe if the conflict rule above holds.

**JPA / services.** `Challenge` keeps the JSON column and gains `List<ChallengeRequiredEndpoint>` (`LAZY`). `ChallengeService.create/update` writes both. `ChallengeDTO.fromEntity` builds `requiredEndpoints` as `{"items":[...]}` from the child rows when any exist, otherwise from the JSON column. `CreateChallengeRequest` / `UpdateChallengeRequest` stay `Map<String, Object>`. `TestingService` and `SubmissionService` stay unchanged while the specs JSON shape is unchanged.

**REST that must stay stable.**

- `GET /api/challenges/{id}/specs`, `GET /api/challenges/{id}`, `GET /api/challenges/slug/{slug}`: `requiredEndpoints.items[]` keeps `method`, `path`, and when present `description`, `expectStatus`, `body` or `jsonBody`.
- `GET /api/challenges/{id}/preview` and slug preview: still omit specs.
- `POST /api/challenges`, `PUT /api/challenges/{id}`: request body still accepts the map.

**Risk.** Low. Catalog-sized table (one row per endpoint per challenge). Failure mode is a shape the seed does not use. The rehearsal typeof gate stops that before any production statement. Scoring changes only if the assembler drops `expectStatus` or reorders `position`.

**Deploy.** Empty `CREATE TABLE` → deploy challenge-service dual-write (`validate` after the table exists) → backfill → count check → open one specs response and compare to the JSON column → rollback drill drops the new tables only.

**Rollback.** `rollback-002` drops `challenge_required_endpoint_attrs` and `challenge_required_endpoints`. The JSON column is untouched. Redeploy the previous challenge-service image.

### B03 — `hints` and `learning_objectives`

**Current state.** Both are JSONB `{"items":["..."]}` (seed and `CreateChallenge.jsx`). Display-only on the specs screen. Not read by the scorer.

**New DDL.**

```sql
CREATE TABLE IF NOT EXISTS challenge_hints (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL CHECK (position >= 0),
    body         TEXT NOT NULL,
    CONSTRAINT uq_challenge_hints_pos UNIQUE (challenge_id, position)
);
CREATE TABLE IF NOT EXISTS challenge_learning_objectives (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL CHECK (position >= 0),
    body         TEXT NOT NULL,
    CONSTRAINT uq_challenge_learning_objectives_pos UNIQUE (challenge_id, position)
);
```

If an element is a `{"text":"..."}` object (the form's in-memory row before it is flattened), store `text`. Abort rehearsal if any element is neither a string nor an object with a string `text`.

**Backfill.** Same ordinality and count check as B02, one table at a time, two transactions.

**JPA / services.** `Challenge`, `ChallengeService`, `ChallengeDTO`. Specs assembler returns `{"items":["..."]}` in `position` order.

**REST.** `hints` and `learningObjectives` on specs and on create/update stay maps with an `items` array of strings. Preview still omits them.

**Risk.** Low. No scoring dependency.

**Deploy.** Same expand pattern as B02. Can ship in one PR after B02 or as its own PR. Do not combine with B02 if that makes the review harder; the blocks are independent.

**Rollback.** Drop the two new tables. JSON columns remain.

### B04 — `required_status_codes` and `required_headers`

**Current state.** JSONB maps. The teacher form writes:

- `requiredStatusCodes.items[]`: `code` (string), `for`, `description`
- `requiredHeaders.items[]`: `name`, `value`, `required` (boolean)

`TestingService` does not read these columns today. They are still part of the specs contract and must not be dropped or reshaped.

**New DDL.**

```sql
CREATE TABLE IF NOT EXISTS challenge_required_status_codes (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL CHECK (position >= 0),
    status_code  VARCHAR(16) NOT NULL,
    applies_to   TEXT,
    description  TEXT,
    CONSTRAINT uq_challenge_required_status_pos UNIQUE (challenge_id, position)
);
CREATE TABLE IF NOT EXISTS challenge_required_headers (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL CHECK (position >= 0),
    header_name  VARCHAR(200) NOT NULL,
    header_value TEXT,
    required     BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_challenge_required_headers_pos UNIQUE (challenge_id, position)
);
```

`applies_to` is the JSON key `for` (a reserved word). The DTO key stays `for`.

**Backfill.** Same `items` ordinality rule. Abort if the value is not null, object-with-items, or a bare array. Unknown keys go to `challenge_spec_overflow (challenge_id, source, position, attr_key, attr_value)` with `source IN ('STATUS_CODE','HEADER')` so nothing is discarded.

**JPA / services.** `Challenge`, `ChallengeService`, `ChallengeDTO` only.

**REST.** Specs and create/update maps unchanged. Preview still omits them.

**Risk.** Low. Not on the scoring path. The overflow table is what keeps an odd teacher-authored key.

**Deploy / rollback.** Same as B02. Rollback drops the new tables only.

### B05 — `performance_requirements`

**Current state.** Teacher form stores an arbitrary string map via name/value pairs. `TestingService.runPerformanceHttpTests` reads numeric `maxAvgLatencyMs` (default 55) and `minRps` (default 450). Any other key is stored and returned on specs and ignored by the scorer.

**New DDL.** Known keys as columns on a 1:1 row (a challenge has one performance spec, not a list). Other keys as a child table, not JSON.

```sql
CREATE TABLE IF NOT EXISTS challenge_performance_specs (
    challenge_id       BIGINT PRIMARY KEY REFERENCES challenges(id) ON DELETE CASCADE,
    max_avg_latency_ms NUMERIC(10,2),
    min_rps            NUMERIC(10,2)
);
CREATE TABLE IF NOT EXISTS challenge_performance_spec_attrs (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    attr_key     VARCHAR(100) NOT NULL,
    attr_value   TEXT NOT NULL,
    CONSTRAINT uq_challenge_performance_spec_attrs UNIQUE (challenge_id, attr_key)
);
```

**Backfill.** If the JSON is a flat object, copy the two known keys when they parse as numbers. Non-numeric values for those keys stay in the attr table and the DTO still returns them (do not coerce and lose the original text). Nested objects or arrays abort the rehearsal; the teacher UI does not emit them, and a silent flatten would drop structure.

**JPA / services.** `Challenge`, `ChallengeService`, `ChallengeDTO`. `TestingService` keeps reading the map the specs endpoint already returns.

**REST.** `performanceRequirements` remains a flat JSON object.

**Risk.** Low-medium. A bad coerce would change a score target. The "non-numeric stays in attrs and is still returned" rule prevents that.

**Deploy / rollback.** Expand, dual-write, backfill, compare the assembled object to the JSON column on every challenge (text-equal after key sort). Rollback drops the new tables.

### B06 — `design_criteria` and `test_suite`

**Current state.** Both are flat name/value objects from `buildObjFromPairs` in `CreateChallenge.jsx`. `designCriteria` is passed into `DesignAnalysisRequest` and **not read** by `runDesignHttpChecks` (the design checks are hardcoded). `test_suite` on the challenge row is that flat map. Separately, `SubmissionService` builds the testing request by copying the stored `testSuite` and then `putIfAbsent("requiredEndpoints", requiredEndpoints)`. `TestingService.resolveEndpointSpecs` looks at `testSuite.endpoints`, `testSuite.items`, and `testSuite.requiredEndpoints`. So a teacher can also paste a structured suite through the raw JSON fields on the create form.

**New DDL.** Do not force this into endpoint rows. That would destroy flat pairs and would also miss a real endpoint list.

```sql
CREATE TABLE IF NOT EXISTS challenge_spec_pairs (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    spec_kind    VARCHAR(24) NOT NULL,
    position     INTEGER NOT NULL CHECK (position >= 0),
    pair_key     VARCHAR(200) NOT NULL,
    pair_value   TEXT,
    CONSTRAINT ck_challenge_spec_pairs_kind CHECK (spec_kind IN ('DESIGN','TEST_SUITE')),
    CONSTRAINT uq_challenge_spec_pairs UNIQUE (challenge_id, spec_kind, pair_key)
);
```

When the JSON value is an array or object (the raw-JSON path), store one row per top-level key whose value is a scalar, and store non-scalar values in:

```sql
CREATE TABLE IF NOT EXISTS challenge_spec_pair_nodes (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    spec_kind    VARCHAR(24) NOT NULL,
    json_path    TEXT NOT NULL,
    node_json    JSONB NOT NULL,
    CONSTRAINT ck_challenge_spec_pair_nodes_kind CHECK (spec_kind IN ('DESIGN','TEST_SUITE'))
);
```

**Justification for `node_json`:** a teacher-pasted `testSuite.endpoints` array is itself a list, but its schema is not closed (the same keys as B02, plus anything the raw editor accepts). Putting that list into `node_json` would violate the no-JSON-list rule. Rehearsal must classify every non-null `test_suite` / `design_criteria`:

- Flat scalar map → `challenge_spec_pairs` only. `node_json` unused.
- Value contains `endpoints` or `items` as an array of `{method,path,...}` → those elements go through the **same** `challenge_required_endpoints` shape in a new table `challenge_test_cases` (columns identical to B02, plus `spec_kind`). They are not left inside JSON.
- Any other nested value → abort and extend the DDL in a follow-up. Do not invent a column for a shape this audit has not seen. Do not store it as JSON "temporarily" without a written justification in that follow-up.

`node_json` ships only if rehearsal finds a nested shape that is truly opaque (no `method`/`path` list and no scalar pairs). If rehearsal finds none, **do not create `challenge_spec_pair_nodes`.**

**Backfill.** Classify, then insert. Count of scalar keys plus count of extracted endpoint elements must account for every top-level key.

**JPA / services.** `Challenge`, `ChallengeService`, `ChallengeDTO`. Submission and testing keep consuming the assembled maps.

**REST.** `designCriteria` and `testSuite` stay JSON objects of the same shape the client saved.

**Risk.** Medium. This is the first block where production may contain a shape the teacher UI and the seed do not show, because the raw JSON box accepts anything. The abort-on-unknown rule is the data-loss control.

**Deploy / rollback.** Rehearsal classification query is mandatory before the CREATE is considered final. Rollback drops the new tables.

### B07 — `teacher_zone_notes`

**Current state.** JSONB object, default `'{}'`. `SubmissionService.sanitizeTeacherZoneNotes` keeps only `correctness`, `performance`, `design`, `aiReview` (max 4000 chars). `computeTeacherCorrectionComplete` treats any non-blank value as a completed correction. Returned on `SubmissionDTO.teacherZoneNotes`.

**New DDL.** Fixed keys are columns, not a map and not a row-per-key table (the key set is closed and tiny).

```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_note_correctness TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_note_performance TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_note_design TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_note_ai_review TEXT;
```

**Backfill.** Copy the four keys. If any other key exists, abort rehearsal and add a column only after a product decision. Do not stuff leftovers into JSON.

**JPA / services.** `Submission`, `saveTeacherSubmissionReview`, `computeTeacherCorrectionComplete`. Dual-write the JSON object and the columns. Read columns when any of the four is non-null or when a new `teacher_zone_notes_migrated BOOLEAN` flag is true; otherwise read JSON. The flag is set per row at backfill so an empty note (all null) is distinguishable from "not migrated".

**REST.** `teacherZoneNotes` remains a string map with those four camelCase keys. `PUT /api/submissions/{id}/teacher/submission-review` body unchanged. `teacherCorrectionComplete` stays a boolean on teacher list DTOs.

**Risk.** Low. Closed key set. Empty-object vs null must stay `{}` on the wire when the teacher saved an empty map (`@Builder.Default` is an empty map).

**Deploy / rollback.** Expand columns (nullable, no default) → dual-write → backfill → flag. Rollback drops the four columns and the flag. JSON remains the source until the contract PR.

### B08 — `teacher_penalties`

**Current state.** JSONB array, default `'[]'`. Each element is a known object written by `appendPenaltyEntries`: `id` (UUID string), `confirmedAt`, `presetKey`, `label`, `pointsDeducted`, `requestedPenalty`, `note`, `customDescription` (only `OTHER`), `teacherId`, `appliedAt`. Revoke looks up `id` and the teacher. Legacy rows without `id` cannot be revoked (current API behavior). Preset keys are the Java map in `SubmissionService` (`TEACHER_PRESET_PENALTIES`).

**New DDL.**

```sql
CREATE TABLE IF NOT EXISTS submission_teacher_penalties (
    id                  BIGSERIAL PRIMARY KEY,
    submission_id       BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    position            INTEGER NOT NULL CHECK (position >= 0),
    penalty_uid         VARCHAR(64),
    preset_key          VARCHAR(40) NOT NULL,
    label               VARCHAR(200) NOT NULL,
    points_deducted     NUMERIC(6,2) NOT NULL,
    requested_penalty   NUMERIC(6,2) NOT NULL,
    note                TEXT,
    custom_description  TEXT,
    teacher_id          BIGINT,
    confirmed_at        TIMESTAMPTZ,
    applied_at          TIMESTAMPTZ,
    CONSTRAINT uq_submission_teacher_penalties_pos UNIQUE (submission_id, position)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_submission_teacher_penalties_uid
    ON submission_teacher_penalties (submission_id, penalty_uid)
    WHERE penalty_uid IS NOT NULL;
```

`penalty_uid` is nullable on purpose so legacy objects without `id` still migrate and stay non-revocable. `teacher_id` is not a FK in this block: a deleted teacher account must not delete the audit line. Store the id as a plain bigint, matching today's JSON.

**Backfill.** Ordinal from the array. Abort if an element is not an object or lacks `presetKey`, `label`, `pointsDeducted`, and `requestedPenalty`. Count check against `jsonb_array_length`. Do not recompute `total_score`.

**JPA / services.** `SubmissionService` penalty apply, batch confirm, revoke, and `computeTeacherCorrectionComplete`. `SubmissionDTO.teacherPenalties` is still `List<Map<String,Object>>` built from the table when the row has been migrated.

**REST.** `POST .../teacher/penalty`, `POST .../teacher/penalties/confirm`, `DELETE .../teacher/penalty/{penaltyId}`, and the `teacherPenalties` array on `GET /api/submissions/{id}` keep the same keys, including `id`.

**Risk.** Medium. These rows change `total_score` in the same transaction as the JSON write today. Dual-write must be the same transaction. A partial backfill that the revoke path reads would let a teacher remove a penalty the score still includes, or the reverse. Gate the read-switch on a per-submission migrated flag, set only after that submission's array length matches.

**Deploy.** Table first → dual-write (JSON remains authoritative for reads) → backfill → set flag → then a later commit flips the read. Do not flip the read in the same deploy as the first backfill unless the count check passed on the rehearsal copy and the production count check is in the same maintenance step before traffic.

**Rollback.** Drop the new table and ignore the flag column. JSON remains. Do not recompute scores on rollback.

### B09 — `teacher_score_bonuses`

**Current state.** JSONB array, default `'[]'`. Elements from `buildTeacherBonusRowsFromRequest`: `id`, `pointsAdded`, optional `label`, optional `note`, `teacherId`, `updatedAt`. Sum is capped so `total_score` cannot exceed 1000. Empty array means no bonus lines.

**New DDL.** `submission_teacher_bonuses` with `submission_id`, `position`, `bonus_uid VARCHAR(64) NOT NULL`, `points_added NUMERIC(6,2) NOT NULL CHECK (points_added > 0)`, `label`, `note`, `teacher_id`, `updated_at TIMESTAMPTZ`, unique `(submission_id, position)` and unique `(submission_id, bonus_uid)`.

**Backfill.** Same ordinal and count rules. Abort if `id` or `pointsAdded` is missing (the writer always sets both). Do not recompute `total_score`.

**JPA / services.** `saveTeacherSubmissionReview`, `sumTeacherBonusPointsJson`, `SubmissionDTO.teacherScoreBonuses`.

**REST.** `PUT .../teacher/submission-review` bonuses array and the response field stay a list of those keys.

**Risk.** Medium, same score-coupling as B08. Same migrated-flag gate.

**Deploy / rollback.** Same pattern as B08. Rollback drops the table only.

### B10 — `teacher_structured_feedback`

**Current state.** JSONB object or null. `sanitizeTeacherStructuredFeedback` keeps `summary` (text, max 4000) plus `strengths` and `suggestions` (string lists, max 30 lines, 400 chars). `computeTeacherCorrectionComplete` treats a non-blank summary or a non-empty list as complete.

**New DDL.**

```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_feedback_summary TEXT;
CREATE TABLE IF NOT EXISTS submission_teacher_feedback_lines (
    id            BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    line_kind     VARCHAR(16) NOT NULL,
    position      INTEGER NOT NULL CHECK (position >= 0),
    body          TEXT NOT NULL,
    CONSTRAINT ck_teacher_feedback_line_kind CHECK (line_kind IN ('STRENGTH','SUGGESTION')),
    CONSTRAINT uq_teacher_feedback_line_pos UNIQUE (submission_id, line_kind, position)
);
```

**Backfill.** Summary column plus one row per list element. A migrated flag distinguishes "no feedback" from "not migrated". Abort on keys other than `summary`, `strengths`, `suggestions`, or on non-string list elements.

**JPA / services.** `saveTeacherSubmissionReview`, `hasMeaningfulStructuredTeacherFeedback`, `SubmissionDTO.teacherStructuredFeedback`.

**REST.** The field stays `{summary, strengths:[], suggestions:[]}` with absent keys omitted when empty, matching `sanitizeTeacherStructuredFeedback` (it omits empty lists). Do not start returning empty arrays if the old code omitted the key.

**Risk.** Low-medium. Teacher queue boolean depends on it. The flag gate covers that.

**Deploy / rollback.** Expand, dual-write, backfill, flag. Rollback drops the table and the summary column.

### B11 — `ai_suggestions`

**Current state.** JSONB object written only by `persistAiReview`. Keys from `runAiReview`: `provider`, `summary`, `overallScore`, `performanceScore`, `aestheticsScore`, `cleanlinessScore`, `structureScore`, `strengths` (string list), `suggestions` (string list), `diagnostics` (object; failure path is `{reason}`). The SPA reads this via `normalizeAiReview` on submission detail and results. `aiReviewScore` is already a numeric column and is not part of this JSON.

**New DDL.** 1:1 `submission_ai_reviews (submission_id PK, provider, summary, overall_score, performance_score, aesthetics_score, cleanliness_score, structure_score)` plus `submission_ai_review_lines (submission_id, line_kind STRENGTH|SUGGESTION, position, body)` plus `submission_ai_review_diagnostics (submission_id, attr_key, attr_value)` for scalar diagnostic keys. If `diagnostics` contains a nested object, abort rehearsal and add the justification before storing JSON.

**Backfill.** One review row per submission where `ai_suggestions` is a non-null object. Lists become lines. Count lines against `jsonb_array_length`. Do not invent a review row for SQL NULL.

**JPA / services.** `SubmissionService.persistAiReview` and `SubmissionDTO.aiSuggestions`. Disabled and failed outcomes (`AiReviewOutcome.disabled` / `failed`) dual-write the same shape they write today.

**REST.** `aiSuggestions` on `GET /api/submissions/{id}` and results stays the same object. Internal `POST /internal/ai-review/analyze` is not a database contract; leave it.

**Risk.** Medium. Every completed submission after AI review writes this. A dual-write bug shows up as an empty AI panel. Compare assembled JSON to the column on rehearsal for every non-null row before switching reads.

**Deploy / rollback.** Same flag-gated read switch as B08. Rollback drops the new tables.

### B12 — Unused submission JSONB (`environment_vars`, `design_issues`, `endpoints_discovered`, `replay_data`)

**Current state.** All four are mapped on `Submission` and present in `init-db.sql` / `schema.sql`. **No Java writer and no Java reader** references them (`setEnvironmentVars`, `setDesignIssues`, `setEndpointsDiscovered`, `setReplayData` do not exist). `replay_data` is not the timeline; the timeline is `replay_events`. Historical jars or manual SQL may still have filled them.

**New DDL.** None until rehearsal runs, on the copy only:

```sql
SELECT
  count(*) FILTER (WHERE environment_vars IS NOT NULL)      AS environment_vars,
  count(*) FILTER (WHERE design_issues IS NOT NULL)         AS design_issues,
  count(*) FILTER (WHERE endpoints_discovered IS NOT NULL)  AS endpoints_discovered,
  count(*) FILTER (WHERE replay_data IS NOT NULL)           AS replay_data
FROM submissions;
```

Plus `jsonb_typeof` and `jsonb_object_keys` / array length for every non-null value.

- All four counts are 0 → no new table. A later contract PR may `DROP COLUMN` (**DO NOT APPLY** until a fresh backup and a production count of zero).
- Non-zero → design the child table from the actual keys, using the same rules as B02–B11. Do not guess a schema in advance. Scalar maps become key/value rows. Arrays of objects become typed tables only after the key set is written down. Abort rather than coerce.

**JPA / services.** Leave the fields mapped until the contract PR so `validate` does not fail. Do not start writing them.

**REST.** `SubmissionDTO` does not currently expose these four. Do not add them.

**Risk.** Low if the counts are zero. Unknown if they are not; that is why there is no DDL here.

**Deploy / rollback.** Inventory only. No production statement in the inventory PR.

### B13 — `replay_events.metadata`

**Current state.** JSONB map, nullable. `recordReplay` writes scalar values only. Keys by `event_type`:

| `event_type` | Keys |
|---|---|
| `SUBMISSION_CREATED` | `challengeId`, `userId` |
| `DEVELOPMENT_TIME_REPORTED` | `developmentTimeSeconds` |
| `CONTAINER_READY` | `candidateHost`, `port`, `candidateUrl` |
| `TEST_CASE_RESULT` | `testIndex`, `testName`, `status`, `actualResult`, `testType`, `executionTimeMs`, `requestMethod`, `requestPath`, `responseStatus` |
| `SCORE_FINALIZED` | `totalScore`, `technicalScore`, `correctnessScore`, `performanceScore`, `designScore`, `aiReviewScore` |
| `AI_REVIEW_COMPLETED` | `aiReviewScore`, `provider` |
| others | null metadata |

The replay UI filters and jumps using `testIndex`. GDPR retention deletes these rows after 30 days (`ReplayRetentionService`), Postgres and Mongo.

**New DDL.**

```sql
ALTER TABLE replay_events ADD COLUMN IF NOT EXISTS test_index INTEGER;
CREATE INDEX IF NOT EXISTS idx_replay_events_test_index
    ON replay_events (submission_id, test_index)
    WHERE test_index IS NOT NULL;

CREATE TABLE IF NOT EXISTS replay_event_attrs (
    id              BIGSERIAL PRIMARY KEY,
    replay_event_id BIGINT NOT NULL REFERENCES replay_events(id) ON DELETE CASCADE,
    attr_key        VARCHAR(80) NOT NULL,
    attr_value      TEXT NOT NULL,
    CONSTRAINT uq_replay_event_attrs UNIQUE (replay_event_id, attr_key)
);
CREATE INDEX IF NOT EXISTS idx_replay_event_attrs_event
    ON replay_event_attrs (replay_event_id);
```

`test_index` is a promoted copy of the attr `testIndex` so the hot filter is a column. The attr row still exists so the DTO map stays complete.

**Backfill.** One attr row per scalar key. `jsonb_typeof(value)` must be `string`, `number`, or `boolean`. Nested objects or arrays abort the rehearsal. Set `test_index` from the numeric attr. Volume can be large; backfill in batches of submission_id ranges, still idempotent (`ON CONFLICT DO NOTHING`). Do not run one unbounded transaction that locks the table for the retention job.

**JPA / services.** `ReplayEvent`, `SubmissionService.recordReplay`, `ReplayEventDTO`, `ReplayMongoArchiveService` (write the same map it writes today, assembled from attrs).

**REST.** `GET /api/submissions/{id}/replay` returns `metadata` as the same JSON object. Kafka payload does not include replay metadata.

**Risk.** Medium-high because of row volume, the retention delete, and the Mongo mirror. Dual-write in the same transaction as the event insert. Retention already deletes by submission; the FK `ON DELETE CASCADE` covers attr rows. A batch backfill must not deadlock the pipeline: use `FOR UPDATE SKIP LOCKED` or id ranges, and stop if the retention job is mid-delete (rehearse that overlap).

**Deploy.** Table and nullable column first → dual-write → batched backfill → count of attr rows equals count of object keys → then switch reads. Rollback drops `replay_event_attrs` and `test_index`. Mongo documents written during dual-write stay valid because they still store the map.

### B14 — `test_results.request_headers` and `response_headers`

**Current state.** JSONB maps on `TestResult`. No Java code sets them; tests persist method, path, bodies, and status as columns. Bodies stay TEXT (opaque HTTP payload).

**New DDL.** Same inventory as B12. If both counts are 0, do not create a table; contract-drop later (**DO NOT APPLY** until a production count of zero and a fresh backup). If not:

```sql
CREATE TABLE IF NOT EXISTS test_result_headers (
    id             BIGSERIAL PRIMARY KEY,
    test_result_id BIGINT NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    direction      VARCHAR(8) NOT NULL,
    position       INTEGER NOT NULL CHECK (position >= 0),
    header_name    VARCHAR(200) NOT NULL,
    header_value   TEXT,
    CONSTRAINT ck_test_result_headers_direction CHECK (direction IN ('REQUEST','RESPONSE')),
    CONSTRAINT uq_test_result_headers_pos UNIQUE (test_result_id, direction, position)
);
```

Multi-value headers stay multiple rows (position order). The DTO map, if any client ever sees it, joins values with the same comma rule HTTP uses only at the edge; until a reader exists, preserve one row per array element and do not join.

**JPA / services.** `TestResult`, `TestingService` (still not required to populate headers). `ddl-auto` for testing-service is `update`; switch that service to `validate` in this PR after the table exists, or Hibernate may create a competing shape.

**REST.** Test-result JSON returned inside the testing response and stored results must keep `requestHeaders` / `responseHeaders` as objects when they were non-null. Do not add them if they were null.

**Risk.** Low when empty. Medium if production has header maps the current source does not show.

**Deploy / rollback.** Inventory, then expand only if needed. Rollback drops `test_result_headers`.

Also in this block, after the header decision: `test_results.submission_id` is nullable in SQL and `NOT NULL` in JPA, and `created_at` has no NOT NULL in SQL. Backfill is a no-op if rehearsal finds zero null `submission_id`. Then `SET NOT NULL` only if the count is zero. That `SET NOT NULL` is a lock; do it in rehearsal first and keep it out of the header PR if the table is large.

### B15 — `notifications.metadata_json`

**Current state.** `TEXT` holding a JSON object. Keys by type:

| Type | Keys | Notes |
|---|---|---|
| `SUBMISSION_COMPLETED` | `submissionId`, `challengeId`, `score`, `username`, `completionTimeSeconds`, `challengeTitle` | `source_submission_id` already stores the submission id. Unique `(user_id, source_submission_id)` allows many NULLs, so other types are unaffected. |
| `TEACHER_SUBMISSION_REVIEW` | `submissionId`, `challengeId`, `challengeTitle` | |
| `ACHIEVEMENT_UNLOCKED` | `achievementCode`, `achievementTitle`, `tier` | Dedupe is `metadata_json LIKE` the fragment `"achievementCode":"<code>"`. |
| `NEW_CHALLENGE_PUBLISHED` | `challengeId`, `challengeTitle` | |

`body` stays TEXT. `read_at` / `created_at` are already `timestamptz`.

**New DDL.**

```sql
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS challenge_id BIGINT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS achievement_code VARCHAR(64);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata_title VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata_username VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata_score NUMERIC(6,2);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata_completion_seconds INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata_tier VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_notifications_achievement_dedupe
    ON notifications (user_id, achievement_code)
    WHERE type = 'ACHIEVEMENT_UNLOCKED' AND achievement_code IS NOT NULL;
```

Do not add a FK from `challenge_id` or `source_submission_id` in this block. Submission GDPR delete must not fail because a notification still points at it, and the unique constraint must keep allowing NULL `source_submission_id`. A later FK, if added, is `ON DELETE SET NULL`.

**Backfill.** Parse `metadata_json`. Invalid JSON aborts that row's batch and copies the raw text into `notification_metadata_raw (notification_id PK, raw TEXT)` so the row is not lost and not forced through a cast. Valid JSON copies known keys. Unknown keys go to `notification_metadata_attrs (notification_id, attr_key, attr_value)`.

**JPA / services.** `Notification`, `NotificationService` (all four create methods), `existsByUserIdAndTypeAndMetadataJsonContaining` becomes `existsByUserIdAndTypeAndAchievementCode` after the flag flip. `NotificationDTO.metadata` is still a map assembled from the columns.

**REST.** `GET /api/notifications` metadata object keeps the same keys the SPA already reads (`submissionId`, `challengeId`, `challengeTitle`, `achievementCode`, and the rest).

**Risk.** Medium. The achievement dedupe is a string contains-check; a column that misses one code will send a duplicate notification. Count check: every `ACHIEVEMENT_UNLOCKED` row with a parseable code has `achievement_code` set, and the count of distinct `(user_id, achievement_code)` matches the distinct codes in the text.

**Deploy / rollback.** Columns first, dual-write, backfill, then switch the dedupe query. Rollback drops the new columns and the attr table; the TEXT column remains authoritative.

### B16 — `product_events.properties_json` (opaque, justified)

**Current state.** `TEXT`. `MetricsAggregationService.recordProductEvent` stores the caller string as-is. BI export returns it as `propertiesJson`. No query filters inside it. GDPR §2.5: product analytics, retention "según necesidad", client analytics still off. There is no purge job.

**Decision.** Keep one opaque document per event. Justification: the key set is defined by the caller, not by the server, and nothing joins or filters by key. A child table of unknown keys would be an EAV of an open bag with no reader.

**New DDL, only to stop using untyped TEXT for JSON.**

```sql
ALTER TABLE product_events ADD COLUMN IF NOT EXISTS properties_document JSONB;
```

**Backfill.** `properties_document = properties_json::jsonb` where the text is valid JSON and non-null. Invalid text stays in `properties_json` and is listed in rehearsal; do not delete it and do not coerce it. Dual-write fills both. Reads for export prefer `properties_document` and fall back to the text.

**JPA / services.** There is no JPA entity. `MetricsAggregationService` SQL only. `POST /api/metrics/events` and `GET /api/metrics/bi/export` keep the `propertiesJson` string field.

**Risk.** Low if almost every value is valid JSON. The invalid-text fallback is the data-loss control.

**Retention (GDPR, same block's written decision, separate apply).** Add `occurred_at` purge only after the RAT names a period. Do not delete event rows in the normalization PR. Propose 180 days in the RAT update, then a scheduled delete. That delete is not part of B16's expand.

**Rollback.** Drop `properties_document`. Text column remains.

### B17 — CHECK constraints and catalog rows

**Current state.** Enum-like values are unconstrained `VARCHAR`s. Java enums are the only guard. A hand-written SQL row can insert `difficulty = 'EXTREME2'` or `role = 'root'`. `admin_permissions.capability` is deliberately without a CHECK so a new capability does not need a migration; that comment fights a closed CHECK. Use a catalog table instead.

**New DDL.** Add CHECKs as `NOT VALID`, then `VALIDATE CONSTRAINT` in rehearsal. `NOT VALID` does not lock out readers; `VALIDATE` takes a weaker lock and fails if a bad row exists. On failure, stop. Write a reviewed repair. Do not delete the row inside the migration.

| Table.column | Check |
|---|---|
| `users.role` | `STUDENT`, `TEACHER`, `ADMIN` |
| `users.preferred_locale` | `en`, `es` |
| `challenges.difficulty` | `EASY`, `MEDIUM`, `HARD`, `EXPERT`, `EXTREME` |
| `challenges.origin` | `LEGACY`, `COMMUNITY` |
| `submissions.status` | `PENDING`, `BUILDING`, `TESTING`, `COMPLETED`, `FAILED`, `ABANDONED` |
| `friendships.status` | `PENDING`, `ACCEPTED` |
| `sandbox_executions.status` | `PENDING`, `BUILDING`, `RUNNING`, `COMPLETED`, `FAILED`, `TIMEOUT`, `STOPPED` |
| `test_results.test_type` | `FUNCTIONAL`, `PERFORMANCE`, `DESIGN` or NULL |
| `test_results.status` | `PASSED`, `FAILED`, `SKIPPED`, `ERROR` or NULL |
| `replay_events.severity` | `info`, `warn`, `error` |
| `notifications.importance` | `INFO`, `REMINDER`, `ALERTS`, `IMPORTANT` |
| `notifications.type` | the four constants in `NotificationService` |
| `user_weekly_progress.qualified_via` | `XP`, `RUNS`, `BOTH` or NULL |
| `achievement_definitions.tier`, `profile_badge_definitions.tier` | `COMMON`, `RARE`, `EPIC`, `LEGEND` |
| `moderation_record.type` | `BAN`, `UNBAN` |

```sql
CREATE TABLE IF NOT EXISTS admin_capability_definitions (
    code VARCHAR(20) PRIMARY KEY,
    description TEXT NOT NULL
);
INSERT INTO admin_capability_definitions (code, description) VALUES
    ('MODERATION', 'Ban, unban, warn, verify, impersonate, delete'),
    ('BI', 'Business intelligence reads')
ON CONFLICT (code) DO NOTHING;
```

Then `admin_permissions.capability` REFERENCES `admin_capability_definitions(code)`. Adding a capability becomes an insert into the catalog plus the Java enum, which matches the existing "no CHECK rewrite" intent and the normalization rule.

**Backfill.** None if `VALIDATE` succeeds. If it fails, the repair script is a separate reviewed change that updates the offending value to a legal one or leaves the constraint `NOT VALID`. It never `DELETE`s.

**JPA / services.** None for the CHECKs. `AdminPermission` gains an optional many-to-one to the catalog; REST capability strings stay `MODERATION` and `BI`.

**REST.** Unchanged. A 500 from a bad enum string becomes a constraint violation; that path is already a server bug.

**Risk.** Medium. `VALIDATE` can fail on dirty production data. Rehearsal is mandatory. `notifications.type` CHECK will reject a new type until the constraint is updated; that is intended, and the PR that adds a type updates the CHECK in the same change.

**Deploy / rollback.** `ALTER TABLE ... DROP CONSTRAINT IF EXISTS`. Dropping a CHECK does not touch rows.

### B18 — Missing foreign keys

**Current state.** Same database, but several columns are bare bigints. Orphans may exist. Add each FK `NOT VALID`, then `VALIDATE` on the rehearsal copy. `ON DELETE` matches the product rule already used elsewhere.

| Column | References | On delete |
|---|---|---|
| `submissions.user_id` | `users(id)` | `CASCADE` (GDPR erase already deletes submissions first; the FK matches that) |
| `submissions.challenge_id` | `challenges(id)` | `RESTRICT` (do not silently destroy deliveries if a challenge row is removed) |
| `sandbox_executions.submission_id` | `submissions(id)` | `CASCADE` |
| `leaderboard_entries.submission_id` | `submissions(id)` | `RESTRICT` until product decides a submission delete should drop the rank row; today's delete path must be read before choosing `CASCADE` |
| `test_results.submission_id` | `submissions(id)` | `CASCADE` (column already declared this way in `init-db.sql`; confirm production matches) |
| `user_weekly_streak_challenges.challenge_id` | `challenges(id)` | `RESTRICT` |
| `docs_feedback.user_id` | `users(id)` | `SET NULL` |
| `product_events.user_id` | `users(id)` | `SET NULL` (erasure must not delete the aggregate; it must forget the person) |
| `moderation_record.user_id` | `users(id)` | `CASCADE` |
| `admin_audit_log.target_user_id` | `users(id)` | `SET NULL` |
| `notifications.user_id` | already FK `CASCADE` | keep |

Before `VALIDATE` on `leaderboard_entries.submission_id`, read `deleteSubmission` / GDPR erase. If those deletes remove submissions that still have leaderboard rows, `RESTRICT` will break erasure. In that case the FK waits until the erase path deletes or nulls the leaderboard row in the same transaction. Do not add a FK that makes `DELETE /api/auth/me` return 500.

**Backfill.** No row rewrite. Orphans are listed in rehearsal (`NOT EXISTS` anti-join). Repair is an explicit script: attach, null, or, only with a written product decision, delete. This plan does not delete orphans.

**JPA / services.** Optional `@ManyToOne` with `insertable=false, updatable=false` where the code uses a raw id today. Do not switch the write path to a managed association in the same PR.

**REST.** Unchanged.

**Risk.** Medium-high. A validated FK changes what deletes succeed. GDPR erasure is the scenario to smoke on the copy.

**Rollback.** `ALTER TABLE ... DROP CONSTRAINT`. Rows stay.

### B19 — `timestamptz`

**Current state.** Almost every timestamp column is `TIMESTAMP` without time zone. `notifications.read_at` and `created_at` are already `timestamptz`. Java entities use `LocalDateTime`, which carries no offset. A bulk cast to `timestamptz` interprets existing values in the **session TimeZone**. If production is UTC and a migration session is not, every timestamp shifts.

**New DDL.** Do not convert in an early PR.

Per column, after rehearsal prints `SHOW timezone` and a before/after sample of `users.created_at`:

```sql
ALTER TABLE users ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
```

Apply that pattern only when the sample proves the source values are UTC. Convert one low-traffic table first (`docs_feedback.created_at`), smoke the API, then the rest. Switch the matching entity field from `LocalDateTime` to `Instant` or `OffsetDateTime` in the same PR as that table. Do not leave Hibernate on `LocalDateTime` against a `timestamptz` column.

**Backfill.** The `USING` clause is the backfill. It rewrites the column. Take the backup immediately before. Low-traffic tables first.

**REST.** JSON timestamps stay ISO-8601. Compare a fixture user before and after on the copy. A one-hour shift is a failed rehearsal, not a cosmetic diff.

**Risk.** High. This rewrites every hot table. It is last among type changes for that reason, ahead of only the role lockdown and the drops.

**Rollback.** Reverse `USING` is not byte-identical if the session zone was wrong. Rollback is restore-from-backup, not a down migration. The rollback script shipped with the PR must say that in the header.

### B20 — Secrets at rest

**Current state.** Aligned with GDPR §6 for passwords (`password_hash` is bcrypt) and refresh tokens (SHA-256 in `refresh_tokens.token`, raw value `@Transient`). Not aligned:

- `users.totp_secret` is the Base32 shared secret in plaintext (`UserTwoFactorService`, `AdminTwoFactorService`). Any user can enroll, not only admins.
- `users.email_verification_token` and `users.password_reset_token` are the raw tokens (48 h and 1 h). Lookup is by the raw value.

`exportUserData` does not include these. `account_deletions.snapshot` is that export, so the archive is clean. The live `users` row is not.

**New DDL.**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret_enc BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_hash VARCHAR(64);
```

**Backfill.**

- Token hashes: `encode(digest(token, 'sha256'), 'hex')` where the raw column is not null. Dual-lookup accepts hash first, then raw, until the raw column is dropped in the contract PR. Outstanding email links keep working.
- TOTP: encrypt with a key from the environment (`pgcrypto` `pgp_sym_encrypt` or application-level AES-GCM). Do not put the key in this document or in SQL that gets committed. Rehearsal uses a throwaway key. A row whose ciphertext does not round-trip aborts; the plaintext column is not cleared in this block.

**JPA / services.** `AuthService` verification and reset, `UserTwoFactorService`, `AdminTwoFactorService`. Login and refresh behavior stay the same.

**REST.** `POST /api/auth/verify-email`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, and the 2FA enroll/confirm routes keep their request bodies. No response starts returning a secret that it does not already return during enroll.

**Risk.** High. A bad hash cutover locks people out of verification and password reset. A bad TOTP cipher locks admins and anyone who enrolled 2FA out of login. Dual-read is mandatory. Do not null the plaintext columns here.

**Deploy.** Columns → dual-write new tokens as hashes only (raw still stored until contract) → backfill hashes → switch lookup to hash-then-raw → encrypt TOTP in a second step with a tested round-trip. Rollback uses the plaintext columns, which are still populated.

**Contract (later, DO NOT APPLY).** After one full token lifetime (48 h verification, 1 h reset) with no raw lookups in the logs, drop `email_verification_token`, `password_reset_token`, and `totp_secret`. Requires a fresh backup.

### B21 — Redundant indexes

**Current state.** These btree indexes duplicate a UNIQUE constraint, which already creates an index: `idx_users_email`, `idx_users_username`, `idx_refresh_tokens_token`, `idx_categories_slug`, `idx_challenges_slug`. `idx_leaderboard_challenge_rank` is likely unused if the hot order is score, not `rank` (confirm with B01's `EXPLAIN`). `idx_challenges_featured` and `idx_challenges_difficulty` become redundant once the partial indexes in B01 exist and `EXPLAIN` prefers them. `idx_test_results_status` is a low-selectivity standalone; drop only if rehearsal shows zero scans.

**New DDL.** None in the create direction. Drops are `DROP INDEX CONCURRENTLY` and only after `pg_stat_user_indexes` on the rehearsal copy (and, later, a production stats snapshot the maintainer chooses to take) shows `idx_scan = 0` for that specific index while the UNIQUE index serves the query. This plan does not schedule the drop against production.

**Risk.** Low once `EXPLAIN` proves the remaining index is used. Dropping the wrong one regresses login (`users.email`).

**Rollback.** Recreate the named index concurrently. No row change.

### B22 — Contract: drop source JSON/TEXT columns

**DO NOT APPLY.** Not in the same release as the expand. Not without a fresh backup. Not without a production read path that has ignored the old column for a full deploy cycle.

Candidates, in the order of their expand blocks: `challenges.required_endpoints`, `hints`, `learning_objectives`, `required_status_codes`, `required_headers`, `performance_requirements`, `design_criteria`, `test_suite`, then the submission JSON columns, `replay_events.metadata`, header JSON, `notifications.metadata_json`, and the plaintext secret columns from B20.

Each drop is its own PR with `rollback` = `ADD COLUMN` plus a backfill **from the new tables** (the reverse mapping), rehearsed on the copy. If the reverse mapping is not byte-identical, the PR does not ship.

Hibernate `validate` will fail if an entity still maps a dropped column. Remove the field in the same PR as the drop, after the dual-read is gone.

### B23 — One role per service

**Plan only. Do not `CREATE ROLE` on production as part of any normalization PR.** Do this last, after `ddl-auto=validate` on every service that still has `update` (auth, challenge, sandbox, testing, leaderboard, notification). `update` plus a role without `CREATE` fails boot.

Today every service uses `apiarena_user`, which owns the public schema and can read every table. Metrics queries `submissions` and `sandbox_executions`. GDPR §6 asks for access control beyond "the app user can see everything".

| Role | Privileges |
|---|---|
| `apiarena_auth` | `SELECT/INSERT/UPDATE/DELETE` on auth-owned tables in the inventory. No access to `submissions` or `test_results`. |
| `apiarena_challenge` | DML on `categories`, `challenges`, and B02–B06 tables. `REFERENCES` on `users(id)` for `created_by`. No table-wide `SELECT` on `users`. |
| `apiarena_submission` | DML on `submissions`, `replay_events`, and B07–B13 tables. `REFERENCES` on `users` and `challenges`. |
| `apiarena_sandbox` | DML on `sandbox_executions` only. |
| `apiarena_testing` | DML on `test_results` and `test_result_headers`. |
| `apiarena_leaderboard` | DML on `leaderboard_entries`. |
| `apiarena_notification` | DML on `notifications` and B15 attr tables. |
| `apiarena_metrics` | DML on `docs_feedback` and `product_events`. `SELECT` only on `submissions` and `sandbox_executions` (the overview queries). |
| `apiarena_migrator` | DDL. Used by the maintainer's `psql` session, never by a service container. |

`GRANT`s are explicit per table. `REVOKE ALL ON SCHEMA public FROM PUBLIC` is part of this block and will break a service that still connects as `apiarena_user` unless that role keeps its grants until each service's env (`SPRING_DATASOURCE_USERNAME`) has been switched and smoked. Switch one service per deploy, auth last (it is the session issuer). Passwords for the new roles come from the environment, not from SQL in git.

**Risk.** Highest operational risk in the plan. A missing `SELECT` turns into a 500. Rehearse by running the e2e smoke script against a stack whose datasource users are the new roles.

**Rollback.** `GRANT` the previous rights back to `apiarena_user` and point the service env at it again. Do not `DROP ROLE` while it still owns objects.

### B24 — Make `init-db.sql` match production

**Current state.** A new volume misses `admin_permissions`, `account_deletions`, `moderation_record`, `admin_audit_log`, and the user columns listed in the inventory (`deactivated_at`, ban columns, `totp_*`, `warnings`). Those appear only after auth-service or a manual `psql`. `submission-service` `schema.sql` is older than `init-db.sql`.

**Change.** Copy the already-shipped idempotent DDL into `init-db.sql` so a new volume matches what the runners create. Do not execute it against production; production already has the objects. Remove or regenerate `schema.sql` so it cannot recreate a short `submissions` table.

**Risk.** Low for production (file is not applied to the existing volume). Medium for a brand-new volume if the copied DDL is not actually idempotent. Review `CREATE TABLE IF NOT EXISTS` and the admin-permission backfill `ON CONFLICT DO NOTHING`.

**Deploy.** Ships with whichever later PR first touches `init-db.sql`. No `psql` against the live database.

## GDPR notes that are not their own block

From `docs/GDPR-RAT.md`:

- Erasure (`DELETE /api/auth/me`) must keep working after every FK in B18. Smoke it on the copy with a disposable user, never by deleting a real account.
- `product_events` and `docs_feedback` have no retention. The RAT already says client analytics retention is undefined because analytics is off. Do not add a silent delete. Update the RAT in the PR that introduces a purge.
- Replay (30 days) and ZIP (90 days) stay as they are. B13's cascade must delete attr rows when the retention job deletes events.
- `account_deletions.snapshot` stays opaque and free of secrets (already true of `exportUserData`).
- `date_of_birth` stays a column. It is a required age-gate attribute, not a list.
- B20 is the secret-at-rest gap called out by §6 ("contraseñas con hash, nunca en claro") extended to TOTP and one-time tokens.

## What this PR does not do

- No `CREATE`, `ALTER`, `INSERT`, `UPDATE`, `DELETE`, or `psql` against any database.
- No `docker compose` change, no volume operation, no SSH to the production host.
- No Java dual-write. That is B02, and only after Task 0 is on `main`.
- No edit to `init-db.sql` yet. Each later block copies its DDL in the same PR that adds `docker/postgres/alter-NNN-*.sql` and `rollback-NNN-*.sql`.

## Maintainer order, short form

1. B01 indexes (concurrent, rehearsal `EXPLAIN ANALYZE` on a copy).
2. B02 `challenge_required_endpoints` — first expand + backfill, branch `feat/db-challenge-required-endpoints`.
3. B03 hints and learning objectives.
4. B04 status codes and headers.
5. B05 performance spec columns.
6. B06 design criteria and test suite, after a shape census.
7. B07 teacher zone-note columns.
8. B08 penalties.
9. B09 bonuses.
10. B10 structured feedback lines.
11. B11 AI review rows.
12. B12 census of the four unused submission JSON columns.
13. B13 replay attrs.
14. B14 test-result header census.
15. B15 notification metadata columns.
16. B16 opaque `properties_document` plus invalid-text fallback.
17. B17 CHECKs (`NOT VALID` then `VALIDATE`) and the capability catalog.
18. B18 FKs, GDPR erase smoked on the copy.
19. B19 `timestamptz`, one table at a time, rollback = restore.
20. B20 hash tokens and encrypt TOTP; plaintext columns stay until the contract PR.
21. B21 drop redundant indexes only after `EXPLAIN`.
22. B22 drop source columns — **DO NOT APPLY** until a fresh backup and a verified read path.
23. B23 per-service roles — plan only until `ddl-auto=validate` is universal.
24. B24 fold runner DDL into `init-db.sql` on the first PR that already edits that file (no live `psql`).
