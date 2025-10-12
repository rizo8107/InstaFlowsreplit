import { Express } from "express";

export interface WebhookSubscriptionService {
  // no-op for IG: returns true if app-level subscription exists & account is eligible
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
    const { storage } = await import("./storage");
    const dbSetting = await storage.getSetting("webhook_verify_token");
    return dbSetting?.value || process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "";
  }

  /**
   * IG webhooks are app-level. This method now:
   * 1) Confirms the app is subscribed to the "instagram" object (app-level).
   * 2) Confirms the IG account is eligible (professional + linked to a Page).
   * 3) Confirms the user enabled "Allow access to messages" (best-effort check).
   */
  async subscribeToWebhooks(
    instagramUserId: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      // 1) Verify APP-LEVEL subscription exists
      const appAccessToken = `${this.appId}|${this.appSecret}`;
      const appSubResp = await fetch(
        `https://graph.facebook.com/v24.0/${this.appId}/subscriptions?access_token=${appAccessToken}`,
      );
      const appSubData = await appSubResp.json();

      const igSub = appSubData?.data?.find(
        (s: any) => s.object === "instagram",
      );
      if (!igSub || !igSub.callback_url) {
        console.error(
          "App is NOT subscribed to the Instagram object at the app level.",
        );
        const verifyToken = await this.getVerifyToken();
        console.log("\n=== REQUIRED ONE-TIME SETUP ===");
        console.log(
          `1) App Dashboard → Products → Webhooks → Add "Instagram" object`,
        );
        console.log(`2) Callback URL: ${this.callbackUrl}`);
        console.log(`3) Verify Token: ${verifyToken}`);
        console.log(
          `4) Subscribe to needed fields (messages, comments, mentions, story_insights, etc.)`,
        );
        return false;
      }

      // 2) Check the IG account is professional & linked to a Page
      // Get basic IG account info
      const igInfoResp = await fetch(
        `https://graph.facebook.com/v24.0/${instagramUserId}?fields=id,username,ig_id,account_type&access_token=${accessToken}`,
      );
      const igInfo = await igInfoResp.json();

      const isProfessional =
        igInfo?.account_type === "BUSINESS" ||
        igInfo?.account_type === "CREATOR";

      // Try to discover linked Page (via user/pages then link to ig user)
      // Access token must have pages_show_list/pages_read_engagement
      const pagesResp = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
      );
      const pagesData = await pagesResp.json();
      const pageWithThisIG = pagesData?.data?.find(
        (p: any) => p.instagram_business_account?.id === instagramUserId,
      );

      const hasLinkedPage = !!pageWithThisIG;

      // 3) We cannot read the “Allow access to messages” toggle via API;
      // just surface an actionable hint for the user.
      const messagingAccessNote =
        "Ask user to enable Instagram app → Settings → Privacy → Messages → Connected tools → Allow access to messages.";

      const ok = !!igSub && isProfessional && hasLinkedPage;
      if (!ok) {
        console.error("Eligibility check failed", {
          appSubscriptionFound: !!igSub,
          isProfessional,
          hasLinkedPage,
        });
      }

      return ok;
    } catch (err) {
      console.error("subscribeToWebhooks (no-op) failed:", err);
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
      const pageWithThisIG = pagesData?.data?.find(
        (p: any) => p.instagram_business_account?.id === instagramUserId,
      );

      return {
        appLevel: {
          configured: !!instagramSub,
          subscription: instagramSub || null,
        },
        account: {
          id: instagramUserId,
          username: igInfo?.username,
          account_type: igInfo?.account_type,
          linked_page_id: pageWithThisIG?.id || null,
        },
        callbackUrl: this.callbackUrl,
        notes: [
          "Instagram webhooks are configured at the APP level (Meta Webhooks → Instagram object).",
          "Ensure the IG account is Business/Creator and linked to a Facebook Page.",
          "User must enable: Instagram app → Settings → Privacy → Messages → Connected tools → Allow access to messages.",
        ],
      };
    } catch (error) {
      console.error("Error checking webhook subscription:", error);
      return {
        configured: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getSetupInstructions(): Promise<string> {
    const verifyToken = await this.getVerifyToken();
    return `
=== INSTAGRAM WEBHOOK SETUP (One-time APP-level) ===

1) Meta App Dashboard → Products → Webhooks → Add "Instagram" object
2) Callback URL: ${this.callbackUrl}
3) Verify Token: ${verifyToken}
4) Subscribe to fields you need (e.g., messages, comments, mentions, story_insights, message_reactions, etc.)
5) Put the app in Live mode and make sure permissions are approved:
   instagram_manage_messages, instagram_basic, pages_manage_metadata, pages_read_engagement, pages_show_list, business_management

Per-account "subscribe" via API is NOT required/available for Instagram webhooks.
Route tenants based on IDs in the payload.
`;
  }
}

export const webhookService = new InstagramWebhookService();
