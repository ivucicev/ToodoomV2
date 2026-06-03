# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Build tools for better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy pre-built node_modules (native addons already compiled in builder)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/households.db

EXPOSE 3000

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

CMD ["node", "dist/server.cjs"]
