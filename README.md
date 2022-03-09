# frag.jetzt

Nomen est omen: The app's name says it all: it stands for both the app's main purpose and the web address https://frag.jetzt

## frag.jetzt development with docker

frag.jetzt consists of a variety of backend services. Starting them all individually or installing them on the computer is complex, which is why there is a docker compose solution for this.

### Prerequisite

The following software has to be installed on your computer:

1. GNU/Linux compliant operating system, for example:
    1. Debian based: Debian, Ubuntu, Mint, ...
    2. Arch based: Arch, Manjaro, ...
    3. Red Hat based: Red Hat, RHEL, Fedora, CentOS, ...
    4. ...
2. Docker
    1. [Installation Instructions](https://docs.docker.com/engine/install/)
    2. [Docker Reference](https://docs.docker.com/reference/)
3. Docker Compose
    1. [Installation Instructions](https://docs.docker.com/compose/install/)
    2. [Docker Compose Reference](https://docs.docker.com/compose/reference/)

#### Prerequisite for other OS's

**We strongly recommend that you use a GNU/Linux compliant OS! Despite many optimizations, frag.jetzt doesn't run nearly as fast on Windows or MacOS as it does on a GNU/Linux OS!**

##### Windows

Turn off the conversion of line encodings in git.

```bash
git config --global core.autocrlf false
```

Follow the Instructions for windows described in the [Docker Orchestration repository](https://git.thm.de/arsnova/frag.jetzt-docker-orchestration).

##### MacOS

Install the GNU Core Utilities.

### Get the code base

Clone the frag-jetzt repository and the Docker Orchestration repository:
* [frag.jetzt](https://git.thm.de/arsnova/frag.jetzt)
* [Docker Orchestration](https://git.thm.de/arsnova/frag.jetzt-docker-orchestration)

### Start the Backend services

Follow the steps described in the [Docker Orchestration repository](https://git.thm.de/arsnova/frag.jetzt-docker-orchestration).

Use the `--no-frontend` option so that the frontend does not spin up in Docker Orchestration.

### Start the Frontend

The frag.jetzt frontend ships with an easy setup script: `.docker/setup.sh`. To run the setup script, make sure it is executable. If it is not, make it executable:

```bash
chmod u+x .docker/setup.sh
```

Now, run the setup script:

```bash
./.docker/setup.sh
```

You may now start the frontend. Use following commands:

```bash
# Start the app in foreground (not recommended)
docker-compose up

# Start the app in background
docker-compose up -d

# Show and follow the logs
docker-compose logs -f

# Shutdown app
docker-compose down

# Shutdown app and remove volumes
docker-compose down -v
```

## Access frag.jetzt

If you did not change any ports, the application is now available under [localhost:4200](http://localhost:4200).

All emails from the system are intercepted and can be viewed in the Mailhog interface at [localhost:8025](http://localhost:8025/).

## Code style analysis

To run a local code style check with sonarqube, follow these steps:

1. switch into the analysis folder  
  `cd analysis`
2. start the sonarqube server  
  `docker-compose up -d sonarqube`
3. when sonarqube has started, you may run analysis whenever you want with  
  `docker-compose run --rm analysis`

## Credits

frag.jetzt is powered by Technische Hochschule Mittelhessen | University of Applied Sciences.
