// Test script to verify Instagram OAuth configuration
const baseUrl = process.env.OAUTH_BASE_URL || 
  (process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000');

const redirectUri = `${baseUrl}/api/auth/instagram/callback`;
const appId = process.env.INSTAGRAM_APP_ID;

const authUrl = new URL("https://www.instagram.com/oauth/authorize");
authUrl.searchParams.set("client_id", appId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
].join(","));

console.log("\n=== Instagram OAuth Configuration Test ===\n");
console.log("Base URL:", baseUrl);
console.log("Redirect URI:", redirectUri);
console.log("App ID:", appId);
console.log("\nFull Authorization URL:");
console.log(authUrl.toString());
console.log("\n=== Configuration Check ===");
console.log("✓ OAUTH_BASE_URL:", process.env.OAUTH_BASE_URL ? "SET" : "NOT SET");
console.log("✓ INSTAGRAM_APP_ID:", process.env.INSTAGRAM_APP_ID ? "SET" : "NOT SET");
console.log("✓ INSTAGRAM_APP_SECRET:", process.env.INSTAGRAM_APP_SECRET ? "SET" : "NOT SET");
console.log("\n=== Required Instagram App Dashboard Setup ===");
console.log("Add this EXACT redirect URI to your Instagram App Dashboard:");
console.log(`\n  ${redirectUri}\n`);
console.log("Location: Instagram > API setup with Instagram login > Business login settings > OAuth redirect URIs");
