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
}

export class InstagramWebhookService implements WebhookSubscriptionService {
  private appId: string;
  private appSecret: string;
  private callbackUrl: string;

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || "";
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || "";

    const baseUrl =
      process.env.OAUTH_BASE_URL ||
      (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "http://localhost:5000");

    this.callbackUrl = `${baseUrl}/api/webhooks/instagram`;
  }

  private async getVerifyToken(): Promise<string> {
    // Hardcoded webhook verify token for all environments
    return "zenthra";
  }

  /**
   * Phase 2 Automation: Automatically subscribe Facebook Page to webhooks
   * 
   * Instagram webhooks require TWO steps:
   * 1) App-level subscription (Phase 1 - manual, one-time in Meta Dashboard)
   * 2) Page-level subscription (Phase 2 - automatic, per-account)
   * 
   * This method:
   * 1) Verifies app-level Instagram webhook subscription exists
   * 2) Gets the Facebook Page ID and Page Access Token
   * 3) Subscribes the Page to webhook fields (messages, feed, mentions)
   */
  async subscribeToWebhooks(
    instagramUserId: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      console.log("\n🔄 Starting automatic webhook subscription...");
      
      // 1) Verify APP-LEVEL subscription exists (Phase 1 must be done first)
      const appAccessToken = `${this.appId}|${this.appSecret}`;
      const appSubResp = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions?access_token=${appAccessToken}`,
      );
      const appSubData = await appSubResp.json();

      const igSub = appSubData?.data?.find(
        (s: any) => s.object === "instagram",
      );
      if (!igSub || !igSub.callback_url) {
        console.error("❌ App is NOT subscribed to Instagram webhooks at app level.");
        const verifyToken = await this.getVerifyToken();
        console.log("\n=== PHASE 1: REQUIRED ONE-TIME SETUP (Do this in Meta Dashboard) ===");
        console.log(`1) App Dashboard → Products → Webhooks → Add "Instagram" object`);
        console.log(`2) Callback URL: ${this.callbackUrl}`);
        console.log(`3) Verify Token: ${verifyToken}`);
        console.log(`4) Subscribe to fields: messages, comments, mentions`);
        console.log("======================================================================\n");
        return false;
      }

      console.log("✅ Phase 1 complete: App-level subscription exists");
      console.log(`   Subscribed fields: ${igSub.fields?.join(', ') || 'unknown'}`);

      // 2) Get Facebook Page ID and Page Access Token
      console.log("\n📄 Fetching Facebook Page details...");
      const pagesResp = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`,
      );
      const pagesData = await pagesResp.json();

      if (pagesData.error) {
        console.error("❌ Failed to fetch Facebook Pages:", pagesData.error.message);
        console.log("   Make sure the user granted 'pages_show_list' permission during OAuth");
        return false;
      }

      // Find the Page that manages this Instagram account
      const pageWithThisIG = pagesData?.data?.find(
        (p: any) => p.instagram_business_account?.id === instagramUserId,
      );

      if (!pageWithThisIG) {
        console.error("❌ No Facebook Page found linked to Instagram account:", instagramUserId);
        console.log("   Available Pages:", pagesData?.data?.map((p: any) => ({
          name: p.name,
          id: p.id,
          ig_account: p.instagram_business_account?.id
        })));
        return false;
      }

      console.log(`✅ Found linked Facebook Page: "${pageWithThisIG.name}" (${pageWithThisIG.id})`);

      // 3) Subscribe the Page to webhook fields
      console.log("\n🔔 Subscribing Page to webhook fields...");
      const subscribeResp = await fetch(
        `https://graph.facebook.com/v24.0/${pageWithThisIG.id}/subscribed_apps?` +
        `subscribed_fields=messages,feed,mentions&` +
        `access_token=${pageWithThisIG.access_token}`,
        { method: 'POST' }
      );

      const subscribeData = await subscribeResp.json();

      if (!subscribeResp.ok || !subscribeData.success) {
        console.error("❌ Page subscription failed:", subscribeData);
        return false;
      }

      console.log("✅ Page successfully subscribed to webhook fields!");
      console.log("   The app will now receive events for this Instagram account\n");

      return true;
    } catch (err) {
      console.error("❌ Webhook subscription error:", err);
      return false;
    }
  }

  /**
   * Returns current status:
   * - Whether app-level IG webhook subscription exists
   * - Which fields are subscribed at app level
   * - Basic account eligibility hints
   */
  async checkWebhookSubscription(
    instagramUserId: string,
    accessToken: string,
  ): Promise<any> {
    try {
      const appAccessToken = `${this.appId}|${this.appSecret}`;
      const appResponse = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions?access_token=${appAccessToken}`,
      );
      const appData = await appResponse.json();
      const instagramSub = appData?.data?.find(
        (sub: any) => sub.object === "instagram",
      );

      // Best-effort IG account status
      const igInfoResp = await fetch(
        `https://graph.facebook.com/v24.0/${instagramUserId}?fields=id,username,account_type&access_token=${accessToken}`,
      );
      const igInfo = await igInfoResp.json();

      const pagesResp = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
      );
      const pagesData = await pagesResp.json();
      const linkedPage = pagesData?.data?.find(
        (p: any) => p.instagram_business_account?.id === instagramUserId,
      );

      return {
        appLevelSubscription: {
          exists: !!instagramSub,
          callbackUrl: instagramSub?.callback_url,
          fields: instagramSub?.fields || [],
        },
        account: {
          id: igInfo?.id,
          username: igInfo?.username,
          accountType: igInfo?.account_type,
          isProfessional:
            igInfo?.account_type === "BUSINESS" ||
            igInfo?.account_type === "CREATOR",
          linkedPage: linkedPage
            ? { id: linkedPage.id, name: linkedPage.name }
            : null,
        },
      };
    } catch (err) {
      console.error("checkWebhookSubscription error:", err);
      return { error: String(err) };
    }
  }

  async getSetupInstructions(): Promise<string> {
    const verifyToken = await this.getVerifyToken();
    return `
Instagram Webhook Setup Instructions:
=====================================
1. Go to Meta App Dashboard → Products → Webhooks
2. Select "Instagram" as the object type
3. Configure:
   - Callback URL: ${this.callbackUrl}
   - Verify Token: ${verifyToken}
4. Subscribe to fields: messages, comments, mentions
5. Each connected Instagram account needs its linked Facebook Page subscribed (automatic)

Note: Instagram webhooks work through Facebook Pages.
When a user connects their Instagram account, the system will automatically
subscribe their Facebook Page to receive webhook events.
    `.trim();
  }
}

export const webhookService = new InstagramWebhookService();
