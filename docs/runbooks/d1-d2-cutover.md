# Runbook: D1 Kafka/ZK named volumes + D2 sandbox DinD

**Host:** production API Arena (`/home/dudu/apps/API-ARENA`)  
**Never:** `docker compose down -v`, `volume prune`, or delete Postgres/Mongo volumes.  
**Order:** D1 cutover → smoke Kafka → D2 cutover → smoke submission. One operator.

Related: [ADR 001](../adr/001-kafka-zookeeper-named-volumes.md), [ADR 002](../adr/002-sandbox-docker-socket.md).

---

## Preflight (before the window, zero downtime)

```bash
cd /home/dudu/apps/API-ARENA
git fetch && git log -1 --oneline origin/main   # confirm D1+D2 merge is on main
mountpoint -q /mnt/nas && df -h /mnt/nas || echo "NAS missing — script will use deploy/backups/kafka-zk/"
chmod +x deploy/migrate-kafka-zk-named-volumes.sh deploy/backup-db.sh

# Identify current anonymous volumes (while kafka/zk still running is OK for inspect)
docker inspect -f '{{range .Mounts}}{{println .Destination .Name}}{{end}}' apiarena-kafka apiarena-zookeeper

# Dry-run requires containers STOPPED — do this only at cutover start, or skip
./deploy/backup-db.sh
```

Go/no-go:

- [ ] Postgres backup OK (local + NAS if mounted)
- [ ] Disk free on NVMe and NAS
- [ ] No active classroom exam that cannot tolerate ~15 min degraded submissions
- [ ] Rollback compose tag / previous commit known

---

## Cutover D1 (~3–8 min) — Kafka + ZooKeeper only

Web/auth/challenges stay up. Leaderboard/notifications may lag until Kafka returns.

```bash
cd /home/dudu/apps/API-ARENA
git pull --ff-only origin main

docker compose stop kafka zookeeper

./deploy/migrate-kafka-zk-named-volumes.sh --dry-run
./deploy/migrate-kafka-zk-named-volumes.sh

# Compose already declares kafka_data / zookeeper_* — start with named mounts
docker compose up -d zookeeper kafka
```

### Smoke D1

```bash
docker compose ps zookeeper kafka
docker logs apiarena-kafka --tail 80 | grep -iE 'InconsistentClusterId|ERROR|started' || true
docker exec apiarena-kafka kafka-topics --bootstrap-server localhost:9092 --list || \
  docker exec apiarena-kafka kafka-topics --bootstrap-server kafka:29092 --list

# Consumers should rejoin (watch a minute)
docker logs apiarena-leaderboard --since 2m 2>&1 | grep -iE 'kafka|Joined|ERROR' | tail -20
curl -fsS http://127.0.0.1:3000/api/gateway/health | head -c 300; echo
```

**Pass:** no `InconsistentClusterIdException`, topics list, gateway overall up.  
**Do not** delete anonymous volumes yet.

### Rollback D1

```bash
docker compose stop kafka zookeeper
# Restore previous compose revision without named mounts OR copy tar back onto temporary vols
# Prefer: git checkout <pre-d1-sha> -- docker-compose.yml && docker compose up -d zookeeper kafka
# Or restore from /mnt/nas/backups/apiarena/kafka-data-*.tgz into the volumes the old compose used
```

---

## Cutover D2 (~5–12 min) — sandbox DinD sidecar

Submissions in flight may fail; web stays up.

```bash
cd /home/dudu/apps/API-ARENA

# Bring dedicated dockerd first
docker compose up -d sandbox-dind
docker compose ps sandbox-dind
# wait until healthy
for i in $(seq 1 36); do
  st=$(docker inspect -f '{{.State.Health.Status}}' apiarena-sandbox-dind 2>/dev/null || echo starting)
  echo "sandbox-dind health=$st"
  [ "$st" = "healthy" ] && break
  sleep 5
done

docker compose up -d --build sandbox-service testing-service
```

### Smoke D2

```bash
# No host docker.sock on sandbox
docker inspect -f '{{range .Mounts}}{{println .Source .Destination}}{{end}}' apiarena-sandbox | grep docker.sock \
  && echo FAIL_sock_still_mounted || echo OK_no_host_sock

docker exec apiarena-sandbox sh -c 'echo DOCKER_HOST=$DOCKER_HOST'
docker exec apiarena-sandbox docker info >/dev/null && echo OK_docker_via_dind

# Host dockerd should NOT list candidate containers after a successful submit
docker ps -a --filter name=apiarena-candidate- --format '{{.Names}}' || true

# Real submission smoke (seed JWT or UI). Expect COMPLETED; candidates live inside DinD:
docker exec apiarena-sandbox docker ps --filter name=apiarena-candidate-

curl -fsS http://127.0.0.1:3000/api/gateway/health; echo
```

**Pass:** no host sock mount, `DOCKER_HOST=tcp://sandbox-dind:2375`, submission COMPLETED, testing can hit `http://sandbox-dind:<port>`.

### Rollback D2

```bash
# Restore compose that mounts /var/run/docker.sock and removes sandbox-dind dependency
# git checkout <pre-d2-sha> -- docker-compose.yml backend/sandbox-service
docker compose up -d --build sandbox-service testing-service
docker compose stop sandbox-dind   # optional
```

---

## Post (after ≥48h stable) — anonymous volume cleanup

Only after D1 soak. **Never** `docker volume prune`.

```bash
# List leftovers from migrate script logs (anonymous IDs printed at end)
# Example — replace with real IDs from the migration log:
# ANON_KAFKA=... ANON_ZK_DATA=... ANON_ZK_LOG=...

# Optional: re-tar before delete
# docker run --rm -v "$ANON_KAFKA:/from:ro" -v /mnt/nas/backups/apiarena:/to alpine:3.20 \
#   tar czf /to/kafka-anon-final-$(date -u +%Y%m%dT%H%M%SZ).tgz -C /from .

# docker volume rm "$ANON_KAFKA" "$ANON_ZK_DATA" "$ANON_ZK_LOG"
```

Update ADR 001 status to **Accepted / Done** after cleanup.

---

## Timing cheat sheet

| Step | Target |
|------|--------|
| Preflight backup | before window |
| D1 stop + migrate + up | 3–8 min |
| D1 smoke | 2–3 min |
| D2 dind + rebuild sandbox | 5–12 min |
| D2 smoke submit | 2–5 min (cold buildx cache) |
| Anon volume rm | ≥48h later |
