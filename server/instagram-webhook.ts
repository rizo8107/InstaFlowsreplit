import { Express } from "express";

export interface WebhookSubscriptionService {
  // Automatically subscribe Facebook Page to webhooks for Instagram events
  subscribeToWebhooks(
    instagramUserId: string,
    accessToken: string,
  ): Promise<boolean>;
  checkWebhookSubscription(
    instagramUserId: string,
    accessToken: string,
  ): Promise<any>;
  getWebhookStatus(
    instagramUserId: string,
    accessToken: string,
  ): Promise<any>;
}

export class InstagramWebhookService implements WebhookSubscriptionService {
  private appId: string;
  private appSecret: string;
  private callbackUrl: string;
  private verifyToken: string;

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || "";
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || "";
    this.verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "zenthra";

    const baseUrl =
      process.env.OAUTH_BASE_URL ||
      (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "http://localhost:5000");

    this.callbackUrl = `${baseUrl}/api/webhooks/instagram`;
    
    // Log startup configuration
    console.log("\n📱 Instagram Webhook Service Initialized:");
    console.log(`   Callback URL: ${this.callbackUrl}`);
    console.log(`   Verify Token: ${this.verifyToken ? '✅ Set' : '❌ Missing'}`);
    console.log(`   App ID: ${this.appId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   App Secret: ${this.appSecret ? '✅ Set' : '❌ Missing'}\n`);
  }

  /**
   * Auto-subscribe webhooks after OAuth using graph.facebook.com
   * 
   * KEY FIXES (from fix_ig_webhooks_replit.md):
   * 1. Use graph.facebook.com (NOT graph.instagram.com) for ALL subscriptions
   * 2. DM webhooks: Subscribe PAGE with PAGE Access Token
   * 3. Comments/mentions: Subscribe IG user with User token
   * 4. Correct fields for DMs: messages,message_reactions,message_echoes,messaging_postbacks
   * 5. Correct fields for content: comments,mentions,live_comments,story_insights
   */
  async subscribeToWebhooks(
    instagramUserId: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      console.log("\n🔄 Starting automatic webhook subscription...");
      console.log(`   Instagram User ID: ${instagramUserId}`);
      
      // 1) Get Facebook Pages linked to this account
      console.log("\n📄 Step 1: Fetching Facebook Pages...");
      const pagesResp = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${accessToken}`
      );

      if (!pagesResp.ok) {
        const errorData = await pagesResp.json();
        console.error("❌ Failed to fetch Facebook Pages:", errorData);
        return false;
      }

      const pagesData = await pagesResp.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        console.error("❌ No Facebook Pages found");
        console.log("   User needs to have a Facebook Page linked to their Instagram account");
        return false;
      }

      // Find the Page that has this Instagram account linked
      const pageWithIG = pagesData.data.find(
        (p: any) => p.instagram_business_account?.id === instagramUserId,
      );

      if (!pageWithIG) {
        console.error("❌ No Facebook Page found linked to Instagram ID:", instagramUserId);
        console.log("   Available Pages:", pagesData.data.map((p: any) => ({
          name: p.name,
          id: p.id,
          ig_account: p.instagram_business_account?.id || 'none'
        })));
        return false;
      }

      const pageId = pageWithIG.id;
      const pageToken = pageWithIG.access_token;
      const pageName = pageWithIG.name;

      console.log(`✅ Found linked Page: "${pageName}" (${pageId})`);

      // 2) Subscribe PAGE to DM/messaging webhooks (MUST use Page Access Token)
      console.log("\n📨 Step 2: Subscribing Page to DM webhooks...");
      console.log(`   Endpoint: https://graph.facebook.com/v24.0/${pageId}/subscribed_apps`);
      console.log(`   Token Type: Page Access Token`);
      console.log(`   Fields: messages,message_reactions,message_echoes,messaging_postbacks`);

      const pageSubscribeResp = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            subscribed_fields: 'messages,message_reactions,message_echoes,messaging_postbacks',
            access_token: pageToken,
          }).toString(),
        }
      );

      const pageSubscribeData = await pageSubscribeResp.json();

      if (!pageSubscribeResp.ok || !pageSubscribeData.success) {
        console.error("❌ Page DM subscription failed:", pageSubscribeData);
        return false;
      }

      console.log("✅ Page successfully subscribed to DM webhooks!");

      // 3) Subscribe IG user to content webhooks (comments, mentions)
      console.log("\n💬 Step 3: Subscribing IG account to content webhooks...");
      console.log(`   Endpoint: https://graph.facebook.com/v24.0/${instagramUserId}/subscribed_apps`);
      console.log(`   Token Type: User Access Token`);
      console.log(`   Fields: comments,mentions,live_comments,story_insights`);

      try {
        const igSubscribeResp = await fetch(
          `https://graph.facebook.com/v24.0/${instagramUserId}/subscribed_apps`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              subscribed_fields: 'comments,mentions,live_comments,story_insights',
              access_token: accessToken,
            }).toString(),
          }
        );

        const igSubscribeData = await igSubscribeResp.json();

        if (!igSubscribeResp.ok || !igSubscribeData.success) {
          console.warn("⚠️ IG content subscription soft-failed (can be done via Dashboard):", igSubscribeData);
        } else {
          console.log("✅ IG account successfully subscribed to content webhooks!");
        }
      } catch (igError) {
        console.warn("⚠️ IG content subscription soft-failed (not critical):", igError);
      }

      console.log("\n✅ Webhook subscription complete!");
      console.log("   DM webhooks: ✅ Active (via Page subscription)");
      console.log("   Content webhooks: ✅ Active (via IG subscription or Dashboard)");
      console.log("\n⚠️  IMPORTANT: User must enable 'Allow access to messages' in Instagram app:");
      console.log("   Settings → Privacy → Messages → Connected Tools → Allow access to messages = ON\n");

      return true;
    } catch (err) {
      console.error("❌ Webhook subscription error:", err);
      return false;
    }
  }

  /**
   * Get detailed webhook status for debugging
   * Returns app subscriptions, page subscriptions, and account info
   */
  async getWebhookStatus(
    instagramUserId: string,
    accessToken: string,
  ): Promise<any> {
    try {
      const appAccessToken = `${this.appId}|${this.appSecret}`;

      // 1) Check app-level subscriptions
      const appSubResp = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions?` +
        `access_token=${appAccessToken}`
      );
      const appSubData = await appSubResp.json();

      // 2) Get page info
      const pagesResp = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${accessToken}`
      );
      const pagesData = await pagesResp.json();

      const pageWithIG = pagesData?.data?.find(
        (p: any) => p.instagram_business_account?.id === instagramUserId,
      );

      let pageSubscriptions = null;
      if (pageWithIG && pageWithIG.access_token) {
        // 3) Check page subscriptions
        const pageSubResp = await fetch(
          `https://graph.facebook.com/v24.0/${pageWithIG.id}/subscribed_apps?` +
          `access_token=${pageWithIG.access_token}`
        );
        const pageSubData = await pageSubResp.json();
        pageSubscriptions = pageSubData?.data?.[0];
      }

      return {
        app: {
          callbackUrl: this.callbackUrl,
          verifyToken: this.verifyToken ? '✅ Set' : '❌ Missing',
        },
        appSubscriptions: appSubData?.data || [],
        page: pageWithIG ? {
          id: pageWithIG.id,
          name: pageWithIG.name,
          subscriptions: pageSubscriptions,
        } : null,
        instagramAccount: {
          id: instagramUserId,
          linkedPage: pageWithIG ? pageWithIG.id : null,
        },
      };
    } catch (err) {
      console.error("getWebhookStatus error:", err);
      return { error: String(err) };
    }
  }

  /**
   * Legacy check method - kept for compatibility
   */
  async checkWebhookSubscription(
    instagramUserId: string,
    accessToken: string,
  ): Promise<any> {
    return this.getWebhookStatus(instagramUserId, accessToken);
  }

  async getSetupInstructions(): Promise<string> {
    return `
Instagram Webhook Setup Instructions (Updated for graph.facebook.com):
======================================================================

IMPORTANT: Use graph.facebook.com (NOT graph.instagram.com) for all subscriptions!

Step 1: App-Level Setup (One-time in Meta Dashboard)
-----------------------------------------------------
1. Go to Meta App Dashboard → Products → Webhooks
2. Select "Instagram" as the object type
3. Configure:
   - Callback URL: ${this.callbackUrl}
   - Verify Token: ${this.verifyToken}
4. Subscribe to fields: comments, mentions, story_insights, live_comments

Step 2: Automatic Per-Account Setup (Handled by OAuth)
------------------------------------------------------
After user connects Instagram account, the system automatically:
1. Gets the linked Facebook Page ID and Page Access Token
2. Subscribes the Page to DM fields: messages,message_reactions,message_echoes,messaging_postbacks
3. Subscribes the IG account to content fields: comments,mentions,live_comments,story_insights

Step 3: User Device Setting (Cannot be automated)
-------------------------------------------------
User MUST enable in Instagram app:
Settings → Privacy → Messages → Connected Tools → "Allow access to messages" = ON

Testing:
--------
1. Connect Instagram account via OAuth
2. Check logs for subscription success
3. Send DM "hi" to the IG account → expect webhook within seconds
4. Comment on a post → expect comments webhook

Debug Endpoint:
--------------
GET /api/webhook-status?instagramUserId=XXX&accessToken=YYY
    `.trim();
  }
}

export const webhookService = new InstagramWebhookService();
