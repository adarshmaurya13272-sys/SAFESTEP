FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS dev
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install
COPY . .
WORKDIR /app/apps/api
CMD ["pnpm", "dev"]
