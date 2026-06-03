# ── Stage 1: build frontend + server bundle ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Rebuild native modules (better-sqlite3) for the target arch
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Data directory for SQLite DB (mount a volume here)
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/households.db

EXPOSE 3000

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

CMD ["node", "dist/server.cjs"]
