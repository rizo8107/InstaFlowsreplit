import { GoogleGenAI } from "@google/genai";
import type { Agent, AgentMemory, Message } from "@shared/schema";

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Available tools that agents can use
const AVAILABLE_TOOLS = {
  get_current_time: {
    name: "get_current_time",
    description: "Get the current date and time",
    execute: async (): Promise<string> => {
      return new Date().toLocaleString();
    }
  },
  search_memory: {
    name: "search_memory",
    description: "Search agent's memory for relevant information",
    parameters: {
      query: "string"
    },
    execute: async (params: { query: string }, memory: AgentMemory[]): Promise<string> => {
      // Simple keyword search in memory
      const results = memory.filter(m => 
        m.content.toLowerCase().includes(params.query.toLowerCase())
      );
      if (results.length === 0) return "No relevant information found in memory.";
      return results.map(r => r.content).join("\n\n");
    }
  },
  calculate: {
    name: "calculate",
    description: "Perform mathematical calculations",
    parameters: {
      expression: "string"
    },
    execute: async (params: { expression: string }): Promise<string> => {
      try {
        // Safe eval alternative - only allow numbers and basic operators
        const sanitized = params.expression.replace(/[^0-9+\-*/().]/g, '');
        const result = Function(`'use strict'; return (${sanitized})`)();
        return `Result: ${result}`;
      } catch (error) {
        return `Error calculating: ${error}`;
      }
    }
  },
  get_instagram_stats: {
    name: "get_instagram_stats",
    description: "Get Instagram account statistics",
    execute: async (): Promise<string> => {
      return "This tool would fetch Instagram stats from the connected accounts.";
    }
  }
};

export interface ChatOptions {
  agent: Agent;
  message: string;
  conversationHistory: Message[];
  memory?: AgentMemory[];
}

export interface ChatResponse {
  content: string;
  toolsUsed?: string[];
  memoryAdded?: string[];
}

export class GeminiService {
  /**
   * Generate chat completion with agent context
   */
  static async chat(options: ChatOptions): Promise<ChatResponse> {
    const { agent, message, conversationHistory, memory = [] } = options;

    // Build context from memory (RAG)
    const memoryContext = agent.enableMemory && memory.length > 0
      ? `\n\nRelevant Context from Memory:\n${memory.slice(0, 5).map(m => m.content).join('\n')}`
      : '';

    // Build system prompt with memory context
    const fullSystemPrompt = `${agent.systemPrompt}${memoryContext}`;

    // Convert conversation history to Gemini format
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    // Add current user message
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

      // Extract potential memory items from conversation
      const memoryAdded: string[] = [];
      if (agent.enableMemory) {
        // Simple heuristic: if response contains important info, save it
        // In production, use more sophisticated extraction
        if (responseText.length > 50 && responseText.includes('.')) {
          memoryAdded.push(responseText.substring(0, 200));
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
   * Chat with tool calling support
   */
  static async chatWithTools(options: ChatOptions): Promise<ChatResponse> {
    const { agent, message, conversationHistory, memory = [] } = options;

    if (!agent.enableTools || agent.tools.length === 0) {
      return this.chat(options);
    }

    // Filter available tools based on agent configuration
    const agentTools = agent.tools
      .filter(toolName => toolName in AVAILABLE_TOOLS)
      .map(toolName => AVAILABLE_TOOLS[toolName as keyof typeof AVAILABLE_TOOLS]);

    // Build memory context
    const memoryContext = agent.enableMemory && memory.length > 0
      ? `\n\nRelevant Context:\n${memory.slice(0, 5).map(m => m.content).join('\n')}`
      : '';

    const fullSystemPrompt = `${agent.systemPrompt}${memoryContext}

Available Tools:
${agentTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

To use a tool, mention it explicitly in your response.`;

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
      const response = await ai.models.generateContent({
        model: agent.model,
        config: {
          systemInstruction: fullSystemPrompt,
          temperature: parseFloat(agent.temperature),
          maxOutputTokens: parseInt(agent.maxTokens),
        },
        contents,
      });

      let responseText = response.text || "I couldn't generate a response.";
      const toolsUsed: string[] = [];

      // Check if response mentions any tools and execute them
      for (const tool of agentTools) {
        if (responseText.toLowerCase().includes(tool.name.toLowerCase())) {
          try {
            const toolResult = await tool.execute({}, memory);
            responseText = `${responseText}\n\n[Tool: ${tool.name}]\n${toolResult}`;
            toolsUsed.push(tool.name);
          } catch (error) {
            console.error(`Tool execution error for ${tool.name}:`, error);
          }
        }
      }

      // Extract memory
      const memoryAdded: string[] = [];
      if (agent.enableMemory && responseText.length > 50) {
        memoryAdded.push(responseText.substring(0, 200));
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
   * Analyze text sentiment
   */
  static async analyzeSentiment(text: string): Promise<{ rating: number; confidence: number }> {
    try {
      const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: {'rating': number, 'confidence': number}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              rating: { type: "number" },
              confidence: { type: "number" },
            },
            required: ["rating", "confidence"],
          },
        },
        contents: text,
      });

      const rawJson = response.text;
      if (rawJson) {
        return JSON.parse(rawJson);
      }
      throw new Error("Empty response from model");
    } catch (error: any) {
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
  }

  /**
   * Extract structured data from text
   */
  static async extractData(text: string, schema: any): Promise<any> {
    try {
      const systemPrompt = `Extract structured data from the given text according to the provided schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
        contents: text,
      });

      const rawJson = response.text;
      if (rawJson) {
        return JSON.parse(rawJson);
      }
      throw new Error("Empty response from model");
    } catch (error: any) {
      throw new Error(`Failed to extract data: ${error.message}`);
    }
  }

  /**
   * Get list of available tools
   */
  static getAvailableTools(): string[] {
    return Object.keys(AVAILABLE_TOOLS);
  }

  /**
   * Get tool details
   */
  static getToolDetails(toolName: string): any {
    return AVAILABLE_TOOLS[toolName as keyof typeof AVAILABLE_TOOLS] || null;
  }
}
