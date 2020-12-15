FROM gradle:5.3.1-jdk8

USER 0

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /frag

ENTRYPOINT ["/frag/analysis/entrypoint.sh"]
