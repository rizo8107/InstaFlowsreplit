import { GoogleGenAI } from "@google/genai";
import type { Agent, AgentMemory, Message } from "@shared/schema";
import type { IStorage } from "./storage";
import { FlowEngine } from "./flow-engine";
import { InstagramAPI } from "./instagram-api";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Tool interface for type safety
interface ToolDefinition {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any, context?: any) => Promise<string>;
}

export interface ChatOptions {
  agent: Agent;
  message: string;
  conversationHistory: Message[];
  memory?: AgentMemory[];
  storage?: IStorage;
}

export interface ChatResponse {
  content: string;
  toolsUsed?: string[];
  memoryAdded?: string[];
}

export class GeminiService {
  private static tools: Map<string, ToolDefinition> = new Map();

  /**
   * Initialize tool registry
   */
  static initialize(storage: IStorage) {
    // Time tool
    this.tools.set("get_current_time", {
      name: "get_current_time",
      description: "Get the current date and time",
      execute: async () => {
        return new Date().toLocaleString();
      }
    });

    // Knowledge base search tool (RAG)
    this.tools.set("search_knowledge_base", {
      name: "search_knowledge_base",
      description: "Search the agent's knowledge base for relevant information using semantic search",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant information"
          }
        },
        required: ["query"]
      },
      execute: async (params: { query: string }, context: { agentId: string }) => {
        const memory = await storage.getMemoryByAgent(context.agentId, 50);
        
        // Simple keyword-based retrieval (can be enhanced with embeddings)
        const queryTerms = params.query.toLowerCase().split(/\s+/);
        const scoredMemory = memory.map(m => {
          const content = m.content.toLowerCase();
          const score = queryTerms.reduce((acc, term) => {
            return acc + (content.includes(term) ? 1 : 0);
          }, 0);
          return { memory: m, score };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (scoredMemory.length === 0) {
          return "No relevant information found in knowledge base.";
        }

        return scoredMemory
          .map(item => `- ${item.memory.content} (Source: ${item.memory.source})`)
          .join("\n");
      }
    });

    // Send Instagram DM tool
    this.tools.set("send_instagram_dm", {
      name: "send_instagram_dm",
      description: "Send a direct message on Instagram to a specific user",
      parameters: {
        type: "object",
        properties: {
          accountId: {
            type: "string",
            description: "The Instagram account ID to send from (use contacts to find)"
          },
          recipientId: {
            type: "string",
            description: "The Instagram user ID of the recipient"
          },
          message: {
            type: "string",
            description: "The message text to send"
          }
        },
        required: ["accountId", "recipientId", "message"]
      },
      execute: async (params: { accountId: string; recipientId: string; message: string }, context: { userId: string }) => {
        try {
          // Get the Instagram account
          const accounts = await storage.getUserAccounts(context.userId);
          const account = accounts.find(a => a.id === params.accountId);
          
          if (!account) {
            return `Instagram account not found. Available accounts: ${accounts.map(a => `${a.username} (${a.id})`).join(', ')}`;
          }

          // Send the DM
          const api = new InstagramAPI(account.accessToken);
          await api.sendDirectMessage(params.recipientId, params.message);

          return `Successfully sent DM to user ${params.recipientId} from account @${account.username}: "${params.message}"`;
        } catch (error: any) {
          return `Error sending Instagram DM: ${error.message}`;
        }
      }
    });

