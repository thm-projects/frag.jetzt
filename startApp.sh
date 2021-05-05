#! /bin/sh

cd ../frag.jetzt-docker-orchestration
sudo docker-compose up -d
cd ../topic-cloud
npm start
