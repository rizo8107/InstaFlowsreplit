# Instagram Automation Platform - Production Dockerfile
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Make sure npm doesn't omit dev deps due to environment defaults
ENV NPM_CONFIG_PRODUCTION=false
RUN npm config set production false
# Install ALL deps including dev (vite, esbuild, typescript, etc.)
RUN npm ci --include=dev

# Copy application files
COPY . .

# Build the frontend
RUN npm run build

# Prune dev dependencies for a slimmer runtime image
RUN npm prune --omit=dev

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application without relying on dev-only cross-env
CMD ["node", "dist/index.js"]
