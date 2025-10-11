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
  instagramAccounts,
  flows,
  flowExecutions,
  webhookEvents
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Instagram Accounts
  getAccount(id: string): Promise<InstagramAccount | undefined>;
  getAccountByUserId(instagramUserId: string): Promise<InstagramAccount | undefined>;
  getAllAccounts(): Promise<InstagramAccount[]>;
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
  getUnprocessedWebhookEvents(): Promise<WebhookEvent[]>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  markWebhookEventProcessed(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
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
}

export const storage = new DatabaseStorage();
