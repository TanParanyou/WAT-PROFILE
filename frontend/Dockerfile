# Multi-stage build for Next.js Standalone frontend
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manifests and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for compile-time Next.js public envs
ARG NEXT_PUBLIC_API_URL="http://localhost:8080"
ARG NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS="http://localhost:9000"
ARG NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED="false"
ARG NEXT_PUBLIC_COMMUNITY_ENABLED="false"

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS=$NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS
ENV NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=$NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED
ENV NEXT_PUBLIC_COMMUNITY_ENABLED=$NEXT_PUBLIC_COMMUNITY_ENABLED

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets and standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
