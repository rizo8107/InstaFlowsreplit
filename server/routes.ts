import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertInstagramAccountSchema, 
  insertFlowSchema, 
  updateFlowSchema,
  insertFlowExecutionSchema,
  insertFlowTemplateSchema
} from "@shared/schema";
import { InstagramAPI } from "./instagram-api";
import { FlowEngine } from "./flow-engine";

export async function registerRoutes(app: Express): Promise<Server> {
  // Instagram Accounts
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const data = insertInstagramAccountSchema.parse(req.body);
      const account = await storage.createAccount(data);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.updateAccount(req.params.id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const success = await storage.deleteAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Flows
  app.get("/api/flows", async (req, res) => {
    try {
      const flows = await storage.getAllFlows();
      res.json(flows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/flows/:id", async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.id);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      res.json(flow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/flows", async (req, res) => {
    try {
      const data = insertFlowSchema.parse(req.body);
      const flow = await storage.createFlow(data);
      res.json(flow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/flows/:id", async (req, res) => {
    try {
      const data = updateFlowSchema.parse(req.body);
      const flow = await storage.updateFlow(req.params.id, data);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }
      res.json(flow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/flows/:id", async (req, res) => {
    try {
      const success = await storage.deleteFlow(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Flow not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Flow Executions
  app.get("/api/executions", async (req, res) => {
    try {
      const executions = await storage.getAllExecutions();
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const executions = await storage.getRecentExecutions(limit);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook Events
  app.get("/api/webhook-events", async (req, res) => {
    try {
      const events = await storage.getAllWebhookEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/webhook-events/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const events = await storage.getRecentWebhookEvents(limit);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute a flow manually (for testing)
  app.post("/api/flows/:id/execute", async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.id);
      if (!flow) {
        return res.status(404).json({ error: "Flow not found" });
      }

      const account = await storage.getAccount(flow.accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Create execution record
      const execution = await storage.createExecution({
        flowId: flow.id,
        accountId: account.id,
        triggerType: "manual",
        triggerData: req.body.triggerData || {},
        status: "running",
        executionPath: [],
        errorMessage: null,
      });

      // Execute flow
      const api = new InstagramAPI(account.accessToken);
      const engine = new FlowEngine(api, flow, req.body.triggerData || {});
      const result = await engine.execute();

      // Update execution record
      await storage.updateExecution(execution.id, {
        status: result.success ? "success" : "failed",
        executionPath: result.executionPath,
        errorMessage: result.error || null,
      });

      res.json({
        executionId: execution.id,
        success: result.success,
        executionPath: result.executionPath,
        error: result.error,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Flow Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const { category } = req.query;
      const templates = category 
        ? await storage.getTemplatesByCategory(category as string)
        : await storage.getAllTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const data = insertFlowTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(data);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/templates/:id/use", async (req, res) => {
    try {
      console.log("Template use request:", { templateId: req.params.id, body: req.body });
      const { accountId, name } = req.body;
      const template = await storage.getTemplate(req.params.id);
      
      if (!template) {
        console.error("Template not found:", req.params.id);
        return res.status(404).json({ error: "Template not found" });
      }

      console.log("Creating flow from template:", template.name);
      // Create a new flow from the template
      const flow = await storage.createFlow({
        accountId,
        name: name || template.name,
        description: `Based on template: ${template.name}`,
        isActive: false,
        nodes: template.nodes,
        edges: template.edges,
      });

      console.log("Flow created:", flow.id);
      // Increment template use count
      await storage.incrementTemplateUseCount(req.params.id);

      res.json(flow);
    } catch (error: any) {
      console.error("Template use error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Webhook Token Management
  app.get("/api/webhook-token", async (req, res) => {
    try {
      const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
      res.json({ token: token || null, exists: !!token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook-token/generate", async (req, res) => {
    try {
      // Generate a secure random token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Note: In production, you'd update this via a secure secrets management API
      // For now, we return the token for the user to manually set in Replit Secrets
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
    // Webhook verification
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

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

      if (object !== "instagram") {
        return res.sendStatus(200);
      }

      for (const item of entry) {
        const instagramUserId = item.id;
        const account = await storage.getAccountByUserId(instagramUserId);

        if (!account || !account.isActive) {
          continue;
        }

        // Process changes
        for (const change of item.changes) {
          const { field, value } = change;

          let eventType = "";
          let triggerData: any = {};

          switch (field) {
            case "comments":
              eventType = "comment_received";
              triggerData = { comment: value };
              break;
            case "messages":
              eventType = "dm_received";
              triggerData = { message: value };
              break;
            case "mentions":
              eventType = "mention_received";
              triggerData = { mention: value };
              break;
            case "story_insights":
              eventType = "story_reply_received";
              triggerData = { story_reply: value };
              break;
          }

          if (!eventType) continue;

          // Store webhook event
          const webhookEvent = await storage.createWebhookEvent({
            accountId: account.id,
            eventType,
            payload: triggerData,
            processed: false,
          });

          // Find matching active flows
          const flows = await storage.getActiveFlows();
          const matchingFlows = flows.filter(
            (f) =>
              f.accountId === account.id &&
              f.nodes.some(
                (n: any) => n.type === "trigger" && n.data.triggerType === eventType
              )
          );

          // Execute matching flows
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
              const api = new InstagramAPI(account.accessToken);
              const engine = new FlowEngine(api, flow, triggerData);
              const result = await engine.execute();

              await storage.updateExecution(execution.id, {
                status: result.success ? "success" : "failed",
                executionPath: result.executionPath,
                errorMessage: result.error || null,
              });
            } catch (error: any) {
              await storage.updateExecution(execution.id, {
                status: "failed",
                errorMessage: error.message,
              });
            }
          }

          // Mark webhook as processed
          await storage.markWebhookEventProcessed(webhookEvent.id);
        }
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
