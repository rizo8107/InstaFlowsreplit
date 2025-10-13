# Environment-Specific Authentication Setup

## Overview
The Instagram automation platform now features environment-specific authentication controls that allow you to disable registration and OAuth flows in production while keeping them available during development.

## What Was Changed

### 1. **Backend Changes**

#### Registration Endpoint Protection
**File:** `server/auth.ts`

The `/api/register` endpoint now blocks registration in production:

```typescript
app.post("/api/register", async (req, res, next) => {
  // Block registration in production
  if (process.env.NODE_ENV === 'production') {
    console.log("🚫 Registration attempt blocked - endpoint disabled in production");
    return res.status(403).json({ 
      error: "Registration is disabled in production",
      message: "Please contact an administrator for account access"
    });
  }
  // ... rest of registration logic
});
```

#### Instagram OAuth Endpoint Protection
**Files:** `server/auth.ts`

Both OAuth endpoints are now disabled in production:

1. **Initial OAuth redirect** (`/api/auth/instagram`):
```typescript
app.get("/api/auth/instagram", (req, res) => {
  // Block OAuth flow in production
  if (process.env.NODE_ENV === 'production') {
    console.log("🚫 Instagram OAuth attempt blocked - endpoint disabled in production");
    return res.status(403).json({ 
      error: "Instagram OAuth is disabled in production",
      message: "Please use manual account connection"
    });
  }
  // ... rest of OAuth logic
});
```

2. **OAuth callback** (`/api/auth/instagram/callback`):
```typescript
app.get("/api/auth/instagram/callback", async (req, res) => {
  try {
    // Block OAuth callback in production
    if (process.env.NODE_ENV === 'production') {
      console.log("🚫 Instagram OAuth callback blocked - endpoint disabled in production");
      return res.redirect("/accounts?error=oauth_disabled");
    }
    // ... rest of callback logic
  } catch (error) { ... }
});
```

#### Configuration Endpoint
**File:** `server/auth.ts`

New endpoint to check if OAuth and registration are available:

```typescript
app.get("/api/auth/config", (req, res) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.json({
    oauthEnabled: isDevelopment,
    registrationEnabled: isDevelopment,
    environment: process.env.NODE_ENV || 'development'
  });
});
```

### 2. **Frontend Changes**

#### Accounts Page
**File:** `client/src/pages/accounts.tsx`

The accounts page now:
1. Fetches auth configuration to check if OAuth is enabled
2. Conditionally shows the OAuth button only in development
3. Shows manual connection form directly in production (without the `<details>` dropdown)

```typescript
// Fetch auth config
const { data: authConfig } = useQuery<{
  oauthEnabled: boolean;
  registrationEnabled: boolean;
  environment: string;
}>({
  queryKey: ["/api/auth/config"],
});

// Conditional rendering
{authConfig?.oauthEnabled && (
  <Button onClick={() => window.location.href = "/api/auth/instagram"}>
    Connect with Instagram
  </Button>
)}

// Manual form: Advanced (dev) vs Primary (production)
{authConfig?.oauthEnabled ? (
  <details>
    <summary>Advanced: Manual Configuration</summary>
    {/* Manual form fields */}
  </details>
) : (
  <div>
    {/* Manual form fields - shown directly */}
  </div>
)}
```

#### Auth Page
**File:** `client/src/pages/auth.tsx`

The login/registration page now:
1. Fetches auth configuration
2. Hides the "Sign up" toggle button in production

```typescript
// Fetch auth config
const { data: authConfig } = useQuery<{
  oauthEnabled: boolean;
  registrationEnabled: boolean;
  environment: string;
}>({
  queryKey: ["/api/auth/config"],
});

// Conditional toggle button
{authConfig?.registrationEnabled && (
  <Button onClick={() => setIsLogin(!isLogin)}>
    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
  </Button>
)}
```

## How It Works

### Development Environment (`NODE_ENV=development`)
- ✅ Registration available
- ✅ Instagram OAuth available
- ✅ Manual account connection available
- UI shows: OAuth button + Manual form (advanced option)

### Production Environment (`NODE_ENV=production`)
- ❌ Registration blocked (403 error)
- ❌ Instagram OAuth blocked (403 error)
- ✅ Manual account connection available
- UI shows: Manual form only (primary option)

## Environment Setup

### Development (Replit Preview)
```bash
# Automatically set by `npm run dev` via cross-env
NODE_ENV=development
```

### Production
```bash
# Set this environment variable when deploying
NODE_ENV=production
```

## Security Benefits

1. **Controlled User Access**: In production, only administrators can create accounts (you control who gets access)
2. **Reduced Attack Surface**: OAuth endpoints are not exposed in production
3. **Simplified Production Setup**: No need to configure OAuth callbacks for production deployments
4. **Manual Control**: Production users connect via access tokens, giving you audit trail

## API Endpoints

| Endpoint | Development | Production |
|----------|------------|------------|
| `POST /api/register` | ✅ Allowed | ❌ Blocked (403) |
| `GET /api/auth/instagram` | ✅ Allowed | ❌ Blocked (403) |
| `GET /api/auth/instagram/callback` | ✅ Allowed | ❌ Blocked (403) |
| `GET /api/auth/config` | ✅ Returns config | ✅ Returns config |
| `POST /api/login` | ✅ Allowed | ✅ Allowed |
| `POST /api/accounts` (manual) | ✅ Allowed | ✅ Allowed |

## Testing

### Test in Development
1. Go to `/auth` - should see "Sign up" toggle
2. Go to `/accounts` - should see OAuth button
3. Check `/api/auth/config` - should return `oauthEnabled: true`

### Test in Production
1. Set `NODE_ENV=production`
2. Go to `/auth` - should NOT see "Sign up" toggle
3. Go to `/accounts` - should NOT see OAuth button, only manual form
4. Check `/api/auth/config` - should return `oauthEnabled: false`
5. Try to access `/api/register` - should return 403
6. Try to access `/api/auth/instagram` - should return 403

## Migration Guide

If you have existing production deployments:

1. **Set Environment Variable:**
   ```bash
   NODE_ENV=production
   ```

2. **Create Admin Account (if needed):**
   - Temporarily set `NODE_ENV=development`
   - Create admin accounts via `/api/register`
   - Switch back to `NODE_ENV=production`

3. **User Instructions:**
   - In production, users must manually add Instagram accounts
   - They need to obtain access tokens from Meta Developer Portal
   - Guide users through manual connection process

## Files Modified

### Backend
- `server/auth.ts` - Added environment checks to registration and OAuth endpoints, added config endpoint

### Frontend
- `client/src/pages/accounts.tsx` - Conditional OAuth UI rendering
- `client/src/pages/auth.tsx` - Conditional registration toggle rendering

### Documentation
- `replit.md` - Updated with environment-specific security documentation
- `ENV_SPECIFIC_AUTH_SETUP.md` - This file (comprehensive guide)

## Summary

The platform now has environment-aware authentication controls that provide:
- **Enhanced security** in production by disabling registration and OAuth
- **Development flexibility** with full OAuth and registration support
- **Graceful UI adaptation** based on environment configuration
- **Clear admin control** over who can access the production system

All changes are backward compatible and automatically adapt based on the `NODE_ENV` environment variable.
