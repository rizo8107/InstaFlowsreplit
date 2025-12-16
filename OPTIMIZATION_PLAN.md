# 🚀 Server Optimization Plan

## 📉 Goal
Reduce server load (CPU/RAM) and associated costs while improving stability.

## 🔍 Identified Issues
1. **No Resource Limits**: Docker containers have unlimited access to host resources, causing high load spikes.
2. **In-Memory Sessions**: `memorystore` uses application RAM for user sessions. This leaks memory over time and prevents scaling.
3. **Heavy Logging**: Each API request body is JSON-stringified, which burns CPU on high-traffic webhooks.
4. **No DB Pooling Config**: Default Postgres connections might be too high or too low.

## 🛠 Proposed Changes

### 1. Docker Compose Resource Limits
Add `deploy.resources` to `docker-compose.yml` to cap usage.
- **App**: Limit to ~1GB RAM, 1.0 CPU.
- **Database**: Limit to ~512MB RAM, 1.0 CPU.
*This prevents the "noisy neighbor" effect and crashes.*

### 2. Switch to Database-Backed Sessions
Migrate from `memorystore` to `connect-pg-simple` using the existing Postgres connection.
- **Benefit**: Frees up Node.js heap memory.
- **Benefit**: Persists logins across server restarts.

### 3. Optimize Logging Middleware
Truncate large JSON bodies in `server/index.ts` before logging.
- **Benefit**: Reduces CPU usage during serialization.

### 4. Database Optimization
Ensure `drizzle-orm` is using a connection pool correctly in `server/db.ts` (verification step).

## 📋 Implementation Steps

### Step 1: Update `docker-compose.yml`
- Add `deploy` section with `resources`.
- Add `logging` configuration to limit log file size (prevents disk fill-up).

### Step 2: Update `server/storage.ts` & `server/index.ts`
- Replace `memorystore` with `connect-pg-simple`.
- Optimize request logger to truncate bodies > 1KB.

### Step 3: Deployment
- Re-build and re-deploy using `docker-compose up -d --build`.

## ✅ Verification
- Memory usage should remain stable.
- CPU spikes during webhooks should decrease.
- Logs should be cleaner.
