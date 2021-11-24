#!/bin/bash

# Abort execution when an error occurs
set -e

# Set working directory properly
cd "$(dirname $0)"
WORKDIR="$(pwd)"

function generateEnvironments {
  if [ $1 == "local" ]; then
    CURRENT_DOMAIN="localhost"
    CURRENT_PORT="4200"
    LOGGING_LEVEL_ROOT="INFO"
  else
    read -p "Domain: " CURRENT_DOMAIN
    CURRENT_PORT="80"
    LOGGING_LEVEL_ROOT="ERROR"
  fi

  APP_MAIL_SENDER_ADDRESS="postmaster@${CURRENT_DOMAIN}"
  SERVER_ROOT_URL="http:\/\/${CURRENT_DOMAIN}:${CURRENT_PORT}\/"
  MAIL_DOMAIN="${CURRENT_DOMAIN}"
  MAIL_HOST="${CURRENT_DOMAIN}"
  ALLOWEDORIGINS="http:\/\/${CURRENT_DOMAIN}:${CURRENT_PORT}"
}

function generateSecrets {
  if [ $1 == "local" ]; then
    POSTGRES_SECRET="fragjetzt"
    RABBITMQ_SECRET="guest"
    JWT_SECRET="secret"
  else
    POSTGRES_SECRET=$(openssl rand --hex 32)
    RABBITMQ_SECRET=$(openssl rand --hex 32)
    JWT_SECRET=$(openssl rand --hex 32)
  fi
}

function createEnvironments {

  # CONFIG ENV
  for FILE in environments/*.template; do
    cat "$FILE" | \
      sed "s/^APP_MAIL_SENDER_ADDRESS=\$/APP_MAIL_SENDER_ADDRESS=${APP_MAIL_SENDER_ADDRESS}/" | \
      sed "s/^SERVER_ROOT_URL=\$/SERVER_ROOT_URL=${SERVER_ROOT_URL}/" | \
      sed "s/^LOGGING_LEVEL_ROOT=\$/LOGGING_LEVEL_ROOT=${LOGGING_LEVEL_ROOT}/" | \
      sed "s/^MAIL_DOMAIN=\$/MAIL_DOMAIN=${MAIL_DOMAIN}/" | \
      sed "s/^MAIL_HOST=\$/MAIL_HOST=${MAIL_HOST}/" | \
      sed "s/^ALLOWEDORIGINS=\$/ALLOWEDORIGINS=${ALLOWEDORIGINS}/" \
    > "${FILE%.template}.env";
  done

  # SECRET ENV
  for FILE in environments/*.template; do
    sed -i "s/^SPRING_RABBITMQ_PASSWORD=\$/SPRING_RABBITMQ_PASSWORD=${RABBITMQ_SECRET}/" "${FILE%.template}.env"
    sed -i "s/^RABBITMQ_DEFAULT_PASS=\$/RABBITMQ_DEFAULT_PASS=${RABBITMQ_SECRET}/" "${FILE%.template}.env"
    sed -i "s/^STOMP_RELAY_PASSWORD=\$/STOMP_RELAY_PASSWORD=${RABBITMQ_SECRET}/" "${FILE%.template}.env"
    sed -i "s/^RABBITMQ_PASSWORD=\$/RABBITMQ_PASSWORD=${RABBITMQ_SECRET}/" "${FILE%.template}.env"
    sed -i "s/^SPRING_R2DBC_PASSWORD=\$/SPRING_R2DBC_PASSWORD=${POSTGRES_SECRET}/" "${FILE%.template}.env"
    sed -i "s/^POSTGRES_PASSWORD=\$/POSTGRES_PASSWORD=${POSTGRES_SECRET}/" "${FILE%.template}.env"
    sed -i "s/^SPRING_JWT_SECRET=\$/SPRING_JWT_SECRET=${JWT_SECRET}/" "${FILE%.template}.env"
    sed -i "s/^SECURITY_JWT_SECRET=\$/SECURITY_JWT_SECRET=${JWT_SECRET}/" "${FILE%.template}.env"
  done

}

generateEnvironments "local"
generateSecrets "local"
createEnvironments
