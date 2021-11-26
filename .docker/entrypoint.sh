#!/bin/bash

# Only build node_modules if they do not exist or if package-lock changed
[ -d node_modules ] && sha1sum --check ../lock-version || npm ci
sha1sum package-lock.json > ../lock-version

# Use public interface, because this script is executed in a container!
# This is no security issue as the container is located in a private network.
./node_modules/.bin/ng serve --host 0.0.0.0 --port 4200
