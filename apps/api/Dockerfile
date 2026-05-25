# syntax=docker/dockerfile:1.7
FROM node:22-alpine

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache openssl \
  && corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

RUN DATABASE_URL="postgresql://gatekeeper:gatekeeper@localhost:5432/gatekeeper" pnpm db:generate \
  && pnpm --filter @gatekeeper/shared-config build \
  && pnpm --filter @gatekeeper/shared-types build \
  && pnpm --filter @gatekeeper/shared-validation build \
  && pnpm --filter @gatekeeper/shared-utils build \
  && pnpm --filter @gatekeeper/api build

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
