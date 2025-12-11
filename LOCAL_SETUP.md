# Local Development Setup Guide

## Issue
The application can't connect to the PostgreSQL database because the remote server at `7za6uc.easypanel.host` is not accessible from your local machine.

## Solutions

### **OPTION 1: Use Free Cloud PostgreSQL (Recommended)**

#### Using Neon (Free Tier - No Credit Card Required)

1. **Sign up for Neon**
   - Go to https://neon.tech
   - Sign up with GitHub or email
   - Create a new project (choose any region close to you)

2. **Get Connection String**
   - After creating project, copy the connection string
   - It looks like: `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`

3. **Update Your .env File**
   ```bash
   DATABASE_URL=<paste-your-neon-connection-string-here>
   ```

4. **Initialize Database**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

#### Using Supabase (Alternative)

1. Go to https://supabase.com
2. Create new project
3. Settings → Database → Connection String → Connection Pooling
4. Copy and use in DATABASE_URL

---

### **OPTION 2: Run PostgreSQL Locally with Docker**

#### Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop/)

#### Steps

1. **Start PostgreSQL Container**
   ```bash
   docker-compose -f docker-compose-local.yml up -d
   ```

2. **Update .env File**
   Copy the local configuration:
   ```bash
   copy .env.local .env
   ```

   Or manually update DATABASE_URL in .env:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/instagram_automation
   ```

3. **Initialize Database**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Stop Database When Done**
   ```bash
   docker-compose -f docker-compose-local.yml down
   ```

---

### **OPTION 3: Install PostgreSQL Natively on Windows**

1. **Download PostgreSQL**
   - Go to https://www.postgresql.org/download/windows/
   - Download installer (PostgreSQL 16 recommended)

2. **Install**
   - Run installer
   - Set password for postgres user (remember this!)
   - Default port: 5432
   - Complete installation

3. **Create Database**
   ```bash
   # Open Command Prompt or PowerShell
   psql -U postgres
   # Enter password when prompted
   
   # In psql:
   CREATE DATABASE instagram_automation;
   \q
   ```

4. **Update .env File**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/instagram_automation
   ```

5. **Initialize Database**
   ```bash
   npm run db:push
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## Quick Troubleshooting

### Connection Still Failing?
- Check if PostgreSQL is running: `docker ps` (for Docker) or Services app (for native)
- Verify DATABASE_URL format: `postgresql://username:password@host:port/database`
- Ensure port 5432 is not blocked by firewall
- For Docker: Make sure Docker Desktop is running

### Database Migration Issues?
- Delete and recreate database:
  ```bash
  # For Docker
  docker-compose -f docker-compose-local.yml down -v
  docker-compose -f docker-compose-local.yml up -d
  npm run db:push
  ```

### Still Need Help?
Check the full installation guide: `INSTALLATION_GUIDE.md`

---

## Recommended for This Project

**For Local Development**: Use **Neon** (Option 1) - Fastest, no installation needed, free tier

**For Production**: Keep using Easypanel or deploy to cloud provider with managed PostgreSQL
