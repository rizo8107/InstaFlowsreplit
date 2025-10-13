import type { Express, Request, Response, NextFunction } from "express";
import type { IStorage } from "./storage";
import type { InsertAgent, UpdateAgent, InsertConversation, InsertMessage, InsertAgentMemory } from "@shared/schema";
import { GeminiService } from "./gemini-service";

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function registerAgentRoutes(app: Express, storage: IStorage) {
  // Get all agents for current user
  app.get("/api/agents", requireAuth, async (req, res) => {
    try {
      const agents = await storage.getAgentsByUser(req.user!.id);
      res.json(agents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single agent
  app.get("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent || agent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create agent
  app.post("/api/agents", requireAuth, async (req, res) => {
    try {
      const agentData: InsertAgent = {
        ...req.body,
        userId: req.user!.id,
      };
      const agent = await storage.createAgent(agentData);
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update agent
  app.patch("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const existingAgent = await storage.getAgent(req.params.id);
      if (!existingAgent || existingAgent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const { userId, ...updates } = req.body;
      const agent = await storage.updateAgent(req.params.id, updates as UpdateAgent);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete agent
  app.delete("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const existingAgent = await storage.getAgent(req.params.id);
      if (!existingAgent || existingAgent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const success = await storage.deleteAgent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get conversations for an agent
  app.get("/api/agents/:id/conversations", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent || agent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const conversations = await storage.getConversationsByAgent(req.params.id);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create conversation
  app.post("/api/agents/:id/conversations", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent || agent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const conversationData: InsertConversation = {
        agentId: req.params.id,
        userId: req.user!.id,
        title: req.body.title || "New Conversation",
      };
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get conversation messages
  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation || conversation.userId !== req.user!.id) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getMessagesByConversation(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat with agent (send message and get response)
  app.post("/api/conversations/:id/chat", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation || conversation.userId !== req.user!.id) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const agent = await storage.getAgent(conversation.agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const userMessage = req.body.message;
      if (!userMessage) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Save user message
      await storage.createMessage({
        conversationId: req.params.id,
        role: "user",
        content: userMessage,
      });

      // Get conversation history
      const history = await storage.getMessagesByConversation(req.params.id);
      
      // Get agent memory
      const memory = agent.enableMemory 
        ? await storage.getMemoryByAgent(agent.id, 10)
        : [];

      // Generate response using Gemini
      const response = agent.enableTools
        ? await GeminiService.chatWithTools({
            agent,
            message: userMessage,
            conversationHistory: history,
            memory,
          })
        : await GeminiService.chat({
            agent,
            message: userMessage,
            conversationHistory: history,
            memory,
          });

      // Save assistant message
      const assistantMessage = await storage.createMessage({
        conversationId: req.params.id,
        role: "assistant",
        content: response.content,
        metadata: {
          toolsUsed: response.toolsUsed || [],
        },
      });

      // Save to memory if enabled
      if (agent.enableMemory && response.memoryAdded && response.memoryAdded.length > 0) {
        for (const content of response.memoryAdded) {
          await storage.createMemory({
            agentId: agent.id,
            content,
            source: "learned",
            metadata: {
              conversationId: req.params.id,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Update conversation timestamp
      await storage.updateConversation(req.params.id, {
        updatedAt: new Date(),
      });

      res.json({
        message: assistantMessage,
        toolsUsed: response.toolsUsed || [],
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get agent memory
  app.get("/api/agents/:id/memory", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent || agent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const memory = await storage.getMemoryByAgent(req.params.id, limit);
      res.json(memory);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add memory to agent
  app.post("/api/agents/:id/memory", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent || agent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const memoryData: InsertAgentMemory = {
        agentId: req.params.id,
        content: req.body.content,
        source: req.body.source || "user_provided",
        metadata: req.body.metadata || {},
      };

      const memory = await storage.createMemory(memoryData);
      res.json(memory);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete memory
  app.delete("/api/memory/:id", requireAuth, async (req, res) => {
    try {
      const memory = await storage.getMemory(req.params.id);
      if (!memory) {
        return res.status(404).json({ error: "Memory not found" });
      }

      const agent = await storage.getAgent(memory.agentId);
      if (!agent || agent.userId !== req.user!.id) {
        return res.status(404).json({ error: "Memory not found" });
      }

      const success = await storage.deleteMemory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Memory not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation || conversation.userId !== req.user!.id) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const success = await storage.deleteConversation(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get available tools
  app.get("/api/agents/tools/available", requireAuth, async (req, res) => {
    try {
      const tools = GeminiService.getAvailableTools();
      const toolDetails = tools.map(name => ({
        name,
        details: GeminiService.getToolDetails(name),
      }));
      res.json(toolDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
