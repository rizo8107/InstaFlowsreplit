# Instagram Automation Platform 🤖📸

A comprehensive web-based Instagram automation platform with a visual drag-and-drop flow builder for creating sophisticated automation workflows. Manage multiple Instagram accounts, automate interactions, and streamline communication through a powerful visual interface.

## ✨ Features

- 🎨 **Visual Flow Builder** - Drag-and-drop interface using ReactFlow
- 🔄 **Multi-Account Management** - Manage multiple Instagram accounts
- ⚡ **Real-time Webhooks** - Process Instagram events in real-time
- 🎯 **Condition Logic** - Complex if/else conditions with AND/OR operators
- 💬 **Automated Responses** - DMs, comments, and moderation
- 📊 **Activity Logging** - Track all flow executions
- 🗂️ **Contact Management** - Automatic contact creation from webhooks
- 📚 **Flow Templates** - Pre-built automation templates
- 📱 **Mobile Responsive** - Fully optimized for mobile devices

## 🚀 Quick Start

### Option 1: One-Click Easypanel Deploy

[![Deploy on Easypanel](https://img.shields.io/badge/Deploy-Easypanel-blue)](https://easypanel.io)

1. Login to Easypanel
2. Create from JSON template: `easypanel-template.json`
3. Configure Instagram OAuth credentials
4. Deploy!

[Full Easypanel Guide →](DOCKER_DEPLOYMENT.md#easypanel-one-click-install)

### Option 2: Docker Compose (Recommended for Local)

```bash
# Quick setup
chmod +x setup.sh
./setup.sh

# Or manual setup
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d
```

Access at: http://localhost:5000

[Full Docker Guide →](DOCKER_DEPLOYMENT.md)

### Option 3: Development (Replit)

```bash
npm install
npm run dev
```

## 📋 Prerequisites

### Meta App Setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add Instagram product
4. Copy credentials:
   - App ID → `INSTAGRAM_APP_ID`
   - App Secret → `INSTAGRAM_APP_SECRET`

### OAuth Configuration

In Meta App Dashboard, add OAuth Redirect URI:
```
https://your-domain.com/api/auth/instagram/callback
```

### Webhook Setup (One-Time)

1. Meta Dashboard → Products → Webhooks
2. Subscribe to Instagram object:
   - Callback URL: `https://your-domain.com/api/webhooks/instagram`
   - Verify Token: `zenthra` (hardcoded)
   - Fields: `messages`, `feed`, `mentions`

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Instagram OAuth
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret

# Session
SESSION_SECRET=your_random_secret

# OAuth Base URL
OAUTH_BASE_URL=https://your-domain.com
```

See [.env.example](.env.example) for complete configuration.

## 📚 Documentation

- [Instagram OAuth & Webhook Guide](INSTAGRAM_AUTH_WEBHOOK_GUIDE.md) - Complete authentication & webhook setup
- [Docker Deployment Guide](DOCKER_DEPLOYMENT.md) - Docker & Easypanel deployment
- [Mobile Optimizations](MOBILE_OPTIMIZATIONS.md) - Mobile responsive design details
- [Production Setup](FIXES_AND_NEXT_STEPS.md) - Production deployment checklist

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + Shadcn UI
- ReactFlow (Flow Builder)
- TanStack Query
- Wouter (Routing)

**Backend:**
- Node.js + Express
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon)
- Passport.js (Auth)

**Deployment:**
- Docker + Docker Compose
- Easypanel (One-Click)
- Replit (Development)

### Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   └── lib/         # Utilities
│   └── index.html
├── server/              # Express backend
│   ├── auth.ts         # OAuth & session
│   ├── routes.ts       # API endpoints
│   ├── flow-engine.ts  # Flow execution
│   ├── instagram-api.ts # Instagram API
│   └── storage.ts      # Database layer
├── shared/             
│   └── schema.ts       # Shared types & DB schema
├── Dockerfile          # Production Docker image
├── docker-compose.yml  # Local development
└── easypanel-template.json # Easypanel deployment
```

## 🔐 Security

- ✅ OAuth 2.0 for Instagram authentication
- ✅ Express sessions with PostgreSQL store
- ✅ Password hashing with scrypt
- ✅ Environment-based secrets management
- ✅ Hardcoded webhook verify token (`zenthra`)
- ✅ User data isolation

## 🔄 Database Migrations

Migrations are handled automatically using Drizzle ORM:

```bash
# Development
npm run db:push

# Docker (automatic on startup)
docker-compose up -d

# Manual in Docker
docker-compose exec app npm run db:push
```

**Important**: Never write manual SQL migrations. Always use `npm run db:push`.

## 📊 Monitoring & Logs

### View Logs

```bash
# Docker Compose
docker-compose logs -f app

# Easypanel
# Use built-in log viewer in dashboard
```

### Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## 🧪 Testing

### Test OAuth Flow

1. Register account at `/auth`
2. Go to `/accounts`
3. Click "Connect Instagram Account"
4. Complete Instagram authorization
5. Watch console logs for debug info

### Test Webhooks

1. Connect Instagram account
2. Send a DM to your Instagram
3. Check `/activity` page for execution
4. View logs for webhook processing

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5000
```

### Build for Production

```bash
# Build frontend & backend
npm run build

# Start production server
npm start
```

### Database Management

```bash
# Push schema changes
npm run db:push

# Force push (if conflicts)
npm run db:push -- --force

# Type checking
npm run check
```

## 🐳 Docker Commands

```bash
# Build & start
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Stop services
docker-compose down

# Restart
docker-compose restart [service]

# Shell access
docker-compose exec app sh

# Database backup
docker-compose exec postgres pg_dump -U postgres instaflow > backup.sql
```

## 📈 Scaling

### Easypanel Scaling

1. Go to App Service → Resources
2. Increase replicas
3. Configure load balancing
4. Set up auto-scaling rules

### Resource Limits

Recommended minimum:
- **RAM**: 512MB (app) + 256MB (database)
- **CPU**: 0.5 core (app) + 0.25 core (database)
- **Storage**: 1GB (app) + 10GB (database)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- **Documentation**: See guides in repository
- **Issues**: [GitHub Issues](https://github.com/yourusername/instagram-automation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/instagram-automation/discussions)

## 🙏 Acknowledgments

- [Easypanel](https://easypanel.io) - Modern Docker control panel
- [Replit](https://replit.com) - Development platform
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) - Instagram integration
- [Shadcn UI](https://ui.shadcn.com) - UI components
- [ReactFlow](https://reactflow.dev) - Flow builder library

---

**Built with ❤️ for Instagram automation**

[⭐ Star on GitHub](https://github.com/yourusername/instagram-automation) | [📖 Full Documentation](DOCKER_DEPLOYMENT.md) | [🚀 Deploy Now](https://easypanel.io)
