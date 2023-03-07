#!/bin/sh
rm -rf ./dist/
npx tsc
mv ./dist/src/app ./dist/
rmdir ./dist/src