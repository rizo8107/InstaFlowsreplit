import type { Flow } from "@shared/schema";
import { InstagramAPI } from "./instagram-api";
import { storage } from "./storage";

interface ExecutionContext {
  triggerData: any;
  variables: Record<string, any>;
  executionPath: string[];
}

export class FlowEngine {
  private api: InstagramAPI;
  private flow: Flow;
  private context: ExecutionContext;

  constructor(api: InstagramAPI, flow: Flow, triggerData: any) {
    this.api = api;
    this.flow = flow;
    this.context = {
      triggerData,
      variables: this.extractVariables(triggerData),
      executionPath: [],
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
      variables.media_id = triggerData.media_id;
    }
    
    // DMs/Messages
    if (triggerData.message_id || triggerData.message_text) {
      variables.message_id = triggerData.message_id;
      variables.message_text = triggerData.message_text;
      variables.user_id = triggerData.sender_id;
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

  private async executeAction(actionType: string, actionConfig: any): Promise<void> {
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
            await this.api.replyToComment(this.context.variables.comment_id, config.message);
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to reply to comment:`, error.response?.data || error.message);
            throw error;
          }
        } else {
          console.log(`[FlowEngine] Missing comment_id or message for reply_comment action`);
        }
        break;

      case "send_dm":
        if (this.context.variables.user_id && config.message) {
          console.log(`[FlowEngine] Sending DM to ${this.context.variables.user_id}: ${config.message}`);
          try {
            await this.api.sendDirectMessage(this.context.variables.user_id, config.message);
          } catch (error: any) {
            console.error(`[FlowEngine] Failed to send DM:`, error.response?.data || error.message);
            throw error;
          }
        } else {
          console.log(`[FlowEngine] Missing user_id or message for send_dm action`, {
            user_id: this.context.variables.user_id,
            message: config.message,
          });
        }
        break;

      case "delete_comment":
        if (this.context.variables.comment_id) {
          await this.api.deleteComment(this.context.variables.comment_id);
        }
        break;

      case "hide_comment":
        if (this.context.variables.comment_id) {
          await this.api.hideComment(this.context.variables.comment_id);
        }
        break;

      case "like_comment":
        if (this.context.variables.comment_id) {
          await this.api.likeComment(this.context.variables.comment_id);
        }
        break;

      case "send_link":
        if (this.context.variables.user_id && config.url) {
          await this.api.sendDirectMessage(this.context.variables.user_id, config.url);
        }
        break;

      case "api_call":
        if (config.endpoint) {
          const axios = (await import("axios")).default;
          const method = (config.method || "POST").toLowerCase();
          await axios({
            method,
            url: config.endpoint,
            data: this.context.triggerData,
          });
        }
        break;

      case "delay":
        if (config.seconds) {
          await new Promise(resolve => setTimeout(resolve, parseInt(config.seconds) * 1000));
        }
        break;
    }
  }

  private findNextNode(currentNodeId: string, branchLabel?: string): any {
    const edge = this.flow.edges.find(e => {
      if (branchLabel) {
        return e.source === currentNodeId && e.id.includes(branchLabel);
      }
      return e.source === currentNodeId;
    });

    if (!edge) return null;
    return this.flow.nodes.find(n => n.id === edge.target);
  }

  private async executeNode(node: any): Promise<string | null> {
    this.context.executionPath.push(node.id);

    switch (node.type) {
      case "trigger":
        // Trigger is the starting point, continue to next
        return node.id;

      case "condition":
        const conditionsMet = this.evaluateConditions(
          node.data.conditions,
          node.data.logicOperator
        );
        return conditionsMet ? `${node.id}-true` : `${node.id}-false`;

      case "action":
        if (node.data.actionType && node.data.actionConfig) {
          await this.executeAction(node.data.actionType, node.data.actionConfig);
        }
        return node.id;

      default:
        return node.id;
    }
  }

  async execute(): Promise<{ success: boolean; executionPath: string[]; error?: string }> {
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
      };
    } catch (error: any) {
      return {
        success: false,
        executionPath: this.context.executionPath,
        error: error.message,
      };
    }
  }
}
