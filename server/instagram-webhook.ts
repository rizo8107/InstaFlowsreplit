import { Express } from "express";

export interface WebhookSubscriptionService {
  subscribeToWebhooks(instagramUserId: string, accessToken: string): Promise<boolean>;
  checkWebhookSubscription(instagramUserId: string, accessToken: string): Promise<any>;
}

export class InstagramWebhookService implements WebhookSubscriptionService {
  private appId: string;
  private appSecret: string;
  private verifyToken: string;
  private callbackUrl: string;

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
    this.verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || '';
    
    // Determine callback URL
    const baseUrl = process.env.OAUTH_BASE_URL || 
      (process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000');
    
    this.callbackUrl = `${baseUrl}/api/webhooks/instagram`;
  }

  async subscribeToWebhooks(instagramUserId: string, accessToken: string): Promise<boolean> {
    try {
      console.log(`Attempting to subscribe webhooks for Instagram user: ${instagramUserId}`);
      
      // For Instagram Graph API v24.0+, webhook subscriptions are managed at the APP level
      // in the Meta App Dashboard, not programmatically per account
      // However, we can verify the app-level subscription exists
      
      // Check if app has webhook subscriptions configured
      const appAccessToken = `${this.appId}|${this.appSecret}`;
      
      // Get app subscriptions
      const subscriptionResponse = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions?access_token=${appAccessToken}`
      );
      
      const subscriptionData = await subscriptionResponse.json();
      console.log("App webhook subscriptions:", JSON.stringify(subscriptionData, null, 2));
      
      if (subscriptionData.data && subscriptionData.data.length > 0) {
        const instagramSubscription = subscriptionData.data.find((sub: any) => sub.object === 'instagram');
        
        if (instagramSubscription) {
          console.log("✅ Instagram webhook subscription exists:", instagramSubscription);
          return true;
        }
      }
      
      // If no subscription exists, we need to create it programmatically
      // Note: This requires the app to have the necessary permissions
      console.log("Attempting to create webhook subscription...");
      
      const createResponse = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            object: 'instagram',
            callback_url: this.callbackUrl,
            verify_token: this.verifyToken,
            fields: 'comments,messages,mentions,story_insights',
            access_token: appAccessToken,
          }).toString(),
        }
      );
      
      const createData = await createResponse.json();
      
      if (createResponse.ok && createData.success) {
        console.log("✅ Webhook subscription created successfully:", createData);
        return true;
      } else {
        console.error("❌ Failed to create webhook subscription:", createData);
        
        // If automatic subscription fails, provide manual setup instructions
        console.log("\n=== MANUAL WEBHOOK SETUP REQUIRED ===");
        console.log("Go to: https://developers.facebook.com/apps/" + this.appId + "/webhooks/");
        console.log("1. Select 'Instagram' as the object");
        console.log("2. Click 'Subscribe to this object'");
        console.log("3. Callback URL:", this.callbackUrl);
        console.log("4. Verify Token:", this.verifyToken);
        console.log("5. Subscribe to: comments, messages, mentions, story_insights");
        
        return false;
      }
    } catch (error) {
      console.error("Error subscribing to webhooks:", error);
      return false;
    }
  }

  async checkWebhookSubscription(instagramUserId: string, accessToken: string): Promise<any> {
    try {
      const appAccessToken = `${this.appId}|${this.appSecret}`;
      
      const response = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions?access_token=${appAccessToken}`
      );
      
      const data = await response.json();
      
      return {
        configured: data.data && data.data.length > 0,
        subscriptions: data.data || [],
        callbackUrl: this.callbackUrl,
        verifyToken: this.verifyToken,
      };
    } catch (error) {
      console.error("Error checking webhook subscription:", error);
      return {
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getSetupInstructions(): string {
    return `
=== INSTAGRAM WEBHOOK SETUP ===

Your app needs webhook subscriptions configured in Meta App Dashboard.

1. Go to: https://developers.facebook.com/apps/${this.appId}/webhooks/

2. Select "Instagram" as the object type

3. Configure webhook:
   - Callback URL: ${this.callbackUrl}
   - Verify Token: ${this.verifyToken}

4. Subscribe to these fields:
   ✓ comments
   ✓ messages  
   ✓ mentions
   ✓ story_insights

5. Click "Verify and Save"

Once configured, Instagram will automatically send webhook events for all
connected Instagram Business accounts to your app.

Note: Webhook subscriptions are at the APP level, not per-account. This means
once you set it up, ALL Instagram accounts that authorize your app will 
automatically send webhooks - just like ManyChat!
`;
  }
}

export const webhookService = new InstagramWebhookService();
