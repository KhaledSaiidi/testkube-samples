FROM node:24.15.0-alpine3.23 AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci \
    --omit=dev \
    --workspace=testkube-sample-api \
    --include-workspace-root=false

FROM node:24.15.0-alpine3.23 AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node apps/api/index.mjs ./apps/api/index.mjs

USER node
EXPOSE 8080

CMD ["node", "apps/api/index.mjs"]
