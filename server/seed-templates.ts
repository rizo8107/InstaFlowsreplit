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
  {
    name: "Lead Generation - Comment to DM",
    description: "When users comment 'DM' or 'interested', automatically send them product info via DM",
    category: "dm-automation",
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
          label: "Interested?",
          conditions: [
            { field: "comment_text", operator: "contains" as const, value: "DM" },
            { field: "comment_text", operator: "contains" as const, value: "interested" },
            { field: "comment_text", operator: "contains" as const, value: "info" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Reply to Comment",
          actionType: "reply_comment" as const,
          actionConfig: {
            message: "Check your DM @{username}! 📩",
          },
        },
      },
      {
        id: "action-2",
        type: "action" as const,
        position: { x: 100, y: 550 },
        data: {
          label: "Send Product Info",
          actionType: "send_dm" as const,
          actionConfig: {
            message: "Hey @{username}! Here's all the info you need. Ready to get started? 🚀",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", sourceHandle: "true" },
      { id: "e3-4", source: "action-1", target: "action-2" },
    ],
  },
  {
    name: "FAQ Auto-Responder",
    description: "Automatically answer common questions about pricing, shipping, or hours",
    category: "auto-reply",
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
        id: "condition-1",
        type: "condition" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Pricing Question?",
          conditions: [
            { field: "message_text", operator: "contains" as const, value: "price" },
            { field: "message_text", operator: "contains" as const, value: "cost" },
            { field: "message_text", operator: "contains" as const, value: "how much" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Send Pricing Info",
          actionType: "send_dm" as const,
          actionConfig: {
            message: "Our prices start at $29/month. Check out all our plans: https://yoursite.com/pricing 💰",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", sourceHandle: "true" },
    ],
  },
  {
    name: "Giveaway Entry Manager",
    description: "Automatically track and confirm giveaway entries from comments",
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
          label: "Valid Entry?",
          conditions: [
            { field: "comment_text", operator: "contains" as const, value: "enter" },
            { field: "comment_text", operator: "contains" as const, value: "giveaway" },
            { field: "comment_text", operator: "contains" as const, value: "contest" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Like Entry",
          actionType: "like_comment" as const,
          actionConfig: {},
        },
      },
      {
        id: "action-2",
        type: "action" as const,
        position: { x: 100, y: 550 },
        data: {
          label: "Confirm Entry",
          actionType: "reply_comment" as const,
          actionConfig: {
            message: "You're in @{username}! 🎉 Good luck!",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", sourceHandle: "true" },
      { id: "e3-4", source: "action-1", target: "action-2" },
    ],
  },
  {
    name: "Customer Support Triage",
    description: "Route urgent support requests and provide instant help resources",
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
        id: "condition-1",
        type: "condition" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Urgent Issue?",
          conditions: [
            { field: "message_text", operator: "contains" as const, value: "urgent" },
            { field: "message_text", operator: "contains" as const, value: "help" },
            { field: "message_text", operator: "contains" as const, value: "issue" },
            { field: "message_text", operator: "contains" as const, value: "problem" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Send Support Resources",
          actionType: "send_dm" as const,
          actionConfig: {
            message: "We're here to help @{username}! Check out our help center while we get back to you: https://help.yoursite.com 🆘",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", sourceHandle: "true" },
    ],
  },
  {
    name: "Influencer Collaboration Response",
    description: "Automatically respond to collaboration inquiries with your media kit",
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
        id: "condition-1",
        type: "condition" as const,
        position: { x: 100, y: 250 },
        data: {
          label: "Collab Request?",
          conditions: [
            { field: "message_text", operator: "contains" as const, value: "collab" },
            { field: "message_text", operator: "contains" as const, value: "partnership" },
            { field: "message_text", operator: "contains" as const, value: "work together" },
            { field: "message_text", operator: "contains" as const, value: "sponsor" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Send Media Kit",
          actionType: "send_dm" as const,
          actionConfig: {
            message: "Thanks for reaching out @{username}! I'd love to collaborate. Here's my media kit: https://yoursite.com/mediakit 🤝",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", sourceHandle: "true" },
    ],
  },
  {
    name: "Negative Comment Alert & Hide",
    description: "Automatically hide negative comments and get notified",
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
          label: "Negative?",
          conditions: [
            { field: "comment_text", operator: "contains" as const, value: "hate" },
            { field: "comment_text", operator: "contains" as const, value: "worst" },
            { field: "comment_text", operator: "contains" as const, value: "scam" },
            { field: "comment_text", operator: "contains" as const, value: "terrible" },
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
      { id: "e2-3", source: "condition-1", target: "action-1", sourceHandle: "true" },
    ],
  },
  {
    name: "Product Launch Hype Builder",
    description: "Build excitement by auto-replying to product launch comments",
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
          label: "Launch Interest?",
          conditions: [
            { field: "comment_text", operator: "contains" as const, value: "when" },
            { field: "comment_text", operator: "contains" as const, value: "launch" },
            { field: "comment_text", operator: "contains" as const, value: "release" },
            { field: "comment_text", operator: "contains" as const, value: "available" },
          ],
          logicOperator: "OR" as const,
        },
      },
      {
        id: "action-1",
        type: "action" as const,
        position: { x: 100, y: 400 },
        data: {
          label: "Build Hype",
          actionType: "reply_comment" as const,
          actionConfig: {
            message: "So soon @{username}! Drop a 🔥 if you're ready!",
          },
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "action-1", sourceHandle: "true" },
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
