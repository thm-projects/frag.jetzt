# frag.jetzt development with docker

frag.jetzt consists of a variety of backend services. Starting them all individually or installing them on the computer is complex, which is why there is a docker compose solution for this.

## Prerequisite

The following software has to be installed on your computer:
* [Docker](https://docs.docker.com/engine/install/)
* [Docker-Compose](https://docs.docker.com/compose/install/)
* [NodeJS](https://nodejs.org/) (LTS v16)
* [Angular CLI](https://cli.angular.io/) (Version 13)
  * You can install it with node/npm: `npm install -g @angular/cli@13` 

### Prerequisite for Windows

Turn off the conversion of line encodings in git:
* `git config --global core.autocrlf false`

On **Windows 10 Home and older Systems** using the Docker Toolbox you also have to set up port forwarding in your VirtualBox.

Start Docker via the "Docker QuickStart Terminal". In contrast to Docker Desktop, started containers are not accessible via localhost, but via an given IP. In order for frag.jetzt to access the backend in Docker, port forwarding must be set up on the corresponding ports. To do this, the "VirtualBox Manager" must be started. The virtual machine "default" must be configured here.

To set up port forwarding for this VM, proceed as follows:
* Right-click on the VM
* Change
* Network
* Advanced
* Port Forwarding

Forwarding must be entered here for the following ports. The TCP is used as the protocol, host IP and guest IP should remain empty:
* 5432
* 5672
* 15672
* 61613
* 8888
* 8080


## Get the code base

Clone the frag-jetzt repository and the Docker Orchestration repository:
* [frag.jetzt](https://git.thm.de/arsnova/frag.jetzt)
* [Docker Orchestration](https://git.thm.de/arsnova/frag.jetzt-docker-orchestration)

### Install the dependencies
Inside frag.jetzt use `npm ci` to install all dependencies.

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


## Start the Frontend (Webstorm)

If you are using Webstorm, open the frag.jetzt repository in Webstorm now. Apply the installation of npm packages. When it is finished, you see multiple run configuration in the top bar. First, start the `Angular CLI Server`. It may take a little while. When it is finished, start the `Angular Application`.

## Start the Frontend (CLI)

If you are not using Webstorm, you may start your Frontend via Terminal. Inside the frag.jetzt repository, run `npm run start`.

## Access frag.jetzt

If you did not change any ports, the application is now available under [localhost:4200](http://localhost:4200).
