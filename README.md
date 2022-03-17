# frag.jetzt

Nomen est omen: The app's name says it all: it stands for both the app's main purpose and the web address https://frag.jetzt

[![Quality Gate Status](https://scm.thm.de/sonar/api/project_badges/measure?project=de.thm.arsnova%3Afrag-jetzt-frontend&metric=alert_status)](https://scm.thm.de/sonar/dashboard?id=de.thm.arsnova%3Afrag-jetzt-frontend)

# Vision Statement

With our innovative product "frag.jetzt" we want to conquer the market of audience response systems. With "frag.jetzt," we are addressing teachers at schools and universities. With "frag.jetzt," we offer a browser-based, privacy-compliant app for anonymous, silent questioning. The unique selling point is the option to award "good questions" for earning bonuses.

There are three roles in the app: "room creator," "moderator," and "participant." The "moderator" role is assigned by the creator of a room to people who have registered. Also, the moderator role can be temporarily assigned to guests by creating a special room key or link. In each role, questions can be asked anonymously and the questions of others can be read.

After entering the room key or by scanning a QR code, participants can ask their questions and rate others' questions +1 or -1. The question board can be moderated. Room creators or moderators can set a threshold for automatically publishing a question, that is, at what rating a question is displayed on the question board. The threshold can be set between -100 and 0 evaluation points.

An instructor can award bonus points for questions that are on target and lecture-related. Good questions receive a star and the student will find an 8-digit code ("bonus token") for each star earned on the session account. Tokens can be redeemed for bonus points by emailing the instructor.

Instructors and moderators can affirm, deny, answer, star, or ban questions to the moderation board. Questions on the moderation board can also be released. Only room creators can delete questions, but only if they do not have a bonus star. All other users can only delete their own questions.

Every user can sort the question board according to the criteria "newest question first" as well as "downward or upward by rating points". The board can be searched and the questions can be filtered. The following filter criteria are available: Questions with a bonus star, commented or uncommented questions, questions with a bookmark and questions that the user has asked. In addition, the question stream can be paused, i.e. new questions are only displayed if the user releases the question stream again.

Room creators and moderators can define categories ("tags") for questions in the room settings. The person asking the question can then tag their question with one of the predefined categories. Categorized questions can be filtered by clicking on the tag. Room creators and moderators can also tag questions afterwards.

Room creators and moderators have the option to enable all questions for anonymous commenting. The comments then appear as a conversation offset to the side below the respective question.

Each user can call up a message board where their own questions are listed as soon as they have received a reaction: for example, if they have been commented on, answered in the affirmative, denied, banned, published or deleted.

Any number of rooms can be created as guest or registered user. Only the rooms of registered users remain permanently. 180 days after the last use of a room it will be deleted automatically. Bonus tokens of unregistered participants are only stored in the browser cache. If the browser cache is deleted, the tokens are lost. Before leaving a session as an unregistered person, they will be asked to export their acquired tokens as a mail draft or save them to the clipboard.

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
