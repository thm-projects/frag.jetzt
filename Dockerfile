# DEVELOPMENT STAGE
FROM node:16 AS DEV

ARG USER='1000:1000'
ARG BASEDIR=/src

RUN mkdir -p ${BASEDIR} && chown -R ${USER} ${BASEDIR}

COPY .docker/entrypoint.sh /entrypoint.sh

USER ${USER}
VOLUME ${BASEDIR}
ENV HOME=${BASEDIR}
WORKDIR ${BASEDIR}/app

ENTRYPOINT ["/entrypoint.sh"]

# BUILD STAGE
FROM node:16 AS BUILD

WORKDIR /src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --prod

# SERVE STAGE
FROM nginx:stable-alpine AS SERVE

# This hard-coded configuration can be overwritten with a volume at runtime
COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=BUILD /src/app/dist /var/www/frag.jetzt
