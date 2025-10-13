# Multi-stage Dockerfile for Instagram Automation Platform
# IMPORTANT: Requires Node.js 20.11.0 or higher for import.meta.dirname support

# Stage 1: Build dependencies and frontend
FROM node:20.11-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build frontend and backend
# Add --target=node20 to esbuild for proper import.meta.dirname support
RUN npm run build || (echo "Build failed. Trying alternative build..." && \
    vite build && \
    npx esbuild server/index.ts --platform=node --target=node20 --packages=external --bundle --format=esm --outdir=dist)

# Stage 2: Production image
FROM node:20.11-alpine AS production

WORKDIR /app

# Install PostgreSQL client for pg_isready
RUN apk add --no-cache postgresql-client

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Copy necessary files
COPY shared ./shared
COPY server ./server
COPY drizzle.config.ts ./
COPY migrations ./migrations

# Install drizzle-kit for migrations
RUN npm install -g drizzle-kit

# Create startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment
ENV NODE_ENV=production

# Start application
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
