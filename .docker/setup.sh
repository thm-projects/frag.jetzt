#!/bin/bash

# Abort execution when an error occurs
set -e

# Set working directory properly
cd "$(dirname $0)"
WORKDIR="$(pwd)"

echo "DEV_USER=$(id -u):$(id -g)" > .env

while true; do
  case "$1" in
    --prod ) PROD=true; shift ;;
    "" ) break ;;
    * ) echo "unknown option: $1"; exit 1 ;;
  esac
done

[ -z $PROD ] && ln -fs .docker/docker-compose.override.yml docker-compose.override.yml || rm -f docker-compose.override.yml