    // Execute flow tool
    this.tools.set("execute_flow", {
      name: "execute_flow",
      description: "Execute an Instagram automation flow by name to trigger automated conversations",
      parameters: {
        type: "object",
        properties: {
          flowName: {
            type: "string",
            description: "The name of the flow to execute"
          },
          testData: {
            type: "object",
            description: "Test data to trigger the flow (e.g., {username: 'test', message_text: 'hello', instagram_user_id: '123'})"
          }
        },
        required: ["flowName"]
      },
      execute: async (params: { flowName: string; testData?: any }, context: { userId: string }) => {
        try {
          const flows = await storage.getAllFlows();
          const flow = flows.find(f => 
            f.name.toLowerCase() === params.flowName.toLowerCase() && 
            f.active === true
          );

          if (!flow) {
            return `Flow "${params.flowName}" not found or not active.`;
          }

          // Create test execution
          const execution = await storage.createExecution({
            flowId: flow.id,
            webhookEventId: null,
            status: "pending",
            variables: params.testData || {},
            executionPath: [],
          });

          // Get account
          const account = await storage.getAccount(flow.accountId);
          if (!account) {
            return `Account for flow "${params.flowName}" not found.`;
          }

          const api = new InstagramAPI(account.accessToken);
          const engine = new FlowEngine(api, storage);

          const result = await engine.execute(
            flow.id,
            params.testData || {},
            execution.id
          );

          return result.success 
            ? `Flow "${params.flowName}" executed successfully. The automated conversation has been triggered.`
            : `Flow "${params.flowName}" failed: ${result.error || "Unknown error"}`;
        } catch (error: any) {
          return `Error executing flow: ${error.message}`;
        }
      }
    });

