# Instagram OAuth Configuration Guide

## Current Configuration Status

✅ **Server Configuration**: Complete
- OAUTH_BASE_URL: `https://insta-flows-nirmal40.replit.app`
- Instagram App ID: `4224943747791118`
- Instagram App Secret: Configured
- OAuth Redirect URI: `https://insta-flows-nirmal40.replit.app/api/auth/instagram/callback`

## Required: Instagram App Dashboard Setup

⚠️ **Action Required**: You must configure the redirect URI in your Meta App Dashboard for OAuth to work.

### Step-by-Step Instructions

1. **Access Meta for Developers**
   - Go to: https://developers.facebook.com/apps/
   - Login with your Meta account

2. **Select Your App**
   - Find and click on your app (ID: 4224943747791118)
   - Direct link: https://developers.facebook.com/apps/4224943747791118/

3. **Navigate to Instagram Business Login Settings**
   - In the left sidebar, click **"Instagram"**
   - Click **"API setup with Instagram login"**
   - Scroll to **"3. Set up Instagram business login"**
   - Click on **"Business login settings"**

4. **Add OAuth Redirect URI**
   - Find the **"OAuth redirect URIs"** field
   - Click **"Add redirect URI"** (or the + button)
   - Add this EXACT URL (copy and paste):
     ```
     https://insta-flows-nirmal40.replit.app/api/auth/instagram/callback
     ```
   - Click **"Save Changes"**

5. **Verify Configuration**
   - Make sure the URL shows in the list of valid redirect URIs
   - The URL must match exactly (case-sensitive, including https://)

### Common Issues

**"Invalid redirect_uri" Error**
- The redirect URI in Instagram App Dashboard doesn't match exactly
- Solution: Verify the URL is exactly: `https://insta-flows-nirmal40.replit.app/api/auth/instagram/callback`

**Development vs Production**
- Production URL (for users): `https://insta-flows-nirmal40.replit.app`
- Dev URL (for testing): `https://09f2ccf1-5863-4900-9eba-2f9647ca12b6-00-2os2dayqusdpb.spock.replit.dev`
- You can add both if needed, but production is recommended

### Testing the OAuth Flow

After configuring the Instagram App Dashboard:

1. Login to your InstaFlow app
2. Go to "Accounts" page
3. Click "Connect Account"
4. Click "Connect with Instagram"
5. You should be redirected to Instagram authorization
6. Authorize the app
7. You'll be redirected back with your account connected

### OAuth Scopes

The following permissions are requested:
- `instagram_business_basic` - Basic profile information
- `instagram_business_manage_messages` - Manage direct messages
- `instagram_business_manage_comments` - Manage comments
- `instagram_business_content_publish` - Publish content

### Token Management

- **Short-lived tokens**: Valid for 1 hour
- **Long-lived tokens**: Valid for 60 days (auto-exchanged)
- Tokens are automatically refreshed when possible

### Security

- Users must be logged in before connecting Instagram
- Tokens are stored securely in the database
- Each Instagram account is linked to the authenticated user
- Session-based authentication with CSRF protection
