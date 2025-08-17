# Multi-stage Dockerfile for YAFA Engine
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 yafa

# Copy built application
COPY --from=builder --chown=yafa:nodejs /app/dist ./dist
COPY --from=builder --chown=yafa:nodejs /app/package*.json ./
COPY --from=builder --chown=yafa:nodejs /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p data logs uploads && chown -R yafa:nodejs data logs uploads

# Switch to non-root user
USER yafa

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require(\"http\").get(\"http://localhost:3000/health\", (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]
