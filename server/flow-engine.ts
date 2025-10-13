import type { Flow } from "@shared/schema";
import { InstagramAPI } from "./instagram-api";
import { storage } from "./storage";

interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  success: boolean;
  output?: any;
  error?: string;
}

interface ExecutionContext {
  triggerData: any;
  variables: Record<string, any>;
  executionPath: string[];
  nodeResults: NodeExecutionResult[];
  executionId?: string;
}

export class FlowEngine {
  private api: InstagramAPI;
  private flow: Flow;
  private context: ExecutionContext;

  constructor(api: InstagramAPI, flow: Flow, triggerData: any, executionId?: string) {
    this.api = api;
    this.flow = flow;
    this.context = {
      triggerData,
      variables: this.extractVariables(triggerData),
      executionPath: [],
      nodeResults: [],
      executionId,
    };
  }

  private extractVariables(triggerData: any): Record<string, any> {
    const variables: Record<string, any> = {};
    
    // Handle flat payload structure from webhooks
    // Comments
    if (triggerData.comment_id || triggerData.comment_text) {
      variables.comment_id = triggerData.comment_id;
      variables.comment_text = triggerData.comment_text;
      variables.message_text = triggerData.comment_text; // Alias for conditions
      variables.username = triggerData.from_username;
      variables.user_id = triggerData.from_id;
      variables.sender_id = triggerData.from_id; // For sending DMs from comment events
      variables.media_id = triggerData.media_id;
    }
    
    // DMs/Messages
    if (triggerData.message_id || triggerData.message_text) {
      variables.message_id = triggerData.message_id;
      variables.message_text = triggerData.message_text;
      variables.sender_id = triggerData.sender_id; // Required for sending DMs
      variables.user_id = triggerData.sender_id; // Alias for conditions
      variables.username = triggerData.sender_username; // May not always be available
    }

    // Mentions
    if (triggerData.mention_id || triggerData.mention_text) {
      variables.mention_id = triggerData.mention_id;
      variables.mention_text = triggerData.mention_text;
      variables.message_text = triggerData.mention_text; // Alias for conditions
      variables.username = triggerData.from_username;
      variables.user_id = triggerData.from_id;
      variables.media_id = triggerData.media_id;
    }

    // Story replies
    if (triggerData.reply_id || triggerData.reply_text) {
      variables.reply_id = triggerData.reply_id;
      variables.reply_text = triggerData.reply_text;
      variables.message_text = triggerData.reply_text; // Alias for conditions
      variables.username = triggerData.from_username;
      variables.user_id = triggerData.from_id;
    }

    return variables;
  }

