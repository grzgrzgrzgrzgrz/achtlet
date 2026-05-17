# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

LABEL org.opencontainers.image.title="Achtlet" \
      org.opencontainers.image.description="Installable Android-first PWA for n8n workflow control, executions, and backups." \
      org.opencontainers.image.source="https://github.com/grzgrzgrzgrzgrz/achtlet" \
      org.opencontainers.image.licenses="MIT"

# Install tini for proper signal handling (important for cron jobs)
RUN apk add --no-cache tini wget

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=5000

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Create runtime directories with proper permissions
RUN mkdir -p /app/backups /app/data && chown -R node:node /app /app/backups /app/data

# Switch to non-root user for security
USER node

# Expose port 5000
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/index.js"]
