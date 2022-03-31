#!/bin/bash

# Abort execution when an error occurs
set -e

# Set working directory properly
cd "$(dirname $0)"
WORKDIR="$(pwd)"

COMPOSE_PROJECT_NAME="fragjetzt-frontend"

echo "COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}" > ../.env
echo "DEV_USER=$(id -u):$(id -g)" >> ../.env

while true; do
  case "$1" in
    --prod ) PROD=true; shift ;;
    "" ) break ;;
    * ) echo "unknown option: $1"; exit 1 ;;
  esac
done

[ -z ${PROD} ] && ln -fs "$(pwd)/docker-compose.override.dev.yml" ../docker-compose.override.yml || rm -f ../docker-compose.override.yml
