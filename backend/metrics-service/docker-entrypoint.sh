#!/bin/sh
set -e
mkdir -p /app/bi-exports
chown -R spring:spring /app
exec su-exec spring:spring java -jar /app/app.jar
