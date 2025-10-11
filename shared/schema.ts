import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Instagram Accounts
export const instagramAccounts = pgTable("instagram_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  instagramUserId: text("instagram_user_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
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
