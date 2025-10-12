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
    
    const baseUrl = process.env.OAUTH_BASE_URL || 
      (process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000');
    
    this.callbackUrl = `${baseUrl}/api/webhooks/instagram`;
  }

  async subscribeToWebhooks(instagramUserId: string, accessToken: string): Promise<boolean> {
    try {
      console.log(`Subscribing webhooks for Instagram account: ${instagramUserId}`);
      
      // Per Instagram documentation: POST /{instagram-account-id}/subscribed_apps
      // Note: Uses graph.facebook.com, not graph.instagram.com
      const subscribeUrl = `https://graph.facebook.com/v24.0/${instagramUserId}/subscribed_apps`;
      
      const response = await fetch(subscribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          subscribed_fields: 'comments,messages,mentions,story_insights,live_comments,message_reactions,messaging_postbacks',
          access_token: accessToken,
        }).toString(),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ Webhooks subscribed successfully for account ${instagramUserId}`);
        return true;
      } else {
        console.error(`❌ Failed to subscribe webhooks for account ${instagramUserId}:`, data);
        
        // Check if it's a permissions error
        if (data.error && data.error.code === 200) {
          console.log("\n⚠️ Permissions issue detected.");
          console.log("Make sure your app has the following permissions:");
          console.log("- instagram_business_basic");
          console.log("- instagram_business_manage_comments");
          console.log("- instagram_business_manage_messages");
        }
        
        // Provide manual setup instructions
        console.log("\n=== MANUAL WEBHOOK SETUP (Required) ===");
        console.log(`1. Go to: https://developers.facebook.com/apps/${this.appId}/webhooks/`);
        console.log('2. Select "Instagram" as the object type');
        console.log(`3. Callback URL: ${this.callbackUrl}`);
        console.log(`4. Verify Token: ${this.verifyToken}`);
        console.log('5. Subscribe to fields: comments, messages, mentions, story_insights');
        console.log('6. Click "Verify and Save"');
        
        return false;
      }
    } catch (error) {
      console.error("Error subscribing to webhooks:", error);
      return false;
    }
  }

  async checkWebhookSubscription(instagramUserId: string, accessToken: string): Promise<any> {
    try {
      // Check account-level subscriptions
      // GET /{instagram-account-id}/subscribed_apps
      // Note: Uses graph.facebook.com, not graph.instagram.com
      const checkUrl = `https://graph.facebook.com/v24.0/${instagramUserId}/subscribed_apps`;
      
      const response = await fetch(`${checkUrl}?access_token=${accessToken}`);
      const data = await response.json();
      
      if (response.ok && data.data) {
        const subscribedFields = data.data.length > 0 ? data.data[0].subscribed_fields : [];
        
        return {
          configured: subscribedFields.length > 0,
          subscriptions: subscribedFields,
          accountId: instagramUserId,
          callbackUrl: this.callbackUrl,
        };
      }
      
      // Also check app-level subscriptions as fallback
      const appAccessToken = `${this.appId}|${this.appSecret}`;
      const appResponse = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions?access_token=${appAccessToken}`
      );
      
      const appData = await appResponse.json();
      const instagramSub = appData.data?.find((sub: any) => sub.object === 'instagram');
      
      return {
        configured: !!instagramSub,
        accountSubscriptions: data.data || [],
        appSubscriptions: instagramSub || null,
        callbackUrl: this.callbackUrl,
        note: "Webhook subscriptions can be configured at app-level (Meta Dashboard) or account-level (API)",
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

Your app needs webhook subscriptions configured. There are TWO ways to do this:

METHOD 1: Meta App Dashboard (Recommended - One-time setup for ALL accounts)
------------------------------------------------------------------------
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
   ✓ live_comments
   ✓ message_reactions

5. Click "Verify and Save"

Once configured, webhooks work automatically for ALL connected Instagram accounts!

METHOD 2: API (Per-account subscription - Already automated in this app)
------------------------------------------------------------------------
The app automatically calls POST /{instagram-account-id}/subscribed_apps
when each account connects via OAuth.

Required scopes:
- instagram_business_basic
- instagram_business_manage_comments
- instagram_business_manage_messages

Note: Most apps use METHOD 1 (Meta Dashboard) as it's simpler and works for all accounts.
`;
  }
}

export const webhookService = new InstagramWebhookService();
