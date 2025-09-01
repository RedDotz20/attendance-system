### Multi-stage Dockerfile for building and running the TypeScript server

# Build stage
FROM node:20-alpine AS build
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm run build

# Production stage
FROM node:20-alpine AS prod
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod --frozen-lockfile || true
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
