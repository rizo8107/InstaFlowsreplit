import { storage } from "./storage";

// Common automation templates
const templates = [
  {
    name: "Auto-Reply to Comments",
    description: "Automatically reply to comments containing specific keywords with a personalized message",
    category: "auto-reply",
    isPublic: true,
    useCount: "0",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger" as const,
        position: { x: 100, y: 100 },
        data: {
          label: "Comment Received",
          triggerType: "comment_received" as const,
        },
      },
      {
        id: "condition-1",
        type: "condition" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Contains Keywords?",
          conditions: [
            { field: "message_text", operator: "contains" as const, value: "thanks" },
            { field: "message_text", operator: "contains" as const, value: "love" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Reply with Thanks",
          actionType: "reply_comment" as const,
          actionConfig: {
            message: "Thank you so much @{username}! We appreciate your support! 💙",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", label: "Yes" },
    ],
  },
  {
    name: "Comment Moderation",
    description: "Hide or delete comments containing spam, profanity, or unwanted keywords",
    category: "moderation",
    isPublic: true,
    useCount: "0",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger" as const,
        position: { x: 100, y: 100 },
        data: {
          label: "Comment Received",
          triggerType: "comment_received" as const,
        },
      },
      {
        id: "condition-1",
        type: "condition" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Contains Spam?",
          conditions: [
            { field: "message_text", operator: "contains" as const, value: "spam" },
            { field: "message_text", operator: "contains" as const, value: "buy now" },
            { field: "message_text", operator: "contains" as const, value: "click here" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Hide Comment",
          actionType: "hide_comment" as const,
          actionConfig: {},
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", label: "Yes" },
    ],
  },
  {
    name: "DM Welcome Sequence",
    description: "Send a welcome message with helpful links when someone sends their first DM",
    category: "dm-automation",
    isPublic: true,
    useCount: "0",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger" as const,
        position: { x: 100, y: 100 },
        data: {
          label: "DM Received",
          triggerType: "dm_received" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Send Welcome Message",
          actionType: "send_dm" as const,
          actionConfig: {
            message: "Hey @{username}! 👋 Thanks for reaching out! How can we help you today?",
          },
        },
      },
      {
        id: "action-2",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Wait 2 Seconds",
          actionType: "delay" as const,
          actionConfig: {
            duration: "2000",
          },
        },
      },
      {
        id: "action-3",
        type: "action" as const,
        position: { x: 100, y: 550 },
        data: {
          label: "Send Help Links",
          actionType: "send_link" as const,
          actionConfig: {
            url: "https://help.example.com",
            message: "Check out our help center for quick answers:",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "action-1" },
      { id: "e2-3", source: "action-1", target: "action-2" },
      { id: "e3-4", source: "action-2", target: "action-3" },
    ],
  },
  {
    name: "Auto-Like Positive Comments",
    description: "Automatically like comments containing positive keywords and emojis",
    category: "engagement",
    isPublic: true,
    useCount: "0",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger" as const,
        position: { x: 100, y: 100 },
        data: {
          label: "Comment Received",
          triggerType: "comment_received" as const,
        },
      },
      {
        id: "condition-1",
        type: "condition" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Positive Comment?",
          conditions: [
            { field: "message_text", operator: "contains" as const, value: "amazing" },
            { field: "message_text", operator: "contains" as const, value: "love" },
            { field: "message_text", operator: "contains" as const, value: "great" },
            { field: "message_text", operator: "contains" as const, value: "awesome" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Like Comment",
          actionType: "like_comment" as const,
          actionConfig: {},
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", label: "Yes" },
    ],
  },
  {
    name: "Story Mention Auto-Reply",
    description: "Thank users who mention you in their stories with an automated DM",
    category: "engagement",
    isPublic: true,
    useCount: "0",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger" as const,
        position: { x: 100, y: 100 },
        data: {
          label: "Story Mention",
          triggerType: "mention_received" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Send Thank You DM",
          actionType: "send_dm" as const,
          actionConfig: {
            message: "Thanks so much for the mention @{username}! 🙏 We really appreciate your support!",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "action-1" },
    ],
  },
];

export async function seedTemplates() {
  console.log("Seeding flow templates...");
  
  for (const template of templates) {
    try {
      await storage.createTemplate(template);
      console.log(`✓ Created template: ${template.name}`);
    } catch (error) {
      console.error(`✗ Failed to create template ${template.name}:`, error);
    }
  }
  
  console.log("Template seeding complete!");
}
