import {
  type InstagramAccount,
  type InsertInstagramAccount,
  type Flow,
  type InsertFlow,
  type UpdateFlow,
  type FlowExecution,
  type InsertFlowExecution,
  type WebhookEvent,
  type InsertWebhookEvent,
  type FlowTemplate,
  type InsertFlowTemplate,
  type Contact,
  type InsertContact,
  type User,
  type InsertUser,
  type Agent,
  type InsertAgent,
  type UpdateAgent,
  type AgentTemplate,
  type InsertAgentTemplate,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type AgentMemory,
  type InsertAgentMemory,
  type ActiveAgentConversation,
  type InsertActiveAgentConversation,
  instagramAccounts,
  flows,
  flowExecutions,
  webhookEvents,
  flowTemplates,
  contacts,
  users,
  agents,
  agentTemplates,
  conversations,
  messages,
  agentMemory,
  activeAgentConversations
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";


export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Health Check
  healthCheck(): Promise<boolean>;

  // Session Store
  sessionStore: session.Store;

  // Instagram Accounts
  getAccount(id: string): Promise<InstagramAccount | undefined>;
  getAccountByUserId(instagramUserId: string): Promise<InstagramAccount | undefined>;
  getAllAccounts(): Promise<InstagramAccount[]>;
  getUserAccounts(userId: string): Promise<InstagramAccount[]>;
  createAccount(account: InsertInstagramAccount): Promise<InstagramAccount>;
  updateAccount(id: string, updates: Partial<InstagramAccount>): Promise<InstagramAccount | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  // Flows
  getFlow(id: string): Promise<Flow | undefined>;
  getFlowsByAccount(accountId: string): Promise<Flow[]>;
  getAllFlows(): Promise<Flow[]>;
  getActiveFlows(): Promise<Flow[]>;
  createFlow(flow: InsertFlow): Promise<Flow>;
  updateFlow(id: string, updates: UpdateFlow): Promise<Flow | undefined>;
  deleteFlow(id: string): Promise<boolean>;

  // Flow Executions
  getExecution(id: string): Promise<FlowExecution | undefined>;
  getExecutionsByFlow(flowId: string): Promise<FlowExecution[]>;
  getExecutionsByAccount(accountId: string): Promise<FlowExecution[]>;
  getAllExecutions(): Promise<FlowExecution[]>;
  getRecentExecutions(limit: number): Promise<FlowExecution[]>;
  createExecution(execution: InsertFlowExecution): Promise<FlowExecution>;
  updateExecution(id: string, updates: Partial<FlowExecution>): Promise<FlowExecution | undefined>;

  // Webhook Events
  getWebhookEvent(id: string): Promise<WebhookEvent | undefined>;
  getAllWebhookEvents(): Promise<WebhookEvent[]>;
  getRecentWebhookEvents(limit: number): Promise<WebhookEvent[]>;
  getUnprocessedWebhookEvents(): Promise<WebhookEvent[]>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  markWebhookEventProcessed(id: string): Promise<boolean>;

  // Flow Templates
  getTemplate(id: string): Promise<FlowTemplate | undefined>;
  getAllTemplates(): Promise<FlowTemplate[]>;
  getTemplatesByCategory(category: string): Promise<FlowTemplate[]>;
  createTemplate(template: InsertFlowTemplate): Promise<FlowTemplate>;
  incrementTemplateUseCount(id: string): Promise<boolean>;

  // Contacts
  getContact(id: string): Promise<Contact | undefined>;
  getContactsByAccount(accountId: string): Promise<Contact[]>;
  getAllContacts(): Promise<Contact[]>;
  getContactByInstagramUserId(accountId: string, instagramUserId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  upsertContact(accountId: string, instagramUserId: string, username?: string): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  // AI Agents
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentsByUser(userId: string): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: UpdateAgent): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;

  // Agent Templates
  getAgentTemplate(id: string): Promise<AgentTemplate | undefined>;
  getAllAgentTemplates(): Promise<AgentTemplate[]>;
  getAgentTemplatesByCategory(category: string): Promise<AgentTemplate[]>;
  createAgentTemplate(template: InsertAgentTemplate): Promise<AgentTemplate>;
  incrementAgentTemplateUseCount(id: string): Promise<boolean>;

  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByAgent(agentId: string): Promise<Conversation[]>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Agent Memory
  getMemory(id: string): Promise<AgentMemory | undefined>;
  getMemoryByAgent(agentId: string, limit?: number): Promise<AgentMemory[]>;
  createMemory(memory: InsertAgentMemory): Promise<AgentMemory>;
  deleteMemory(id: string): Promise<boolean>;

  // Active Agent Conversations (for flow-triggered agents)
  getActiveAgentConversation(id: string): Promise<ActiveAgentConversation | undefined>;
  getActiveConversationByInstagramUser(instagramUserId: string, accountId: string): Promise<ActiveAgentConversation | undefined>;
  getActiveConversationsByAgent(agentId: string): Promise<ActiveAgentConversation[]>;
  createActiveAgentConversation(conversation: InsertActiveAgentConversation): Promise<ActiveAgentConversation>;
  updateActiveAgentConversation(id: string, updates: Partial<ActiveAgentConversation>): Promise<ActiveAgentConversation | undefined>;
  deactivateAgentConversation(id: string): Promise<boolean>;
}

