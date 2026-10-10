FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for monorepo and sharp
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install

COPY . .

WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED 1

CMD ["pnpm", "dev"]
