-- Apply on existing API Arena databases (init-db.sql only runs on first volume create).
-- Idempotent: ON CONFLICT (slug) DO NOTHING, so re-running changes nothing.
-- NEVER requires `docker compose down -v`. Apply against the live DB:
--   docker exec -i apiarena-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < docker/postgres/seed-extreme-challenges.sql
--
-- Seeds the first EXTREME-tier challenges. difficulty is VARCHAR (no DB enum), so no
-- schema migration is needed for the new tier; the value 'EXTREME' is just inserted.
-- These are admin/console-authored official challenges, so origin = 'LEGACY' and
-- created_by = NULL (NOT 'COMMUNITY' — that origin is reserved for teacher/authorized
-- creators going through the app UI, which renders the "community" badge).
--
-- DEPLOY ORDER (IMPORTANT): challenge-service maps difficulty with
-- @Enumerated(EnumType.STRING). Deploy the new challenge-service + submission-service
-- images (enum that includes EXTREME) BEFORE applying this seed. Inserting EXTREME rows
-- against an old binary makes it 500 when reading them. Code first, then seed.

INSERT INTO challenges (title, slug, description, difficulty, category_id, max_score, time_limit_minutes, created_by, origin, featured, times_attempted, times_completed, average_score, xp_reward, required_endpoints, hints, learning_objectives) VALUES
(
  'Idempotent Payment Processing API',
  'idempotent-payments',
  'Build a payment API that is safe to retry. Every POST /api/payments accepts an Idempotency-Key: replaying the same key must return the original payment, never a duplicate charge. Payments can be captured exactly once and expose an append-only event trail. Concurrency and double-submit must never create two charges for one key.',
  'EXTREME', 4, 1000, 90, NULL, 'LEGACY', TRUE, 0, 0, 0.00, 400,
  '{"items":[{"method":"GET","path":"/api/payments","expectStatus":200},{"method":"POST","path":"/api/payments","expectStatus":201},{"method":"GET","path":"/api/payments/{id}","expectStatus":200},{"method":"GET","path":"/api/payments/999","expectStatus":404},{"method":"POST","path":"/api/payments/{id}/capture","expectStatus":200},{"method":"GET","path":"/api/payments/{id}/events","expectStatus":200}]}',
  '{"items":["Store payments keyed by the Idempotency-Key; a repeated key returns the stored result with the same id","Capture must be idempotent: a second capture returns the same captured state, not an error","Model state changes as appended events (CREATED, CAPTURED) rather than mutating a single row in place"]}',
  '{"items":["Design idempotent write endpoints safe under retries","Guarantee exactly-once side effects with idempotency keys","Expose an append-only event history for auditability"]}'
),
(
  'Event-Sourced Banking Ledger',
  'event-sourced-ledger',
  'Implement an account ledger where the balance is never stored directly: it is a projection of an append-only transaction log. POST transactions (DEPOSIT/WITHDRAW) append events; GET /api/accounts/{id} returns the balance folded from those events. Overdrafts must be rejected and the log must stay immutable and ordered.',
  'EXTREME', 8, 1000, 90, NULL, 'LEGACY', FALSE, 0, 0, 0.00, 400,
  '{"items":[{"method":"GET","path":"/api/accounts","expectStatus":200},{"method":"POST","path":"/api/accounts","expectStatus":201},{"method":"GET","path":"/api/accounts/{id}","expectStatus":200},{"method":"GET","path":"/api/accounts/{id}/transactions","expectStatus":200},{"method":"POST","path":"/api/accounts/{id}/transactions","expectStatus":201},{"method":"GET","path":"/api/accounts/999","expectStatus":404}]}',
  '{"items":["Never store the balance; derive it by folding the transaction events on read","Append events in order and never mutate or delete past entries","Reject a WITHDRAW that would drive the balance negative before appending it"]}',
  '{"items":["Apply event sourcing to derive state from an append-only log","Build read-side projections from events","Enforce invariants (no overdraft) at append time"]}'
),
(
  'Multi-Tenant RBAC SaaS API',
  'multi-tenant-rbac',
  'Design a multi-tenant API where every resource belongs to a tenant and is invisible across tenant boundaries. Members have roles (OWNER, ADMIN, MEMBER) that gate what they can do. Listing a tenant''s members must only ever return that tenant''s members, and cross-tenant access must be impossible even with a valid id.',
  'EXTREME', 3, 1000, 90, NULL, 'LEGACY', FALSE, 0, 0, 0.00, 400,
  '{"items":[{"method":"GET","path":"/api/tenants","expectStatus":200},{"method":"POST","path":"/api/tenants","expectStatus":201},{"method":"GET","path":"/api/tenants/{id}","expectStatus":200},{"method":"GET","path":"/api/tenants/{id}/members","expectStatus":200},{"method":"POST","path":"/api/tenants/{id}/members","expectStatus":201},{"method":"GET","path":"/api/tenants/999","expectStatus":404}]}',
  '{"items":["Scope every query by tenant id so data never leaks across tenants","Enforce role checks (OWNER/ADMIN can add members) before mutating","Return 404 (not 403) for resources outside the caller''s tenant to avoid leaking existence"]}',
  '{"items":["Implement strict tenant isolation","Model role-based access control (RBAC)","Avoid cross-tenant data leakage by design"]}'
),
(
  'Distributed Saga Order Orchestration',
  'distributed-saga-orchestration',
  'Orchestrate an order across payment, inventory and shipping steps as a saga. Creating an order runs the steps in sequence; if a later step fails, earlier steps must be compensated (rolled back) so the system ends consistent. Cancelling an in-flight order triggers compensation. A /health endpoint reports orchestrator readiness.',
  'EXTREME', 9, 1000, 90, NULL, 'LEGACY', FALSE, 0, 0, 0.00, 400,
  '{"items":[{"method":"GET","path":"/api/orders","expectStatus":200},{"method":"POST","path":"/api/orders","expectStatus":201},{"method":"GET","path":"/api/orders/{id}","expectStatus":200},{"method":"POST","path":"/api/orders/{id}/cancel","expectStatus":200},{"method":"GET","path":"/health","expectStatus":200},{"method":"GET","path":"/api/orders/999","expectStatus":404}]}',
  '{"items":["Model the saga as ordered steps each with a matching compensation action","On failure, run compensations in reverse order of the steps already completed","Expose the saga state (PENDING/COMPLETED/COMPENSATED) on the order resource"]}',
  '{"items":["Implement the saga pattern with compensating transactions","Keep distributed workflows eventually consistent","Track and expose orchestration state"]}'
),
(
  'High-Throughput Time-Series Ingestion',
  'timeseries-ingestion',
  'Build an ingestion API for time-series points optimized for throughput. Clients batch-write points to a series; reads return recent points and a downsampled aggregate (min/max/avg per bucket). The hot read path must stay fast and allocate little under sustained load.',
  'EXTREME', 5, 1000, 90, NULL, 'LEGACY', FALSE, 0, 0, 0.00, 400,
  '{"items":[{"method":"GET","path":"/api/series","expectStatus":200},{"method":"POST","path":"/api/series","expectStatus":201},{"method":"GET","path":"/api/series/{id}","expectStatus":200},{"method":"GET","path":"/api/series/{id}/points","expectStatus":200},{"method":"POST","path":"/api/series/{id}/points","expectStatus":201},{"method":"GET","path":"/api/series/{id}/aggregate","expectStatus":200}]}',
  '{"items":["Accept points in batches to amortize per-request overhead","Keep the read path allocation-light: precompute or cache aggregates per bucket","Use ring buffers or bounded windows so memory stays flat under sustained ingest"]}',
  '{"items":["Design high-throughput ingestion endpoints","Implement downsampling/aggregation over time buckets","Optimize the hot path for latency and memory"]}'
)
ON CONFLICT (slug) DO NOTHING;
