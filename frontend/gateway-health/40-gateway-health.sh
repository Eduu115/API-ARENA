#!/bin/sh
# Runs from /docker-entrypoint.d before nginx starts. Must return promptly, so it
# seeds a placeholder snapshot and backgrounds the 15s poller. The orphaned loop is
# adopted by init once the entrypoint execs nginx and keeps running.
set -u

mkdir -p /var/cache
[ -f /var/cache/gateway-health.json ] || \
  printf '{"gateway":"up","overall":"unknown","services":{}}\n' > /var/cache/gateway-health.json

( while true; do /usr/local/bin/poll-health.sh; sleep 15; done ) &
