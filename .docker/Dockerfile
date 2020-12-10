# This is some super simple dockerization only for usage in localhost!
# The communication with the Backend will only work with proxy in front!
# From project dir run "docker build -f .docker/Dockerfile -t frag-jetzt ."
FROM node:14 AS builder

WORKDIR /app
COPY . .

RUN npm i
RUN npm run build

FROM nginx:alpine

COPY .docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
