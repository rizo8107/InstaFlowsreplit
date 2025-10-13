# Node.js Version Error Fix

## Error
```
TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
at Object.resolve (node:path:1097:7)
Node.js v18.20.5
```

## Root Cause
The application uses `import.meta.dirname` which is only available in **Node.js v20.11.0 or higher**. Your environment is running Node.js v18.20.5.

## Solutions

### ✅ Option 1: Update Node.js Version (Recommended)

**If using Docker/Easypanel:**
- The Dockerfile is already configured for Node.js 20.11+
- Rebuild your Docker image: `docker-compose build --no-cache`
- Ensure you're using the latest Dockerfile

**If running locally:**
```bash
# Check your Node version
node --version

# If below v20.11.0, update Node.js:
# Using nvm (recommended)
nvm install 20
nvm use 20

# Using apt (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v20.x.x or higher
```

### ✅ Option 2: Fix Build for Node 18 Compatibility

If you must use Node.js v18, update the build command:

**Manual build fix:**
```bash
# Build frontend
npm run vite build

# Build backend with Node 18 target
npx esbuild server/index.ts \
  --platform=node \
  --target=node18 \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --define:import.meta.dirname='process.cwd()'

# Start
npm start
```

**Note:** This workaround may cause path resolution issues. Upgrading to Node.js 20.11+ is strongly recommended.

### ✅ Option 3: Use Docker (Easiest)

The Docker container is already configured with the correct Node version:

```bash
# Using Docker Compose
docker-compose build --no-cache
docker-compose up -d

# Using Easypanel
# Upload the updated easypanel-template.json
# It will automatically use Node.js 20.11+
```

## Verification

After applying any fix:

```bash
# Check Node version
node --version  # Should be >= v20.11.0

# Test the build
npm run build

# Test the app
npm start

# Or with Docker
docker-compose up -d
docker-compose logs -f app
```

## Docker-Specific Instructions

### Rebuild Docker Image

```bash
# Stop existing containers
docker-compose down

# Rebuild with no cache
docker-compose build --no-cache

# Start fresh
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### Verify Node Version in Container

```bash
# Check Node version inside container
docker-compose exec app node --version

# Should output: v20.x.x (x >= 11)
```

## Easypanel Instructions

1. **Check Base Image**
   - Ensure your Easypanel app is using the updated Docker image
   - The Dockerfile specifies `node:20.11-alpine`

2. **Rebuild on Easypanel**
   - Go to your app in Easypanel
   - Click "Rebuild" or "Deploy"
   - Check deployment logs for Node version

3. **Verify Deployment**
   - Check app logs in Easypanel dashboard
   - Should not see the `ERR_INVALID_ARG_TYPE` error

## Environment Requirements

**Minimum Requirements:**
- Node.js: `>= 20.11.0`
- npm: `>= 10.0.0`

**Check Current Versions:**
```bash
node --version
npm --version
```

## Common Issues

### Issue: Docker still uses old Node version

**Fix:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Easypanel shows old version

**Fix:**
1. Delete the existing deployment
2. Re-upload the updated `easypanel-template.json`
3. Or manually update the base image to `node:20.11-alpine`

### Issue: Local build still fails

**Fix:**
```bash
# Clear node_modules and cache
rm -rf node_modules dist client/dist
npm cache clean --force

# Reinstall with correct Node version
nvm use 20  # or ensure Node 20.11+ is active
npm install
npm run build
```

## Quick Test

After fixing, run this test:

```bash
# Test Node version and build
node -e "console.log(process.version)" && \
npm run build && \
npm start &

# Wait a few seconds then test
sleep 5
curl http://localhost:5000/api/health

# Should return: {"status":"healthy",...}
```

## Summary

**The Fix:**
1. ✅ Dockerfile updated to use `node:20.11-alpine`
2. ✅ Build process includes Node 20 target
3. ✅ Documentation updated with requirements

**What You Need to Do:**
1. Rebuild your Docker image (if using Docker)
2. Or update your Node.js version (if running locally)
3. Verify with `node --version >= 20.11.0`

---

**Need Help?**
- Check: [Node.js Installation Guide](https://nodejs.org/en/download/package-manager)
- Check: [Docker Documentation](https://docs.docker.com/get-docker/)
- Check: Easypanel deployment logs
