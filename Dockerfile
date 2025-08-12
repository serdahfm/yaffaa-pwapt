# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production
RUN cd web && npm ci
RUN cd server && npm ci

# Copy source code
COPY . .

# Build frontend and backend
RUN cd web && npm run build
RUN cd server && npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/web/dist ./web/dist

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/yafa.db

# Start the server
CMD ["node", "server/dist/index.js"]