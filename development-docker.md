# frag.jetzt development with docker

frag.jetzt consists of a variety of backend services. Starting them all individually or installing them on the computer is complex, which is why there is a docker compose solution for this.

## Prerequisite

The following software has to be installed on your computer:
* [Docker](https://docs.docker.com/engine/install/)
* [Docker-Compose](https://docs.docker.com/compose/install/)
* [NodeJS](https://nodejs.org/)
* [Angular CLI](https://cli.angular.io/)

## Get the code base

Clone the frag-jetzt repository and the Docker Orchestration repository:
* [frag.jetzt](https://git.thm.de/arsnova/frag.jetzt)
* [Docker Orchestration](https://git.thm.de/swtp-2020/docker-orchestration)

## Start the Backend

Follow the steps described in the Docker Orchestration repository:
* inside the repository, run `./set-env.sh dev`
  * run `chmod +x set-env.sh` and try again, if you see an error, that the file is no executable
* run `docker-compose up` to start the backend services
  * You may stop it by pressing `CTRL + C`
* You could also run it detached by starting it with the `-d` option
  * You may stop it with `docker-compose stop`
* You may stop it and remove the containers with `docker-compose down`
* You may update your images with `docker-compose pull`

## Add a Database

The first time you start your Backend, you have to add a database. You can add a database to couchdb via http:
* `curl -X PUT http://arsnova:arsnova@127.0.0.1:5984/_users`

## Start the Frontend (Webstorm)

If you are using Webstorm, open the frag.jetzt repository in Webstorm now. Apply the installation of npm packages. When it is finished, you see multiple run configuration in the top bar. First, start the `Angular CLI Server`. It may take a little while. When it is finished, start the `Angular Application`.

## Start the Frontend (CLI)

If you are not using Webstorm, you may start your Frontend via Terminal. Inside of the frag.jetzt repository, run `npm run start`.

## Access frag.jetzt

If you did not change any ports, the application is now available under [localhost:4200](http://localhost:4200).
