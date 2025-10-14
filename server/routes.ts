import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import type { IStorage } from "./storage";
import type { InsertInstagramAccount, InsertFlow, UpdateFlow, InsertFlowExecution } from "@shared/schema";
import { InstagramAPI } from "./instagram-api";
import { FlowEngine } from "./flow-engine";
import axios from "axios";

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express, storage: IStorage) {
  // Instagram Accounts
  app.get("/api/accounts", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getUserAccounts(req.user!.id);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Instagram OAuth - start
  app.get("/api/auth/instagram/start", requireAuth, async (req, res) => {
    const appId = process.env.INSTAGRAM_APP_ID;
    const baseUrl = process.env.OAUTH_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;
    // Instagram Business Login scopes
    const scopes = [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
    ];
    if (!appId) return res.status(500).send("INSTAGRAM_APP_ID not configured");
    const authorizeUrl = new URL("https://www.instagram.com/oauth/authorize");
    authorizeUrl.searchParams.set("force_reauth", "true");
    authorizeUrl.searchParams.set("client_id", appId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", scopes.join(","));
    res.redirect(authorizeUrl.toString());
  });

  // Instagram OAuth - debug (auth required)
  app.get("/api/auth/instagram/debug", requireAuth, (req, res) => {
    const appId = process.env.INSTAGRAM_APP_ID;
    const baseUrl = process.env.OAUTH_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;
    const scopes = [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
    ];
    res.json({
      authenticated: !!(req.isAuthenticated && req.isAuthenticated()),
      appIdPresent: !!appId,
      appId,
      baseUrl,
      redirectUri,
      scopes,
    });
  });

  // Instagram OAuth - callback
  app.get("/api/auth/instagram/callback", requireAuth, async (req, res) => {
    try {
      // If user isn't logged into our app, fail gracefully instead of throwing later
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized", message: "Please login to the app before connecting Instagram." });
      }
      const code = req.query.code as string | undefined;
      if (!code) return res.status(400).send("Missing code");

      const appId = process.env.INSTAGRAM_APP_ID;
      const appSecret = process.env.INSTAGRAM_APP_SECRET;
      const baseUrl = process.env.OAUTH_BASE_URL || `${req.protocol}://${req.get("host")}`;
      const redirectUri = `${baseUrl}/api/auth/instagram/callback`;
      if (!appId || !appSecret) return res.status(500).send("Instagram app credentials not configured");

      // Step 1: Exchange code for short-lived IG User token
      const shortResp = await axios.post(
        "https://api.instagram.com/oauth/access_token",
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      // Some responses may return { data: [ { access_token, user_id, permissions } ] }
      const tokenBlock = shortResp.data?.data?.[0] || shortResp.data || {};
      const shortLivedToken = tokenBlock?.access_token as string | undefined;
      const igUserId = String(tokenBlock?.user_id || shortResp.data?.user_id || "");
      if (!shortLivedToken || !igUserId) {
        console.error("IG OAuth: Missing short-lived token or user_id", shortResp.data);
        throw new Error("Instagram did not return access_token/user_id. Check redirect URI and app configuration.");
      }

      // Step 2: Exchange to long-lived token (60 days)
      const longResp = await axios.get("https://graph.instagram.com/access_token", {
        params: {
          grant_type: "ig_exchange_token",
          client_secret: appSecret,
          access_token: shortLivedToken,
        },
      });
      const longLivedToken = longResp.data?.access_token as string;

      // Fetch IG username using long-lived token
      const meResp = await axios.get("https://graph.instagram.com/me", {
        params: { fields: "id,username", access_token: longLivedToken },
      });
      const username = meResp.data?.username as string | undefined;

      // Save account using IG long-lived token
      const accountData: InsertInstagramAccount = {
        userId: req.user!.id,
        username: username || igUserId,
        instagramUserId: igUserId,
        accessToken: longLivedToken,
        pageId: undefined,
        pageAccessToken: undefined,
        profilePicture: "",
        isActive: true,
      } as any;
      await storage.createAccount(accountData);

      res.redirect("/accounts");
    } catch (error: any) {
      const details = error?.response?.data || { message: error?.message || String(error) };
      console.error("Instagram OAuth callback error:", details);
      res.status(500).json({ error: "OAuthFailed", details });
    }
  });

  app.post("/api/accounts", requireAuth, async (req, res) => {
    try {
      const accountData: InsertInstagramAccount = {
        ...req.body,
        userId: req.user!.id,
      };
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      // Verify account belongs to user
      const existingAccount = await storage.getAccount(req.params.id);
      if (!existingAccount || existingAccount.userId !== req.user!.id) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Remove userId from updates to prevent reassignment
      const { userId, ...updates } = req.body;
      
      const account = await storage.updateAccount(req.params.id, updates);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      // Verify account belongs to user
      const existingAccount = await storage.getAccount(req.params.id);
      if (!existingAccount || existingAccount.userId !== req.user!.id) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const success = await storage.deleteAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/accounts/:id/media", requireAuth, async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Verify account belongs to user
      if (account.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const api = new InstagramAPI(account.accessToken, account.instagramUserId);
      const limit = parseInt(req.query.limit as string) || 25;
      const media = await api.getUserMedia(limit);
      res.json(media);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Flows
  app.get("/api/flows", requireAuth, async (req, res) => {
    try {
      // Get all flows for user's accounts
      const accounts = await storage.getUserAccounts(req.user!.id);
      const accountIds = accounts.map(a => a.id);
      const allFlows = await storage.getAllFlows();
      const flows = allFlows.filter(f => accountIds.includes(f.accountId));
      res.json(flows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/flows/:id", requireAuth, async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.id);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // Verify flow belongs to user's account
      const account = await storage.getAccount(flow.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      res.json(flow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/flows", requireAuth, async (req, res) => {
    try {
      const flowData: InsertFlow = req.body;
      
      // Verify account belongs to user
      const account = await storage.getAccount(flowData.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const flow = await storage.createFlow(flowData);
      res.json(flow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/flows/:id", requireAuth, async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.id);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // Verify flow belongs to user's account
      const account = await storage.getAccount(flow.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // Remove accountId from updates to prevent reassignment
      const { accountId, ...updates } = req.body;
      
      const updatedFlow = await storage.updateFlow(req.params.id, updates as UpdateFlow);
      if (!updatedFlow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      res.json(updatedFlow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/flows/:id", requireAuth, async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.id);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // Verify flow belongs to user's account
      const account = await storage.getAccount(flow.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      const success = await storage.deleteFlow(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Flow not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Executions
  app.get("/api/executions", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getUserAccounts(req.user!.id);
      const accountIds = accounts.map(a => a.id);
      const allExecutions = await storage.getAllExecutions();
      const executions = allExecutions.filter(e => accountIds.includes(e.accountId));
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/recent", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const accounts = await storage.getUserAccounts(req.user!.id);
      const accountIds = accounts.map(a => a.id);
      const allExecutions = await storage.getRecentExecutions(limit * 10); // Get more than needed to filter
      const executions = allExecutions.filter(e => accountIds.includes(e.accountId)).slice(0, limit);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/flows/:flowId/executions", requireAuth, async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.flowId);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // Verify flow belongs to user's account
      const account = await storage.getAccount(flow.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      const limit = parseInt(req.query.limit as string) || 20;
      const allExecutions = await storage.getExecutionsByFlow(req.params.flowId);
      const executions = allExecutions.slice(0, limit);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/flows/:flowId/test", requireAuth, async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.flowId);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // Verify flow belongs to user's account
      const account = await storage.getAccount(flow.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(404).json({ error: "Flow not found" });
      }

      const { triggerData } = req.body;
      if (!triggerData) {
        return res.status(400).json({ error: "triggerData is required" });
      }

      console.log(`[Manual Test] Testing flow ${flow.name} with trigger data:`, triggerData);

      const execution = await storage.createExecution({
        flowId: flow.id,
        accountId: account.id,
        triggerType: triggerData.trigger_type || "manual_test",
        triggerData,
        status: "pending",
        executionPath: [],
        errorMessage: null,
      });

      try {
        const api = new InstagramAPI(
          account.accessToken, 
          account.instagramUserId || undefined,
          account.pageId || undefined,
          account.pageAccessToken || undefined
        );
        const engine = new FlowEngine(api, flow, triggerData, execution.id);
        const result = await engine.execute();

        await storage.updateExecution(execution.id, {
          status: result.success ? "success" : "failed",
          executionPath: result.executionPath,
          nodeResults: result.nodeResults as any,
          errorMessage: result.error || null,
        });

        const updatedExecution = await storage.getExecution(execution.id);

        res.json({
          success: result.success,
          executionId: execution.id,
          executionPath: result.executionPath,
          nodeResults: result.nodeResults,
          error: result.error,
          execution: updatedExecution,
        });
      } catch (error: any) {
        const errorMessage = error.message || error.toString() || 'Unknown error occurred';
        console.error(`[Test Execution] Error:`, error);
        
        await storage.updateExecution(execution.id, {
          status: "failed",
          errorMessage,
        });

        res.status(500).json({
          success: false,
          executionId: execution.id,
          error: errorMessage,
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || error.toString() || 'Unknown error occurred';
      console.error(`[Test Endpoint] Error:`, error);
      res.status(500).json({ error: errorMessage });
    }
  });

  // Webhook Events
  app.get("/api/webhook-events", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getUserAccounts(req.user!.id);
      const accountIds = accounts.map(a => a.id);
      const allEvents = await storage.getAllWebhookEvents();
      const events = allEvents.filter(e => e.accountId && accountIds.includes(e.accountId));
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/webhook-events/recent", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const accounts = await storage.getUserAccounts(req.user!.id);
      const accountIds = accounts.map(a => a.id);
      const allEvents = await storage.getRecentWebhookEvents(limit * 10); // Get more than needed to filter
      const events = allEvents.filter(e => e.accountId && accountIds.includes(e.accountId)).slice(0, limit);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Flow Templates
  app.get("/api/templates", requireAuth, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = category
        ? await storage.getTemplatesByCategory(category)
        : await storage.getAllTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates/:id/use", requireAuth, async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const { accountId, name } = req.body;
      if (!accountId || !name) {
        return res.status(400).json({ error: "Account ID and flow name are required" });
      }

      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Verify account belongs to user
      if (account.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const newFlow = await storage.createFlow({
        name: name,
        description: template.description,
        accountId: accountId,
        isActive: false,
        nodes: template.nodes,
        edges: template.edges,
      });

      await storage.incrementTemplateUseCount(req.params.id);
      
      res.json(newFlow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook Token Management
  app.get("/api/webhook-token", requireAuth, async (req, res) => {
    try {
      const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
      res.json({ token: token || null, exists: !!token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook-token/generate", requireAuth, async (req, res) => {
    try {
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      res.json({ 
        token,
        message: "Copy this token and add it to your Replit Secrets as INSTAGRAM_WEBHOOK_VERIFY_TOKEN"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook handler
  app.get("/api/webhooks/instagram", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "zenthra";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  app.post("/api/webhooks/instagram", async (req, res) => {
    try {
      const { object, entry } = req.body;

      console.log("Webhook received:", JSON.stringify(req.body, null, 2));

      if (object !== "instagram") {
        return res.sendStatus(200);
      }

      if (!entry || !Array.isArray(entry)) {
        console.log("No entry array in webhook payload");
        return res.sendStatus(200);
      }

      for (const item of entry) {
        const instagramUserId = item.id;
        console.log("Processing webhook for Instagram user ID:", instagramUserId);
        
        let account = await storage.getAccountByUserId(instagramUserId);

        if (!account) {
          console.log("No account found for Instagram user ID:", instagramUserId);
          
          const accounts = await storage.getAllAccounts();
          const firstActiveAccount = accounts.find(a => a.isActive);
          
          if (firstActiveAccount) {
            console.log("Auto-updating Instagram User ID for account:", firstActiveAccount.username);
            await storage.updateAccount(firstActiveAccount.id, { instagramUserId: instagramUserId });
            account = await storage.getAccount(firstActiveAccount.id);
          }
          
          if (!account) {
            if (accounts.length > 0) {
              await storage.createWebhookEvent({
                accountId: accounts[0].id,
                eventType: "unknown",
                payload: { raw: item, reason: "account_not_found", instagram_user_id: instagramUserId },
                processed: false,
              });
            }
            continue;
          }
        }

        if (!account.isActive) {
          console.log("Account is inactive:", account.username);
          continue;
        }

        // Handle messaging webhooks (DMs)
        if (item.messaging && Array.isArray(item.messaging)) {
          for (const msg of item.messaging) {
            // Skip echo messages (bot's own replies)
            if (msg.message?.is_echo) {
              console.log("Skipping echo message from bot itself");
              continue;
            }
            // Skip messages sent by our own account/page to prevent loops
            const fromIdMsg = msg.sender?.id || msg.message?.from?.id;
            if (fromIdMsg && (fromIdMsg === account.instagramUserId || fromIdMsg === (account as any).pageId)) {
              console.log("Skipping message from our own account/page (messaging array)");
              continue;
            }
            
            const triggerData = {
              message_id: msg.message?.mid,
              message_text: msg.message?.text,
              sender_id: msg.sender?.id,
              timestamp: msg.timestamp,
            };

            console.log("Saving DM webhook event for account:", account.username);
            console.log("DM trigger data:", triggerData);

            // Auto-create contact from DM webhook
            if (triggerData.sender_id) {
              try {
                await storage.upsertContact(
                  account.id,
                  triggerData.sender_id,
                  undefined // DM webhooks don't include username
                );
                console.log("Contact auto-created/updated for sender:", triggerData.sender_id);
              } catch (error) {
                console.error("Error auto-creating contact:", error);
              }
            }

            const webhookEvent = await storage.createWebhookEvent({
              accountId: account.id,
              eventType: "dm_received",
              payload: triggerData,
              processed: false,
            });

            // Check if there's an active agent conversation for this user
            if (triggerData.sender_id) {
              const activeConversation = await storage.getActiveConversationByInstagramUser(
                triggerData.sender_id,
                account.id
              );

              if (activeConversation) {
                console.log(`[Webhook] Active agent conversation found for user ${triggerData.sender_id}`);
                
                try {
                  const { GeminiService } = await import("./gemini-service");
                  
                  // Get the agent
                  const agent = await storage.getAgent(activeConversation.agentId);
                  if (!agent) {
                    console.error(`[Webhook] Agent ${activeConversation.agentId} not found`);
                  } else {
                    // Get conversation history and memory
                    const conversationHistory = await storage.getMessagesByConversation(activeConversation.conversationId);
                    const memory = agent.enableMemory ? await storage.getMemoryByAgent(agent.id, 10) : [];

                    // Save the user's message
                    await storage.createMessage({
                      conversationId: activeConversation.conversationId,
                      role: "user",
                      content: triggerData.message_text || "",
                    });

                    // Get agent response
                    const agentResponse = await GeminiService.chatWithTools({
                      agent,
                      message: triggerData.message_text || "",
                      conversationHistory,
                      memory,
                      storage,
                    });

                    // Save agent's response
                    await storage.createMessage({
                      conversationId: activeConversation.conversationId,
                      role: "assistant",
                      content: agentResponse.content,
                    });

                    // Send the agent's response as a DM
                    const api = new InstagramAPI(
                      account.accessToken, 
                      account.instagramUserId || undefined,
                      account.pageId || undefined,
                      account.pageAccessToken || undefined
                    );
                    
                    // 24-hour messaging window guard with Private Reply fallback if applicable
                    {
                      const ts = (triggerData as any)?.timestamp || 
                                (triggerData as any)?.created_time ||
                                (triggerData as any)?.created_at;
                      
                      console.log(`[Webhook] Agent reply - Extracted timestamp:`, ts);
                      
                      let lastMs = 0;
                      if (typeof ts === 'number') {
                        lastMs = ts > 1e12 ? ts : ts * 1000;
                      } else if (typeof ts === 'string') {
                        const d = Date.parse(ts);
                        if (!Number.isNaN(d)) lastMs = d;
                      }
                      const minutesSince = lastMs > 0 ? Math.floor((Date.now() - lastMs) / 60000) : undefined;

                      console.log(`[Webhook] Agent reply - Time check: minutesSince=${minutesSince}, comment_id=${(triggerData as any)?.comment_id}`);

                      // If we can't determine timestamp, fail safe
                      if (minutesSince === undefined) {
                        console.warn(`[Webhook] WARNING: Could not determine message timestamp for agent reply. Blocking DM send.`);
                        throw Object.assign(new Error("Cannot send agent DM: Unable to verify 24-hour messaging window (timestamp not found)"), { code: "IG_MISSING_TIMESTAMP" });
                      }

                      if (minutesSince > 1440) {
                        console.log(`[Webhook] Agent reply: Outside 24h window (${minutesSince} minutes). Attempting fallback...`);
                        if ((triggerData as any)?.comment_id) {
                          const replyMsg = "Reply with ANY message to continue";
                          await api.sendPrivateReply((triggerData as any).comment_id, replyMsg);
                          console.log(`[Webhook] Outside 24h window. Sent Private Reply fallback.`);
                        } else {
                          throw Object.assign(new Error(`Blocked by 24-hour messaging window (${minutesSince} minutes since last interaction)`), { code: "IG_24H_WINDOW", minutesSince });
                        }
                      } else {
                        console.log(`[Webhook] Agent reply: Within 24h window (${minutesSince} minutes). Sending DM...`);
                        await api.sendDirectMessage(
                          triggerData.sender_id,
                          agentResponse.content
                        );
                      }
                    }

                    // Update conversation timestamp
                    await storage.updateActiveAgentConversation(activeConversation.id, {
                      lastMessageAt: new Date(),
                    });

                    // Mark webhook as processed
                    await storage.markWebhookEventProcessed(webhookEvent.id);
                    console.log(`[Webhook] Agent conversation handled successfully`);
                    
                    // Skip normal flow execution since agent handled it
                    continue;
                  }
                } catch (error: any) {
                  console.error(`[Webhook] Error in agent conversation:`, error);
                  // Fall through to normal flow execution on error
                }
              }
            }

            const flows = await storage.getActiveFlows();
            const matchingFlows = flows.filter(
              (f) =>
                f.accountId === account.id &&
                f.nodes.some(
                  (n: any) => n.type === "trigger" && n.data.triggerType === "dm_received"
                )
            );

            let allExecutionsSuccessful = matchingFlows.length > 0;
            
            for (const flow of matchingFlows) {
              const execution = await storage.createExecution({
                flowId: flow.id,
                accountId: account.id,
                triggerType: "dm_received",
                triggerData,
                status: "running",
                executionPath: [],
                errorMessage: null,
              });

              try {
                const api = new InstagramAPI(
          account.accessToken, 
          account.instagramUserId || undefined,
          account.pageId || undefined,
          account.pageAccessToken || undefined
        );
                const engine = new FlowEngine(api, flow, triggerData, execution.id);
                const result = await engine.execute();

                await storage.updateExecution(execution.id, {
                  status: result.success ? "success" : "failed",
                  executionPath: result.executionPath,
                  nodeResults: result.nodeResults as any,
                  errorMessage: result.error || null,
                });
                
                console.log("Flow execution completed:", execution.id, result.success ? "success" : "failed");
                
                if (!result.success) {
                  allExecutionsSuccessful = false;
                }
              } catch (error: any) {
                console.error("Flow execution error:", error);
                await storage.updateExecution(execution.id, {
                  status: "failed",
                  errorMessage: error.message,
                });
                allExecutionsSuccessful = false;
              }
            }

            if (allExecutionsSuccessful) {
              await storage.markWebhookEventProcessed(webhookEvent.id);
              console.log("Webhook event marked as processed");
            } else {
              console.log("Webhook event left unprocessed due to execution failures");
            }
          }
        }

        // Handle changes webhooks (comments, etc.)
        if (item.changes && Array.isArray(item.changes)) {
          for (const change of item.changes) {
            const { field, value } = change;

            let eventType = "";
            let triggerData: any = {};

            switch (field) {
              case "comments":
                // Skip echo comments (bot's own replies)
                if (value.from?.id === account.instagramUserId || 
                    value.from?.username === account.username ||
                    value.from?.self_ig_scoped_id) {
                  console.log("Skipping echo comment from bot itself");
                  continue;
                }
                
                eventType = "comment_received";
                triggerData = {
                  comment_id: value.id,
                  comment_text: value.text,
                  from_id: value.from?.id,
                  from_username: value.from?.username,
                  media_id: value.media?.id,
                  media_type: value.media?.media_product_type,
                  timestamp: value.created_time || value.timestamp || Date.now(),
                };
                
                // Fetch media details if media_id is available
                if (value.media?.id) {
                  try {
                    const api = new InstagramAPI(account.accessToken, account.instagramUserId);
                    const mediaDetails = await api.getMedia(value.media.id);
                    triggerData.media_caption = mediaDetails.caption;
                    triggerData.media_thumbnail = mediaDetails.thumbnail_url;
                    triggerData.media_permalink = mediaDetails.permalink;
                    triggerData.media_url = mediaDetails.media_url;
                    triggerData.is_reel = mediaDetails.permalink?.includes('/reel/') || false;
                    console.log(`Media details fetched: ${mediaDetails.media_type}, isReel: ${triggerData.is_reel}`);
                  } catch (error) {
                    console.error("Error fetching media details:", error);
                  }
                }
                break;
              case "messages":
                eventType = "dm_received";
                // Handle both value.message and value.messages[] structures
                const msgData = value.message || (value.messages && value.messages[0]);
                const senderId = msgData?.from?.id || value.from?.id || value.sender?.id;
                // Skip messages sent by our own account/page to prevent loops
                if (senderId && (senderId === account.instagramUserId || senderId === (account as any).pageId)) {
                  console.log("Skipping echo DM from bot itself (changes.messages)");
                  continue;
                }
                
                if (msgData) {
                  triggerData = {
                    message_id: msgData.mid || msgData.id || value.id,
                    message_text: msgData.text || value.text,
                    sender_id: senderId,
                    timestamp: msgData.created_time || value.created_time || value.timestamp,
                  };
                } else {
                  // Fallback to value structure
                  triggerData = {
                    message_id: value.id,
                    message_text: value.text,
                    sender_id: senderId,
                    timestamp: value.created_time || value.timestamp,
                  };
                }
                break;
              case "mentions":
                // Skip echo mentions (bot mentioning itself)
                if (value.from?.id === account.instagramUserId || 
                    value.from?.username === account.username) {
                  console.log("Skipping echo mention from bot itself");
                  continue;
                }
                
                eventType = "mention_received";
                triggerData = {
                  mention_id: value.id,
                  mention_text: value.text,
                  from_id: value.from?.id,
                  from_username: value.from?.username,
                  media_id: value.media?.id,
                  timestamp: value.created_time || value.timestamp || Date.now(),
                };
                break;
              case "story_insights":
              case "story_mentions":
                // Skip echo story replies (bot's own replies)
                if (value.from?.id === account.instagramUserId || 
                    value.from?.username === account.username) {
                  console.log("Skipping echo story reply from bot itself");
                  continue;
                }
                
                eventType = "story_reply_received";
                triggerData = {
                  reply_id: value.id,
                  reply_text: value.text,
                  from_id: value.from?.id,
                  from_username: value.from?.username,
                  timestamp: value.created_time || value.timestamp || Date.now(),
                };
                break;
              default:
                console.log("Unknown webhook field:", field);
                eventType = "unknown";
                triggerData = { field, value };
            }

            console.log("Saving webhook event:", eventType, "for account:", account.username);

            // Auto-create contact from webhook data
            const contactUserId = triggerData.from_id || triggerData.sender_id;
            const contactUsername = triggerData.from_username;
            
            if (contactUserId) {
              try {
                await storage.upsertContact(
                  account.id,
                  contactUserId,
                  contactUsername
                );
                console.log("Contact auto-created/updated:", contactUserId, contactUsername || "(no username)");
              } catch (error) {
                console.error("Error auto-creating contact:", error);
              }
            }

            const webhookEvent = await storage.createWebhookEvent({
              accountId: account.id,
              eventType,
              payload: triggerData,
              processed: false,
            });

            const flows = await storage.getActiveFlows();
            const matchingFlows = flows.filter(
              (f) => {
                if (f.accountId !== account.id) return false;
                
                const triggerNode = f.nodes.find(
                  (n: any) => n.type === "trigger" && n.data.triggerType === eventType
                );
                
                if (!triggerNode) return false;
                
                // If trigger has media filter enabled, check if media matches
                if (triggerNode.data.filterByMedia && triggerNode.data.specificMediaId) {
                  const mediaId = triggerData.media_id;
                  if (mediaId !== triggerNode.data.specificMediaId) {
                    console.log(`Skipping flow ${f.name}: media filter enabled but media ${mediaId} doesn't match ${triggerNode.data.specificMediaId}`);
                    return false;
                  }
                }
                
                return true;
              }
            );

            let allExecutionsSuccessful = matchingFlows.length > 0;
            
            for (const flow of matchingFlows) {
              const execution = await storage.createExecution({
                flowId: flow.id,
                accountId: account.id,
                triggerType: eventType,
                triggerData,
                status: "running",
                executionPath: [],
                errorMessage: null,
              });

              try {
                const api = new InstagramAPI(
          account.accessToken, 
          account.instagramUserId || undefined,
          account.pageId || undefined,
          account.pageAccessToken || undefined
        );
                const engine = new FlowEngine(api, flow, triggerData, execution.id);
                const result = await engine.execute();

                await storage.updateExecution(execution.id, {
                  status: result.success ? "success" : "failed",
                  executionPath: result.executionPath,
                  nodeResults: result.nodeResults as any,
                  errorMessage: result.error || null,
                });
                
                console.log("Flow execution completed:", execution.id, result.success ? "success" : "failed");
                
                if (!result.success) {
                  allExecutionsSuccessful = false;
                }
              } catch (error: any) {
                console.error("Flow execution error:", error);
                await storage.updateExecution(execution.id, {
                  status: "failed",
                  errorMessage: error.message,
                });
                allExecutionsSuccessful = false;
              }
            }

            if (allExecutionsSuccessful) {
              await storage.markWebhookEventProcessed(webhookEvent.id);
              console.log("Webhook event marked as processed");
            } else {
              console.log("Webhook event left unprocessed due to execution failures");
            }
          }
        }
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.sendStatus(500);
    }
  });

  // Contacts
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getUserAccounts(req.user!.id);
      const accountIds = accounts.map(a => a.id);
      
      const accountId = req.query.accountId as string | undefined;
      if (accountId && !accountIds.includes(accountId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const contacts = accountId 
        ? await storage.getContactsByAccount(accountId)
        : await Promise.all(accountIds.map(id => storage.getContactsByAccount(id))).then(all => all.flat());
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const { accountId, instagramUserId, username } = req.body;
      
      if (!accountId || !instagramUserId || !username) {
        return res.status(400).json({ error: "Account ID, Instagram user ID, and username are required" });
      }

      // Verify account belongs to user
      const account = await storage.getAccount(accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const contact = await storage.createContact({
        accountId,
        instagramUserId,
        username,
      });

      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const existingContact = await storage.getContact(req.params.id);
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      // Verify contact's account belongs to user
      const account = await storage.getAccount(existingContact.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      // Remove accountId from updates to prevent reassignment
      const { accountId, ...updates } = req.body;
      
      const contact = await storage.updateContact(req.params.id, updates);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const existingContact = await storage.getContact(req.params.id);
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      // Verify contact's account belongs to user
      const account = await storage.getAccount(existingContact.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      const success = await storage.deleteContact(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Agents (lazy import to avoid circular dependencies)
  const agentRoutes = await import("./agent-routes");
  agentRoutes.registerAgentRoutes(app, storage);

  const httpServer = createServer(app);
  return httpServer;
}
