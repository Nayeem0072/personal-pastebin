FROM oven/bun:1-alpine AS base
WORKDIR /app

# Fonts required by resvg for OG image text rendering
RUN apk add --no-cache fontconfig ttf-dejavu

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src/ ./src/
COPY tsconfig.json ./

# Data directory for SQLite
RUN mkdir -p /data

EXPOSE 3001

ENV NODE_ENV=production
ENV DB_PATH=/data/pastebin.db

CMD ["bun", "run", "start"]
