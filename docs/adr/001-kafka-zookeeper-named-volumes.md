# ADR 001 — Named volumes for Kafka and ZooKeeper

**Status:** Accepted — implementation in `feat/d1-d2-isolation` / runbook `docs/runbooks/d1-d2-cutover.md` (cutover applies named volumes; anonymous cleanup after 48h soak)  
**Date:** 2026-10-20  
**Context:** Host resource / orphan-volume cleanup (shared prod host, 2026-10 incident analysis)

## Context

Kafka (`apiarena-kafka`) and ZooKeeper (`apiarena-zookeeper`) currently rely on **anonymous volumes** declared by the Confluent images (`/var/lib/kafka/data`, `/var/lib/zookeeper/data`, `/var/lib/zookeeper/log`). Compose keeps those volumes across `up -d` recreations, but:

- `docker compose down` (without `-v`) or a **project name change** leaves them orphaned and starts fresh empty volumes.
- That pattern already produced several ~1 GB orphans on the shared host (same size class as the live Kafka volume), archived under `/mnt/nas/backups/volumenes-huerfanos/`.
- Live project volumes (`api-arena_*`) must not be deleted or recreated casually — see repo rules `api-arena-no-volume-recreation` and `api-arena-db-backup-and-migrations`.

Moving to **named volumes** in `docker-compose.yml` is the durable fix, but it is a **data migration**, not a one-line compose edit.

## Do Kafka / ZK data matter?

| Data | Persistence need | If lost |
|------|------------------|---------|
| Topics + messages still in retention | Useful for consumers that lag; not the system of record | Consumers re-consume from empty topics; in-app state (Postgres) remains |
| Consumer group offsets | Avoids reprocessing / duplicates on restart | Groups reset; possible duplicate side effects until consumers catch up |
| Cluster / broker metadata (ZK + Kafka cluster id) | **Required for a consistent restart** | Mismatch → `InconsistentClusterIdException`; broker will not start cleanly |

**Verdict:** Kafka here is **mostly transient** relative to Postgres (auth, challenges, submissions). Losing the log is inconvenient, not catastrophic for product data. Losing **only one** of Kafka or ZK state is worse than losing both: prefer coordinated stop/copy/start. Still: migrate with backup so we do not invent orphans or force a needless wipe.

## Decision (proposed)

When approved, migrate anonymous Kafka/ZK volumes to named Compose volumes (e.g. `kafka_data`, `zookeeper_data`, `zookeeper_log`) declared under top-level `volumes:` alongside `postgres_data`, etc. **No implementation in this ADR.**

## Migration plan (when maintainer approves)

Prerequisite: verified backup of any related state the maintainer cares about; follow `scripts/db-backup.sh` for Postgres if the window also touches other services. For Kafka/ZK specifically:

1. **Backup anonymous volumes (tar)**  
   Identify the live anonymous volume IDs attached to `apiarena-kafka` / `apiarena-zookeeper` (`docker inspect`).  
   Archive with `docker run --rm -v <vol>:/from -v /mnt/nas/backups/apiarena:/to alpine tar czf /to/kafka-zk-<UTC>.tgz -C /from .` (or equivalent). Store **outside** Docker named volumes; never commit dumps.  
   Verify archive size > 0 and list contents.

2. **Stop Kafka and ZooKeeper together**  
   `docker compose stop kafka zookeeper` (or stop both containers).  
   Do **not** leave one running with old data and the other on a new empty volume — that triggers `InconsistentClusterIdException`.

3. **Create named volumes and copy**  
   `docker volume create` for each named volume (Compose may create them on next up if declared).  
   Copy data from the anonymous volumes into the named ones (same `tar`/`cp` pattern as the backup).  
   Preserve ownership/permissions expected by the Confluent images where possible.

4. **Change compose**  
   Add explicit `volumes:` mounts on `kafka` and `zookeeper`, and declare named volumes under top-level `volumes:`.  
   Deploy the compose change only after data is present on the named volumes.

5. **Start and verify**  
   Start ZK then Kafka (or `compose up -d` for both).  
   Check broker health, list topics, and consumer groups (e.g. Kafka CLI / app consumers for `apiarena.submissions.completed`, `apiarena.user.activity`).  
   Confirm no `InconsistentClusterIdException` in logs.

6. **Orphan cleanup (later, optional)**  
   Only after verification and a second backup if needed: archive then remove the **old anonymous** volumes. Never `docker volume prune` blindly. Never `compose down -v`.

### Rollback

Restore from the tar on step 1 onto volumes remounted as before, or recreate anonymous mounts matching the previous compose and extract the archive. Prefer rollback over “format and hope” if cluster id errors appear.

## Consequences

- **Positive:** Stable volume names across project recreate; fewer silent empty Kafka starts; less orphan disk growth on the shared NVMe.
- **Negative:** One coordinated maintenance window; risk of cluster-id skew if steps 2–3 are done wrong.
- **Out of scope:** Moving Kafka/ZK data to `/mnt/nas` (SMR HDD — prohibited for random-write DB-like workloads).

## References

- Encargo host resources § D1 (2026-10).
- `.cursor/rules/api-arena-no-volume-recreation.mdc`
- `.cursor/rules/api-arena-db-backup-and-migrations.mdc`
