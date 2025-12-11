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

# Install ALL deps including dev (vite, esbuild, typescript, drizzle-kit)
RUN npm ci --include=dev

# Copy application files
COPY . .

# Build the frontend
RUN npm run build

# Note: Keep drizzle-kit available for migrations
# Don't prune dev dependencies to keep drizzle-kit and tsx

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
