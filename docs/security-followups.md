# Security follow-ups (Phase 3 — deferred, needs staging validation)

Phases 1 and 2 of the security remediation are merged. Phase 3's contained items are
done (process-mode opt-in, removal of the caller-supplied Dockerfile, hashed refresh
tokens). The items below are **intentionally deferred**: they change how untrusted code
is built/run and must be validated against the full submission pipeline in **staging**
before production, since a mistake breaks every submission.

## #3a — Build the candidate without network egress
**Risk it closes:** a malicious `pom.xml` can execute arbitrary code during `mvn package`
in BuildKit, which currently has network access (exfiltration, internal-network scanning).

**Plan:**
- Pre-populate a Maven repository in the build base image and build with `mvn -o` (offline).
- Run `docker build --network=none` (or an isolated network with no route to postgres/redis/
  kafka/other services).
- Validate: a normal submission still builds offline; a submission that tries to reach the
  network during build fails.

## #3b — Stop mounting the host Docker socket
**Risk it closes:** `sandbox-service` mounts `/var/run/docker.sock`, so a compromise of that
service equals root on the host.

**Plan:**
- Replace the socket mount with a dedicated rootless/remote DinD daemon
  (`DOCKER_HOST=tcp://dind:2375` on an isolated network), or run the daemon rootless.
- Validate the full build/run/cleanup cycle in staging before prod.

## #11 — `ddl-auto=validate` + migrations
**Risk it closes:** `ddl-auto=update` lets the ORM mutate the schema implicitly.

**Plan:**
- Add Flyway/Liquibase per service, baseline the current schema, then switch
  `spring.jpa.hibernate.ddl-auto` from `update` to `validate`.
- Deferrable; lowest urgency.

## Operational note (already shipped)
- `sandbox.runner.mode` now defaults to `dind`; `process` mode requires
  `sandbox.allow-process-mode=true` and must never be enabled in production.
- Refresh tokens are stored as SHA-256 hashes; rotating to this release invalidates
  existing refresh tokens (users re-login once).