import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await db.select().from(users).limit(1);
      return true;
    } catch (error) {
      console.error('[HealthCheck] Database connection failed:', error);
      return false;
    }
  }

  // Instagram Accounts
  async getAccount(id: string): Promise<InstagramAccount | undefined> {
    const [account] = await db.select().from(instagramAccounts).where(eq(instagramAccounts.id, id));
    return account || undefined;
  }

  async getAccountByUserId(instagramUserId: string): Promise<InstagramAccount | undefined> {
    const [account] = await db.select().from(instagramAccounts).where(eq(instagramAccounts.instagramUserId, instagramUserId));
    return account || undefined;
  }

  async getAllAccounts(): Promise<InstagramAccount[]> {
    return await db.select().from(instagramAccounts).orderBy(desc(instagramAccounts.createdAt));
  }

  async getUserAccounts(userId: string): Promise<InstagramAccount[]> {
    return await db.select().from(instagramAccounts).where(eq(instagramAccounts.userId, userId)).orderBy(desc(instagramAccounts.createdAt));
  }

  async createAccount(insertAccount: InsertInstagramAccount): Promise<InstagramAccount> {
    const [account] = await db
      .insert(instagramAccounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateAccount(id: string, updates: Partial<InstagramAccount>): Promise<InstagramAccount | undefined> {
    const [account] = await db
      .update(instagramAccounts)
      .set(updates)
      .where(eq(instagramAccounts.id, id))
      .returning();
    return account || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    // Delete associated flows (cascading)
    await db.delete(flows).where(eq(flows.accountId, id));

    const result = await db.delete(instagramAccounts).where(eq(instagramAccounts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Flows
  async getFlow(id: string): Promise<Flow | undefined> {
    const [flow] = await db.select().from(flows).where(eq(flows.id, id));
    return flow || undefined;
  }

  async getFlowsByAccount(accountId: string): Promise<Flow[]> {
    return await db.select().from(flows).where(eq(flows.accountId, accountId)).orderBy(desc(flows.updatedAt));
  }

  async getAllFlows(): Promise<Flow[]> {
    return await db.select().from(flows).orderBy(desc(flows.updatedAt));
  }

  async getActiveFlows(): Promise<Flow[]> {
    return await db.select().from(flows).where(eq(flows.isActive, true)).orderBy(desc(flows.updatedAt));
  }

  async createFlow(insertFlow: InsertFlow): Promise<Flow> {
    const [flow] = await db
      .insert(flows)
      .values(insertFlow)
      .returning();
    return flow;
  }

  async updateFlow(id: string, updates: UpdateFlow): Promise<Flow | undefined> {
    const [flow] = await db
      .update(flows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(flows.id, id))
      .returning();
    return flow || undefined;
  }

  async deleteFlow(id: string): Promise<boolean> {
    // Delete associated executions (cascading)
    await db.delete(flowExecutions).where(eq(flowExecutions.flowId, id));

    const result = await db.delete(flows).where(eq(flows.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Flow Executions
  async getExecution(id: string): Promise<FlowExecution | undefined> {
    const [execution] = await db.select().from(flowExecutions).where(eq(flowExecutions.id, id));
    return execution || undefined;
  }

  async getExecutionsByFlow(flowId: string): Promise<FlowExecution[]> {
    return await db.select().from(flowExecutions).where(eq(flowExecutions.flowId, flowId)).orderBy(desc(flowExecutions.createdAt));
  }

  async getExecutionsByAccount(accountId: string): Promise<FlowExecution[]> {
    return await db.select().from(flowExecutions).where(eq(flowExecutions.accountId, accountId)).orderBy(desc(flowExecutions.createdAt));
  }

  async getAllExecutions(): Promise<FlowExecution[]> {
    return await db.select().from(flowExecutions).orderBy(desc(flowExecutions.createdAt));
  }

  async getRecentExecutions(limit: number): Promise<FlowExecution[]> {
    return await db.select().from(flowExecutions).orderBy(desc(flowExecutions.createdAt)).limit(limit);
  }

  async createExecution(insertExecution: InsertFlowExecution): Promise<FlowExecution> {
    const [execution] = await db
      .insert(flowExecutions)
      .values(insertExecution)
      .returning();
    return execution;
  }

  async updateExecution(id: string, updates: Partial<FlowExecution>): Promise<FlowExecution | undefined> {
    const [execution] = await db
      .update(flowExecutions)
      .set(updates)
      .where(eq(flowExecutions.id, id))
      .returning();
    return execution || undefined;
  }

  // Webhook Events
  async getWebhookEvent(id: string): Promise<WebhookEvent | undefined> {
    const [event] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id));
    return event || undefined;
  }

  async getAllWebhookEvents(): Promise<WebhookEvent[]> {
    return await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt));
  }

  async getRecentWebhookEvents(limit: number): Promise<WebhookEvent[]> {
    return await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(limit);
  }

  async getUnprocessedWebhookEvents(): Promise<WebhookEvent[]> {
    return await db.select().from(webhookEvents).where(eq(webhookEvents.processed, false)).orderBy(webhookEvents.createdAt);
  }

  async createWebhookEvent(insertEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const [event] = await db
      .insert(webhookEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async markWebhookEventProcessed(id: string): Promise<boolean> {
    const [event] = await db
      .update(webhookEvents)
      .set({ processed: true })
      .where(eq(webhookEvents.id, id))
      .returning();
    return !!event;
  }

  // Flow Templates
  async getTemplate(id: string): Promise<FlowTemplate | undefined> {
    const [template] = await db.select().from(flowTemplates).where(eq(flowTemplates.id, id));
    return template || undefined;
  }

  async getAllTemplates(): Promise<FlowTemplate[]> {
    return await db.select().from(flowTemplates).where(eq(flowTemplates.isPublic, true)).orderBy(desc(flowTemplates.createdAt));
  }

  async getTemplatesByCategory(category: string): Promise<FlowTemplate[]> {
    return await db.select().from(flowTemplates).where(eq(flowTemplates.category, category)).orderBy(desc(flowTemplates.useCount));
  }

  async createTemplate(insertTemplate: InsertFlowTemplate): Promise<FlowTemplate> {
    const [template] = await db
      .insert(flowTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async incrementTemplateUseCount(id: string): Promise<boolean> {
    const template = await this.getTemplate(id);
    if (!template) return false;

    const newCount = (parseInt(template.useCount) + 1).toString();
    const [updated] = await db
      .update(flowTemplates)
      .set({ useCount: newCount })
      .where(eq(flowTemplates.id, id))
      .returning();
    return !!updated;
  }

  // Contacts
  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getContactsByAccount(accountId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.accountId, accountId)).orderBy(desc(contacts.createdAt));
  }

  async getAllContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(updates)
      .where(eq(contacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getContactByInstagramUserId(accountId: string, instagramUserId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(contacts.instagramUserId, instagramUserId)
        )
      );
    return contact || undefined;
  }

  async upsertContact(accountId: string, instagramUserId: string, username?: string): Promise<Contact> {
    const existingContact = await this.getContactByInstagramUserId(accountId, instagramUserId);

    if (existingContact) {
      if (username && existingContact.username !== username) {
        const updated = await this.updateContact(existingContact.id, { username });
        return updated!;
      }
      return existingContact;
    }

    return await this.createContact({
      accountId,
      instagramUserId,
      username: username || instagramUserId,
    });
  }

  // AI Agents
  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getAgentsByUser(userId: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.createdAt));
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db
      .insert(agents)
      .values(insertAgent)
      .returning();
    return agent;
  }

  async updateAgent(id: string, updates: UpdateAgent): Promise<Agent | undefined> {
    const [agent] = await db
      .update(agents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();
    return agent || undefined;
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Agent Templates
  async getAgentTemplate(id: string): Promise<AgentTemplate | undefined> {
    const [template] = await db.select().from(agentTemplates).where(eq(agentTemplates.id, id));
    return template || undefined;
  }

  async getAllAgentTemplates(): Promise<AgentTemplate[]> {
    return await db.select().from(agentTemplates).orderBy(desc(agentTemplates.createdAt));
  }

  async getAgentTemplatesByCategory(category: string): Promise<AgentTemplate[]> {
    return await db.select().from(agentTemplates)
      .where(eq(agentTemplates.category, category))
      .orderBy(desc(agentTemplates.createdAt));
  }

  async createAgentTemplate(insertTemplate: InsertAgentTemplate): Promise<AgentTemplate> {
    const [template] = await db
      .insert(agentTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async incrementAgentTemplateUseCount(id: string): Promise<boolean> {
    const template = await this.getAgentTemplate(id);
    if (!template) return false;

    const newCount = String(Number(template.useCount) + 1);
    await db
      .update(agentTemplates)
      .set({ useCount: newCount })
      .where(eq(agentTemplates.id, id));
    return true;
  }

  // Conversations
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByAgent(agentId: string): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.agentId, agentId)).orderBy(desc(conversations.updatedAt));
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Agent Memory
  async getMemory(id: string): Promise<AgentMemory | undefined> {
    const [memory] = await db.select().from(agentMemory).where(eq(agentMemory.id, id));
    return memory || undefined;
  }

  async getMemoryByAgent(agentId: string, limit: number = 50): Promise<AgentMemory[]> {
    return await db
      .select()
      .from(agentMemory)
      .where(eq(agentMemory.agentId, agentId))
      .orderBy(desc(agentMemory.createdAt))
      .limit(limit);
  }

  async createMemory(insertMemory: InsertAgentMemory): Promise<AgentMemory> {
    const [memory] = await db
      .insert(agentMemory)
      .values(insertMemory)
      .returning();
    return memory;
  }

  async deleteMemory(id: string): Promise<boolean> {
    const result = await db.delete(agentMemory).where(eq(agentMemory.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Active Agent Conversations (for flow-triggered agents)
  async getActiveAgentConversation(id: string): Promise<ActiveAgentConversation | undefined> {
    const [conversation] = await db.select().from(activeAgentConversations).where(eq(activeAgentConversations.id, id));
    return conversation || undefined;
  }

  async getActiveConversationByInstagramUser(instagramUserId: string, accountId: string): Promise<ActiveAgentConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(activeAgentConversations)
      .where(
        and(
          eq(activeAgentConversations.instagramUserId, instagramUserId),
          eq(activeAgentConversations.accountId, accountId),
          eq(activeAgentConversations.isActive, true)
        )
      )
      .orderBy(desc(activeAgentConversations.lastMessageAt));
    return conversation || undefined;
  }

  async getActiveConversationsByAgent(agentId: string): Promise<ActiveAgentConversation[]> {
    return await db
      .select()
      .from(activeAgentConversations)
      .where(
        and(
          eq(activeAgentConversations.agentId, agentId),
          eq(activeAgentConversations.isActive, true)
        )
      )
      .orderBy(desc(activeAgentConversations.lastMessageAt));
  }

  async createActiveAgentConversation(insertConversation: InsertActiveAgentConversation): Promise<ActiveAgentConversation> {
    const [conversation] = await db
      .insert(activeAgentConversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateActiveAgentConversation(id: string, updates: Partial<ActiveAgentConversation>): Promise<ActiveAgentConversation | undefined> {
    const [conversation] = await db
      .update(activeAgentConversations)
      .set({ ...updates, lastMessageAt: new Date() })
      .where(eq(activeAgentConversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async deactivateAgentConversation(id: string): Promise<boolean> {
    const result = await db
      .update(activeAgentConversations)
      .set({ isActive: false })
      .where(eq(activeAgentConversations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
