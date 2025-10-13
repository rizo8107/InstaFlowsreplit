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

# Ensure dev dependencies are installed for build tools (vite, esbuild, etc.)
ENV NODE_ENV=development
# Install dependencies (includes dev deps when NODE_ENV!=production)
RUN npm ci

# Copy application files
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
