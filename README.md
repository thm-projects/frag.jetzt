# frag.jetzt

Nomen est omen: The app's name says it all: it stands for both the app's main purpose and the web address https://frag.jetzt

## Documentation

* [For developers (docker)](development-docker.md)

## Code style analysis
For a local code style analysis with docker-compose you'll need docker and docker-compose installed.
To run a local code style check with sonarqube, follow these steps:
1. switch into the analysis folder  
  `cd analysis`
2. start the sonarqube server  
  `docker-compose up -d sonarqube`
3. when sonarqube has started, you may run analysis whenever you want with  
  `docker-compose run --rm analysis`

## Credits

frag.jetzt is powered by Technische Hochschule Mittelhessen | University of Applied Sciences.
