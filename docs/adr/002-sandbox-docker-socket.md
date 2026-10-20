# ADR 002 — sandbox-service and the host Docker socket

**Status:** Proposed (maintainer approval required — do not implement until approved)  
**Date:** 2026-10-20  
**Context:** Host blast-radius analysis on a shared machine (personal assistant, Nextcloud, NPM, other projects)

## Context

`sandbox-service` mounts the host Docker socket read/write:

```yaml
# docker-compose.yml (sandbox-service)
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

That is effectively **root on the host**: any process that can talk to the socket can create privileged containers, mount the host filesystem, join host networks, and pivot into every other stack on the machine—not only API Arena.

Candidate **`docker run`** is already hardened (`--memory`, `--cpus`, `--pids-limit`, `--cap-drop=ALL`, `--read-only`, internal `apiarena-candidate` network). **Do not weaken that.** The residual risk is compromise of **sandbox-service itself** (zip slip on unpack, unsafe deserialization, vulnerable dependency, RCE in the JVM, stolen internal token, etc.).

Related deferral: `docs/security-followups.md` item **#3b** (stop mounting the host Docker socket). This ADR expands options, cost, and risk for maintainer decision. **No runtime code in this change set.**

## Decision drivers

| Driver | Note |
|--------|------|
| Shared host | Blast radius includes non-APIArena workloads |
| Prod already uses DinD runner for candidates | Isolation of *candidates* ≠ isolation of *sandbox-service* |
| Build path still talks to Docker API | Needs build / create / start / logs / rm / rmi (and related) |
| Ops cost | Maintainer alone; prefer incremental hardening over big-bang if possible |

## Options

### Option 1 — Docker socket proxy (allowlist routes)

Put a proxy (tecnativa/docker-socket-proxy, HAProxy, etc.) between sandbox-service and the real socket. Allow only the API paths the sandbox actually uses (build, containers create/start/logs/rm, images rmi, networks inspect as needed).

| | |
|--|--|
| **Effort** | Low–medium (compose + allowlist tuning + staging validation) |
| **Risk reduction** | **Partial.** Shrinks accidental API surface (e.g. swarm, secrets, unrelated containers). |
| **Residual risk** | High for a determined attacker: path filters do **not** inspect `/containers/create` body. A allowed `create` can still request `--privileged`, host mounts, or host PID/network. |
| **Fit** | Useful as a **first** layer; not a complete answer on a shared host. |

### Option 2 — Dedicated dockerd for candidates (DinD sidecar)

Run a separate `docker:dind` (or rootless DinD) on an isolated Compose network. Point sandbox-service at `DOCKER_HOST=tcp://…` (TLS recommended) and **remove** the host socket mount.

| | |
|--|--|
| **Effort** | Medium–high (networking, TLS or tightly firewalled TCP, build cache, staging of full submit pipeline) |
| **Risk reduction** | **Strong for the host.** Compromising sandbox-service yields control of the **candidate daemon**, not host dockerd / Nextcloud / assistant. |
| **Residual risk** | DinD typically needs `--privileged` (or carefully documented rootless setup). Escape from that privileged DinD is a separate threat class—smaller than raw host socket, not zero. Disk/CPU for a second daemon; BuildKit cache lifecycle (see builder limits work elsewhere). |
| **Fit** | Best balance for this host if we stay on bare-metal Docker Compose. Aligns with security-followups #3b. |

### Option 3 — Dedicated small VM for candidate execution

Move build/run of submissions to a separate VM (or cloud instance). Host sandbox-service becomes a thin client over SSH/API, or sandbox runs entirely inside that VM.

| | |
|--|--|
| **Effort** | High (provisioning, networking, deploy pipeline, monitoring, backups story) |
| **Risk reduction** | **Strongest** isolation from the family NAS / assistant host. |
| **Residual risk** | Cost/ops of a second machine; still need hardening *inside* the VM. |
| **Fit** | Ideal long-term if the shared host remains multi-tenant for personal data. |

## Recommendation (for maintainer)

1. **Near term:** Option **2** (dedicated DinD / remote daemon, drop host socket) as the target architecture; validate full build → run → cleanup in staging before prod.  
2. **Optional bridge:** Option **1** only if Option 2 slips and we need a cheap reduction of accidental API misuse—document that it does **not** close privileged `create`.  
3. **Long term:** revisit Option **3** if personal and product workloads must stay co-located on one chassis.

**Explicit non-goals until approved:** changing `SandboxService` run flags, removing DinD candidate hardening, or implementing any of the options in this PR/branch.

## Consequences (once an option is chosen)

- Compose and deploy docs must describe the new trust boundary.
- Internal token / network rules between submission → sandbox → candidate daemon need a short threat note.
- Update or close `docs/security-followups.md` #3b when implemented.

## References

- Encargo host resources § D2 (2026-10).
- `docs/security-followups.md` (#3b).
- `docs/P1-HARDENING-IMPLEMENTATION.md` (DinD per submission).
- Candidate network: Compose `apiarena-candidate` (`internal: true`).
