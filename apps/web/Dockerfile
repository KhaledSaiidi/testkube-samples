FROM node:24.15.0-alpine3.23 AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json

RUN CYPRESS_INSTALL_BINARY=0 npm ci \
    --workspace=testkube-sample-web \
    --include-workspace-root=false

COPY apps/web ./apps/web

RUN npm run build --workspace=testkube-sample-web

FROM nginxinc/nginx-unprivileged:1.29.4-alpine3.23 AS runtime

ENV API_UPSTREAM=http://127.0.0.1:8080

COPY apps/web/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build --chown=101:101 /app/apps/web/dist /usr/share/nginx/html

USER 101:101
EXPOSE 8080