  private replaceVariables(text: string): string {
    let result = text;
    for (const [key, value] of Object.entries(this.context.variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return result;
  }

  private evaluateCondition(condition: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.context.variables[field] || "";
    const fieldStr = String(fieldValue).toLowerCase();
    const valueStr = String(value).toLowerCase();

    switch (operator) {
      case "contains":
        return fieldStr.includes(valueStr);
      case "equals":
        return fieldStr === valueStr;
      case "not_contains":
        return !fieldStr.includes(valueStr);
      case "not_equals":
        return fieldStr !== valueStr;
      case "regex":
        try {
          const regex = new RegExp(value, 'i');
          return regex.test(fieldStr);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private evaluateConditions(conditions: any[], logicOperator: string = "AND"): boolean {
    if (!conditions || conditions.length === 0) return true;

    if (logicOperator === "AND") {
      return conditions.every(cond => this.evaluateCondition(cond));
    } else {
      return conditions.some(cond => this.evaluateCondition(cond));
    }
  }

  private async executeAction(actionType: string, actionConfig: any): Promise<any> {
    const config = { ...actionConfig };

    // Replace variables in config
    if (config.message) {
      config.message = this.replaceVariables(config.message);
    }
    if (config.url) {
      config.url = this.replaceVariables(config.url);
    }

    console.log(`[FlowEngine] Executing action: ${actionType}`, {
      config,
      variables: this.context.variables,
    });

    switch (actionType) {
      case "reply_comment":
        if (this.context.variables.comment_id && config.message) {
          console.log(`[FlowEngine] Replying to comment ${this.context.variables.comment_id}: ${config.message}`);
          try {
            const result = await this.api.replyToComment(this.context.variables.comment_id, config.message);
            console.log(`[FlowEngine] Reply successful, result:`, result);
            return { success: true, action: "reply_comment", comment_id: this.context.variables.comment_id, message: config.message, result };
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to reply to comment:`, error);
            throw error;
          }
        } else {
          const errorMsg = "Missing comment_id or message for reply_comment action";
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "send_dm":
        if (this.context.variables.sender_id && config.message) {
          console.log(`[FlowEngine] Sending DM to sender ${this.context.variables.sender_id}: ${config.message}`);
          try {
            let result;
            // Check if button template is configured
            if (config.buttons && Array.isArray(config.buttons) && config.buttons.length > 0) {
              console.log(`[FlowEngine] Sending DM with button template (${config.buttons.length} buttons)`);
              result = await this.api.sendButtonTemplate(
                this.context.variables.sender_id,
                config.message,
                config.subtitle,
                config.buttons
              );
            } else {
              // Regular text message
              result = await this.api.sendDirectMessage(this.context.variables.sender_id, config.message);
            }
            console.log(`[FlowEngine] DM sent successfully, result:`, result);
            return { success: true, action: "send_dm", sender_id: this.context.variables.sender_id, message: config.message, result };
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to send DM:`, error);
            throw error;
          }
        } else {
          const errorMsg = `Missing sender_id or message for send_dm action (sender_id: ${this.context.variables.sender_id})`;
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "delete_comment":
        if (this.context.variables.comment_id) {
          console.log(`[FlowEngine] Deleting comment ${this.context.variables.comment_id}`);
          try {
            const result = await this.api.deleteComment(this.context.variables.comment_id);
            console.log(`[FlowEngine] Comment deleted successfully, result:`, result);
            return { success: true, action: "delete_comment", comment_id: this.context.variables.comment_id, result };
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to delete comment:`, error);
            throw error;
          }
        } else {
          const errorMsg = "Missing comment_id for delete_comment action";
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "hide_comment":
        if (this.context.variables.comment_id) {
          console.log(`[FlowEngine] Hiding comment ${this.context.variables.comment_id}`);
          try {
            const result = await this.api.hideComment(this.context.variables.comment_id);
            console.log(`[FlowEngine] Comment hidden successfully, result:`, result);
            return { success: true, action: "hide_comment", comment_id: this.context.variables.comment_id, result };
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to hide comment:`, error);
            throw error;
          }
        } else {
          const errorMsg = "Missing comment_id for hide_comment action";
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "like_comment":
        if (this.context.variables.comment_id) {
          console.log(`[FlowEngine] Liking comment ${this.context.variables.comment_id}`);
          try {
            const result = await this.api.likeComment(this.context.variables.comment_id);
            console.log(`[FlowEngine] Comment liked successfully, result:`, result);
            return { success: true, action: "like_comment", comment_id: this.context.variables.comment_id, result };
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to like comment:`, error);
            throw error;
          }
        } else {
          const errorMsg = "Missing comment_id for like_comment action";
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "send_link":
        if (this.context.variables.sender_id && config.url) {
          console.log(`[FlowEngine] Sending link to sender ${this.context.variables.sender_id}: ${config.url}`);
          try {
            const result = await this.api.sendDirectMessage(this.context.variables.sender_id, config.url);
            console.log(`[FlowEngine] Link sent successfully, result:`, result);
            return { success: true, action: "send_link", sender_id: this.context.variables.sender_id, url: config.url, result };
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to send link:`, error);
            throw error;
          }
        } else {
          const errorMsg = `Missing sender_id or url for send_link action (sender_id: ${this.context.variables.sender_id})`;
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "api_call":
        if (config.endpoint) {
          console.log(`[FlowEngine] Calling API endpoint ${config.endpoint}`);
          try {
            const axios = (await import("axios")).default;
            const method = (config.method || "POST").toLowerCase();
            const result = await axios({
              method,
              url: config.endpoint,
              data: this.context.triggerData,
            });
            console.log(`[FlowEngine] API call successful, result:`, result.data);
            return { success: true, action: "api_call", endpoint: config.endpoint, method, result: result.data };
          } catch (error: any) {
            console.error(`[FlowEngine] API call failed:`, error);
            throw error;
          }
        } else {
          const errorMsg = "Missing endpoint for api_call action";
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "delay":
        if (config.seconds) {
          const seconds = parseInt(config.seconds);
          console.log(`[FlowEngine] Delaying for ${seconds} seconds`);
          await new Promise(resolve => setTimeout(resolve, seconds * 1000));
          console.log(`[FlowEngine] Delay completed`);
          return { success: true, action: "delay", seconds };
        } else {
          const errorMsg = "Missing seconds for delay action";
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "set_variable":
        if (config.variableName) {
          const variableValue = this.replaceVariables(config.variableValue || "");
          console.log(`[FlowEngine] Setting variable ${config.variableName} = ${variableValue}`);
          this.context.variables[config.variableName] = variableValue;
          return { 
            success: true, 
            action: "set_variable", 
            variableName: config.variableName, 
            variableValue,
            allVariables: this.context.variables
          };
        } else {
          const errorMsg = "Missing variableName for set_variable action";
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      case "stop_flow":
        console.log(`[FlowEngine] Stopping flow execution`);
        return { success: true, action: "stop_flow", message: "Flow execution stopped" };

      case "ai_agent":
        if (config.agentId && this.context.variables.sender_id) {
          console.log(`[FlowEngine] Starting AI agent conversation with agent ${config.agentId}`);
          try {
            const { GeminiService } = await import("./gemini-service");
            
            // Get the agent
            const agent = await storage.getAgent(config.agentId);
            if (!agent) {
              throw new Error(`Agent ${config.agentId} not found`);
            }

            // Get the account to find userId
            const account = await storage.getAccount(this.flow.accountId);
            if (!account) {
              throw new Error(`Account ${this.flow.accountId} not found`);
            }

            // Create a conversation for this agent interaction
            const conversation = await storage.createConversation({
              agentId: config.agentId,
              userId: account.userId,
              title: `Flow: ${this.flow.name} - ${this.context.variables.username || this.context.variables.sender_id}`,
            });

            // Get execution ID from context
            const executionId = this.context.executionId;
            if (!executionId) {
              throw new Error("Execution ID not found in context. AI Agent action requires execution ID.");
            }

            // Create active agent conversation
            const activeConversation = await storage.createActiveAgentConversation({
              agentId: config.agentId,
              executionId,
              conversationId: conversation.id,
              instagramUserId: this.context.variables.sender_id,
              accountId: this.flow.accountId,
              isActive: true,
            });

            // Prepare initial context for the agent
            const initialMessage = `New ${this.context.triggerData.trigger_type || 'message'} from Instagram user @${this.context.variables.username || 'user'}: "${this.context.variables.message_text || ''}"`;

            // Save the flow-triggered context message
            await storage.createMessage({
              conversationId: conversation.id,
              role: "user",
              content: initialMessage,
            });

            // Get conversation history and memory
            const conversationHistory = await storage.getMessagesByConversation(conversation.id);
            const memory = agent.enableMemory ? await storage.getMemoryByAgent(agent.id, 10) : [];

            // Send the initial message to the agent using static method
            const agentResponse = await GeminiService.chatWithTools({
              agent,
              message: initialMessage,
              conversationHistory,
              memory,
              storage,
            });

            // Save the agent's response to conversation history
            if (agentResponse && agentResponse.content) {
              await storage.createMessage({
                conversationId: conversation.id,
                role: "assistant",
                content: agentResponse.content,
              });

              // Send the agent's response as a DM
              await this.api.sendDirectMessage(
                this.context.variables.sender_id,
                agentResponse.content
              );
            } else {
              console.warn(`[FlowEngine] Agent returned no content for conversation ${conversation.id}`);
            }

            console.log(`[FlowEngine] AI agent conversation started successfully`);
            return { 
              success: true, 
              action: "ai_agent", 
              agentId: config.agentId,
              conversationId: conversation.id,
              activeConversationId: activeConversation.id,
              response: agentResponse?.content || "Agent started",
            };
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to start AI agent conversation:`, error);
            throw error;
          }
        } else {
          const errorMsg = `Missing agentId or sender_id for ai_agent action (agentId: ${config.agentId}, sender_id: ${this.context.variables.sender_id})`;
          console.log(`[FlowEngine] ${errorMsg}`);
          throw new Error(errorMsg);
        }

      default:
        const errorMsg = `Unknown action type: ${actionType}`;
        console.log(`[FlowEngine] ${errorMsg}`);
        throw new Error(errorMsg);
    }
  }

  private findNextNode(currentNodeId: string, branchLabel?: string): any {
    const edge = this.flow.edges.find(e => {
      if (branchLabel) {
        // Check sourceHandle for condition branching (true/false)
        return e.source === currentNodeId && e.sourceHandle === branchLabel;
      }
      return e.source === currentNodeId;
    });

    if (!edge) return null;
    return this.flow.nodes.find(n => n.id === edge.target);
  }

  private async executeNode(node: any): Promise<string | null> {
    this.context.executionPath.push(node.id);

    try {
      switch (node.type) {
        case "trigger":
          // Trigger is the starting point, continue to next
          this.context.nodeResults.push({
            nodeId: node.id,
            nodeType: "trigger",
            success: true,
            output: { triggerType: node.data.triggerType, triggerData: this.context.triggerData },
          });
          return node.id;

        case "condition":
          const conditionsMet = this.evaluateConditions(
            node.data.conditions,
            node.data.logicOperator
          );
          this.context.nodeResults.push({
            nodeId: node.id,
            nodeType: "condition",
            success: true,
            output: { 
              conditionsMet, 
              conditions: node.data.conditions,
              logicOperator: node.data.logicOperator,
              variables: this.context.variables,
            },
          });
          return conditionsMet ? `${node.id}-true` : `${node.id}-false`;

        case "action":
          if (node.data.actionType) {
            const actionResult = await this.executeAction(node.data.actionType, node.data.actionConfig || {});
            this.context.nodeResults.push({
              nodeId: node.id,
              nodeType: "action",
              success: true,
              output: { 
                actionType: node.data.actionType, 
                config: node.data.actionConfig,
                result: actionResult,
              },
            });
            
            // Stop flow execution if stop_flow action
            if (node.data.actionType === "stop_flow") {
              console.log(`[FlowEngine] Flow stopped at node ${node.id}`);
              return null;
            }
          }
          return node.id;

        default:
          this.context.nodeResults.push({
            nodeId: node.id,
            nodeType: node.type || "unknown",
            success: true,
          });
          return node.id;
      }
    } catch (error: any) {
      this.context.nodeResults.push({
        nodeId: node.id,
        nodeType: node.type,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  async execute(): Promise<{ success: boolean; executionPath: string[]; nodeResults: NodeExecutionResult[]; error?: string }> {
    try {
      // Find trigger node
      const triggerNode = this.flow.nodes.find(n => n.type === "trigger");
      if (!triggerNode) {
        throw new Error("No trigger node found in flow");
      }

      let currentNode: any = triggerNode;

      while (currentNode) {
        const result = await this.executeNode(currentNode);
        
        if (!result) break;

        // Find next node based on result
        if (result.includes("-true")) {
          const nodeId = result.replace("-true", "");
          currentNode = this.findNextNode(nodeId, "true");
        } else if (result.includes("-false")) {
          const nodeId = result.replace("-false", "");
          currentNode = this.findNextNode(nodeId, "false");
        } else {
          currentNode = this.findNextNode(result);
        }
      }

      return {
        success: true,
        executionPath: this.context.executionPath,
        nodeResults: this.context.nodeResults,
      };
    } catch (error: any) {
      return {
        success: false,
        executionPath: this.context.executionPath,
        nodeResults: this.context.nodeResults,
        error: error.message,
      };
    }
  }
}
