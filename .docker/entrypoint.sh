#!/bin/bash

# Only build node_modules if they do not exist or if package-lock changed
if [ ! -d node_modules ] || (! sha1sum --check /cache/lock); then
  echo "cache is invalid, rebuilding …"

  echo "clearing angular cache..."
  rm -rf .angular

  echo "rebuild dependencies..."
  npm ci --legacy-peer-deps

  echo "creating hash for cache validation..."
  sha1sum package-lock.json > /cache/lock
else
  echo "cache is valid, continuing..."
fi

# Use public interface, because this script is executed in a container!
# This is no security issue as the container is located in a private network.
./node_modules/.bin/ng serve --host 0.0.0.0 --port 4200