    // Get Instagram contacts tool
    this.tools.set("get_instagram_contacts", {
      name: "get_instagram_contacts",
      description: "Get list of Instagram contacts/users from the system to find user IDs for sending messages",
      parameters: {
        type: "object",
        properties: {
          accountId: {
            type: "string",
            description: "Optional: Filter contacts by Instagram account ID"
          }
        }
      },
      execute: async (params: { accountId?: string }, context: { userId: string }) => {
        try {
          const accounts = await storage.getUserAccounts(context.userId);
          const accountIds = accounts.map(a => a.id);
          
          if (params.accountId && !accountIds.includes(params.accountId)) {
            return `Account not found. Available accounts: ${accounts.map(a => `${a.username} (${a.id})`).join(', ')}`;
          }

          const contacts = params.accountId
            ? await storage.getContactsByAccount(params.accountId)
            : await Promise.all(accountIds.map(id => storage.getContactsByAccount(id))).then(all => all.flat());

          if (contacts.length === 0) {
            return "No contacts found. Contacts are created automatically when users interact with your Instagram flows.";
          }

          return contacts.map(c => 
            `@${c.username} (ID: ${c.instagramUserId}, Account: ${c.accountId})`
          ).join('\n');
        } catch (error: any) {
          return `Error getting contacts: ${error.message}`;
        }
      }
    });
  }

  /**
   * Generate chat completion with agent context
   */
  static async chat(options: ChatOptions): Promise<ChatResponse> {
    const { agent, message, conversationHistory, memory = [] } = options;

    // Build context from memory (RAG)
    const memoryContext = agent.enableMemory && memory.length > 0
      ? `\n\nRelevant Context from Knowledge Base:\n${memory.slice(0, 5).map(m => `- ${m.content}`).join('\n')}`
      : '';

    const fullSystemPrompt = `${agent.systemPrompt}${memoryContext}`;

    // Convert conversation history to Gemini format
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const response = await ai.models.generateContent({
        model: agent.model,
        config: {
          systemInstruction: fullSystemPrompt,
          temperature: parseFloat(agent.temperature),
          maxOutputTokens: parseInt(agent.maxTokens),
        },
        contents,
      });

      const responseText = response.text || "I couldn't generate a response.";

      // Smart memory extraction
      const memoryAdded: string[] = [];
      if (agent.enableMemory && responseText.length > 30) {
        // Extract facts and learnings from the response
        const sentences = responseText.split(/[.!?]+/).filter(s => s.trim().length > 20);
        if (sentences.length > 0) {
          memoryAdded.push(sentences[0].trim());
        }
      }

      return {
        content: responseText,
        toolsUsed: [],
        memoryAdded
      };
    } catch (error: any) {
      console.error("Gemini chat error:", error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Chat with tool calling support using Gemini's native function calling
   */
  static async chatWithTools(options: ChatOptions): Promise<ChatResponse> {
    const { agent, message, conversationHistory, memory = [], storage } = options;

    if (!agent.enableTools || agent.tools.length === 0) {
      return this.chat(options);
    }

    // Filter and format tools for Gemini
    const selectedTools = agent.tools
      .filter(name => this.tools.has(name))
      .map(name => {
        const tool = this.tools.get(name)!;
        return {
          functionDeclarations: [{
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters || {
              type: "object",
              properties: {},
              required: []
            }
          }]
        };
      });

    if (selectedTools.length === 0) {
      return this.chat(options);
    }

    // Build memory context
    const memoryContext = agent.enableMemory && memory.length > 0
      ? `\n\nRelevant Context:\n${memory.slice(0, 5).map(m => `- ${m.content}`).join('\n')}`
      : '';

    const fullSystemPrompt = `${agent.systemPrompt}${memoryContext}`;

    // Convert history
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const initialResponse = await ai.models.generateContent({
        model: agent.model,
        config: {
          systemInstruction: fullSystemPrompt,
          temperature: parseFloat(agent.temperature),
          maxOutputTokens: parseInt(agent.maxTokens),
        },
        contents,
        tools: selectedTools.length > 0 ? selectedTools : undefined,
      });

      let responseText = initialResponse.text || "";
      const toolsUsed: string[] = [];

      // Extract function calls from response (correct SDK format)
      const functionCalls = initialResponse.candidates?.[0]?.content?.parts
        ?.filter((part: any) => part.functionCall)
        .map((part: any) => part.functionCall) || [];

      // Execute tools if any function calls were made
      if (functionCalls.length > 0 && storage) {
        const functionResponses: any[] = [];
        
        for (const functionCall of functionCalls) {
          const tool = this.tools.get(functionCall.name);
          if (tool) {
            try {
              const context = { agentId: agent.id, userId: agent.userId };
              const result = await tool.execute(functionCall.args || {}, context);
              
              // Format tool response for Gemini
              functionResponses.push({
                functionResponse: {
                  name: functionCall.name,
                  response: { result }
                }
              });
              
              toolsUsed.push(tool.name);
            } catch (error: any) {
              console.error(`Tool execution error for ${functionCall.name}:`, error);
              functionResponses.push({
                functionResponse: {
                  name: functionCall.name,
                  response: { error: error.message }
                }
              });
            }
          }
        }

        // Send tool results back to Gemini for final response
        if (functionResponses.length > 0) {
          const followUpContents = [
            ...contents,
            {
              role: 'model',
              parts: functionCalls.map((fc: any) => ({ functionCall: fc }))
            },
            {
              role: 'function',
              parts: functionResponses
            }
          ];

          const finalResponse = await ai.models.generateContent({
            model: agent.model,
            config: {
              systemInstruction: fullSystemPrompt,
              temperature: parseFloat(agent.temperature),
              maxOutputTokens: parseInt(agent.maxTokens),
            },
            contents: followUpContents,
            tools: selectedTools.length > 0 ? selectedTools : undefined,
          });

          responseText = finalResponse.text || "I've processed the tool results.";
        }
      }

      if (!responseText) {
        responseText = "I processed your request but don't have a text response.";
      }

      // Smart memory extraction
      const memoryAdded: string[] = [];
      if (agent.enableMemory && responseText.length > 30) {
        const sentences = responseText.split(/[.!?]+/).filter(s => s.trim().length > 20);
        if (sentences.length > 0) {
          memoryAdded.push(sentences[0].trim());
        }
      }

      return {
        content: responseText,
        toolsUsed,
        memoryAdded
      };
    } catch (error: any) {
      console.error("Gemini chat with tools error:", error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Get list of available tools
   */
  static getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tool details
   */
  static getToolDetails(toolName: string): ToolDefinition | null {
    return this.tools.get(toolName) || null;
  }
}
