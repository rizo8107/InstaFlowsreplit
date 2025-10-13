import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Instagram Accounts
export const instagramAccounts = pgTable("instagram_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  username: text("username").notNull(),
  instagramUserId: text("instagram_user_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  pageId: text("page_id"), // Facebook Page ID for Private Replies
  pageAccessToken: text("page_access_token"), // Facebook Page token for Private Replies
  profilePicture: text("profile_picture"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInstagramAccountSchema = createInsertSchema(instagramAccounts).omit({
  id: true,
  createdAt: true,
});

export type InsertInstagramAccount = z.infer<typeof insertInstagramAccountSchema>;
export type InstagramAccount = typeof instagramAccounts.$inferSelect;

// Flow Nodes
export const nodeTypeEnum = z.enum([
  "trigger", // Start of flow
  "condition", // If/else logic
  "action", // Actions to perform
]);

export const conditionOperatorEnum = z.enum(["contains", "equals", "regex", "not_contains", "not_equals"]);
export const logicOperatorEnum = z.enum(["AND", "OR"]);
export const actionTypeEnum = z.enum([
  "reply_comment",
  "send_dm",
  "delete_comment",
  "hide_comment",
  "like_comment",
  "send_link",
  "api_call",
  "delay",
  "ai_agent",
]);

export const triggerTypeEnum = z.enum([
  "comment_received",
  "dm_received",
  "mention_received",
  "story_reply_received",
]);

// Flow Node Schema
export const nodeSchema = z.object({
  id: z.string(),
  type: nodeTypeEnum,
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    label: z.string().optional(),
    // Trigger data
    triggerType: triggerTypeEnum.optional(),
    // Condition data
    conditions: z.array(z.object({
      field: z.string(),
      operator: conditionOperatorEnum,
      value: z.string(),
    })).optional(),
    logicOperator: logicOperatorEnum.optional(),
    // Action data
    actionType: actionTypeEnum.optional(),
    actionConfig: z.record(z.any()).optional(),
  }),
});

export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  label: z.string().optional(),
  type: z.string().optional(),
});

// Flows
export const flows = pgTable("flows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(false),
  nodes: jsonb("nodes").notNull().$type<z.infer<typeof nodeSchema>[]>(),
  edges: jsonb("edges").notNull().$type<z.infer<typeof edgeSchema>[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFlowSchema = createInsertSchema(flows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFlowSchema = insertFlowSchema.partial();

export type InsertFlow = z.infer<typeof insertFlowSchema>;
export type UpdateFlow = z.infer<typeof updateFlowSchema>;
export type Flow = typeof flows.$inferSelect;

// Flow Executions
export const flowExecutions = pgTable("flow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar("flow_id").notNull().references(() => flows.id, { onDelete: 'cascade' }),
  accountId: varchar("account_id").notNull().references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  triggerType: text("trigger_type").notNull(),
  triggerData: jsonb("trigger_data").notNull(),
  status: text("status").notNull(), // success, failed, running
  executionPath: jsonb("execution_path").$type<string[]>(),
  nodeResults: jsonb("node_results"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFlowExecutionSchema = createInsertSchema(flowExecutions).omit({
  id: true,
  createdAt: true,
});

export type InsertFlowExecution = z.infer<typeof insertFlowExecutionSchema>;
export type FlowExecution = typeof flowExecutions.$inferSelect;

// Webhook Events
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;

// Flow Templates
export const flowTemplates = pgTable("flow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // auto-reply, moderation, engagement, dm-automation
  nodes: jsonb("nodes").notNull().$type<z.infer<typeof nodeSchema>[]>(),
  edges: jsonb("edges").notNull().$type<z.infer<typeof edgeSchema>[]>(),
  isPublic: boolean("is_public").notNull().default(true),
  useCount: text("use_count").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFlowTemplateSchema = createInsertSchema(flowTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertFlowTemplate = z.infer<typeof insertFlowTemplateSchema>;
export type FlowTemplate = typeof flowTemplates.$inferSelect;

// Contacts
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  instagramUserId: text("instagram_user_id").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// AI Agents
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  model: text("model").notNull().default("gemini-2.5-flash"), // gemini model
  systemPrompt: text("system_prompt").notNull(),
  temperature: text("temperature").notNull().default("0.7"),
  maxTokens: text("max_tokens").notNull().default("8192"),
  enableMemory: boolean("enable_memory").notNull().default(true),
  enableTools: boolean("enable_tools").notNull().default(true),
  tools: jsonb("tools").notNull().default([]).$type<string[]>(), // array of tool names
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAgentSchema = insertAgentSchema.partial();

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type UpdateAgent = z.infer<typeof updateAgentSchema>;
export type Agent = typeof agents.$inferSelect;

// Agent Templates
export const agentTemplates = pgTable("agent_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("🤖"), // emoji or icon name
  category: text("category").notNull(), // customer-support, lead-qualification, faq, sales, general
  model: text("model").notNull().default("gemini-2.5-flash"),
  systemPrompt: text("system_prompt").notNull(),
  temperature: text("temperature").notNull().default("0.7"),
  maxTokens: text("max_tokens").notNull().default("8192"),
  enableMemory: boolean("enable_memory").notNull().default(true),
  enableTools: boolean("enable_tools").notNull().default(true),
  tools: jsonb("tools").notNull().default([]).$type<string[]>(),
  isPublic: boolean("is_public").notNull().default(true),
  useCount: text("use_count").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentTemplateSchema = createInsertSchema(agentTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentTemplate = z.infer<typeof insertAgentTemplateSchema>;
export type AgentTemplate = typeof agentTemplates.$inferSelect;

// Agent Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Agent Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Agent Memory (RAG)
export const agentMemory = pgTable("agent_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  embedding: text("embedding"), // For future vector search
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  source: text("source"), // user_provided, learned, imported
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentMemorySchema = createInsertSchema(agentMemory).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemory.$inferSelect;

// Active Agent Conversations (for flow-triggered agents)
export const activeAgentConversations = pgTable("active_agent_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  executionId: varchar("execution_id").notNull().references(() => flowExecutions.id, { onDelete: 'cascade' }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  instagramUserId: text("instagram_user_id").notNull(), // The Instagram user the agent is conversing with
  accountId: varchar("account_id").notNull().references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
});

export const insertActiveAgentConversationSchema = createInsertSchema(activeAgentConversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export type InsertActiveAgentConversation = z.infer<typeof insertActiveAgentConversationSchema>;
export type ActiveAgentConversation = typeof activeAgentConversations.$inferSelect;
