# Instagram Automation Platform 🤖

A comprehensive web-based Instagram automation platform for managing multiple Instagram accounts with visual drag-and-drop flow builder.

> 📖 **[View Complete Installation Guide →](./INSTALLATION_GUIDE.md)**

## ✨ Features

- 🎨 **Visual Flow Builder** - Drag-and-drop interface for creating automation workflows
- 📱 **Multi-Account Support** - Manage multiple Instagram accounts from one dashboard
- 🎯 **Smart Triggers** - Comment, DM, Mention, and Story Reply triggers
- 🔀 **Condition Logic** - Complex if/else conditions with AND/OR operators
- ⚡ **Actions** - Reply, DM, delete, hide, like, send links, API calls, delays
- 🎬 **Media Filtering** - Visual media picker to target specific posts/reels
- 📊 **Activity Logging** - Track all executions with success/failure status
- 📚 **Template Library** - 12 pre-built automation templates
- 🔐 **User Authentication** - Secure login and session management
- 📞 **Contacts Management** - Auto-save Instagram user contacts

## 🚀 Quick Start

### 📦 Installation Options

| Method | Difficulty | Best For | Documentation |
|--------|-----------|----------|---------------|
| **Replit** | ⭐ Easy | Quick deployment, beginners | [One-click publish](#) |
| **Easypanel** | ⭐⭐ Medium | Production, self-hosting | [EASYPANEL.md](./EASYPANEL.md) |
| **VPS/Cloud** | ⭐⭐⭐ Advanced | Custom infrastructure | [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) |

### Deploy on Replit (Easiest - 1-Click)

1. Click **Publish** button
2. App goes live instantly
3. All features work automatically

### Deploy on Easypanel (Docker)

```bash
# Clone repository
git clone <repo-url>
cd instagram-automation-platform

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Deploy
docker-compose up -d
```

📚 **Full Installation Guide:** [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)

## 📋 Requirements

- Node.js 20+
- PostgreSQL 16+
- Instagram Business Account
- Meta for Developers App

## 🔧 Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migration
npm run db:push

# Start development server
npm run dev
```

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `INSTAGRAM_APP_ID` | Meta App ID | Yes |
| `INSTAGRAM_APP_SECRET` | Meta App Secret | Yes |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Webhook verify token | No (default: zenthra) |

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [Terms of Service](/terms) - Legal terms
- [Privacy Policy](/privacy) - Privacy documentation

## 🎯 How to Use

1. **Deploy the app** - Use Replit Publish or Docker
2. **Configure webhook** - Copy webhook URL, add to Meta for Developers
3. **Connect Instagram** - Add account with Graph API token
4. **Create flow** - Use templates or build custom with visual builder
5. **Activate** - Toggle flow active to start automation
6. **Monitor** - View executions in Activity page

## 🏗️ Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI, ReactFlow
- **Backend**: Express, TypeScript, PostgreSQL
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **API**: Instagram Graph API v24.0

## 📦 Templates Included

1. Auto-Reply to Comments
2. FAQ Auto-Responder
3. Comment Moderation
4. DM Welcome Sequence
5. Lead Generation - Comment to DM
6. Customer Support Triage
7. Influencer Collaboration Response
8. Auto-Like Positive Comments
9. Story Mention Auto-Reply
10. Giveaway Entry Manager
11. Product Launch Hype Builder
12. Negative Comment Alert & Hide

## 🔐 Security

- Environment-based secret management
- Session encryption
- Password hashing with bcrypt
- CSRF protection
- SQL injection prevention

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Replit
