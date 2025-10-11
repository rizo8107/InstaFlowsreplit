import { 
  type InstagramAccount, 
  type InsertInstagramAccount,
  type Flow,
  type InsertFlow,
  type UpdateFlow,
  type FlowExecution,
  type InsertFlowExecution,
  type WebhookEvent,
  type InsertWebhookEvent
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private accounts: Map<string, InstagramAccount>;
  private flows: Map<string, Flow>;
  private executions: Map<string, FlowExecution>;
  private webhookEvents: Map<string, WebhookEvent>;

  constructor() {
    this.accounts = new Map();
    this.flows = new Map();
    this.executions = new Map();
    this.webhookEvents = new Map();
  }

  // Instagram Accounts
  async getAccount(id: string): Promise<InstagramAccount | undefined> {
    return this.accounts.get(id);
  }

  async getAccountByUserId(instagramUserId: string): Promise<InstagramAccount | undefined> {
    return Array.from(this.accounts.values()).find(
      (account) => account.instagramUserId === instagramUserId
    );
  }

  async getAllAccounts(): Promise<InstagramAccount[]> {
    return Array.from(this.accounts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createAccount(insertAccount: InsertInstagramAccount): Promise<InstagramAccount> {
    const id = randomUUID();
    const account: InstagramAccount = {
      id,
      username: insertAccount.username,
      instagramUserId: insertAccount.instagramUserId,
      accessToken: insertAccount.accessToken,
      profilePicture: insertAccount.profilePicture || null,
      isActive: insertAccount.isActive ?? true,
      createdAt: new Date(),
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: string, updates: Partial<InstagramAccount>): Promise<InstagramAccount | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updated = { ...account, ...updates };
    this.accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    // Delete associated flows
    const flows = await this.getFlowsByAccount(id);
    for (const flow of flows) {
      await this.deleteFlow(flow.id);
    }
    
    return this.accounts.delete(id);
  }

  // Flows
  async getFlow(id: string): Promise<Flow | undefined> {
    return this.flows.get(id);
  }

  async getFlowsByAccount(accountId: string): Promise<Flow[]> {
    return Array.from(this.flows.values())
      .filter(flow => flow.accountId === accountId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getAllFlows(): Promise<Flow[]> {
    return Array.from(this.flows.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getActiveFlows(): Promise<Flow[]> {
    return Array.from(this.flows.values())
      .filter(flow => flow.isActive)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createFlow(insertFlow: InsertFlow): Promise<Flow> {
    const id = randomUUID();
    const now = new Date();
    const flow: Flow = {
      id,
      accountId: insertFlow.accountId,
      name: insertFlow.name,
      description: insertFlow.description || null,
      isActive: insertFlow.isActive ?? false,
      nodes: insertFlow.nodes as any,
      edges: insertFlow.edges as any,
      createdAt: now,
      updatedAt: now,
    };
    this.flows.set(id, flow);
    return flow;
  }

  async updateFlow(id: string, updates: UpdateFlow): Promise<Flow | undefined> {
    const flow = this.flows.get(id);
    if (!flow) return undefined;
    
    const updated = { 
      ...flow, 
      ...updates,
      updatedAt: new Date(),
    };
    this.flows.set(id, updated);
    return updated;
  }

  async deleteFlow(id: string): Promise<boolean> {
    // Delete associated executions
    const executions = await this.getExecutionsByFlow(id);
    for (const execution of executions) {
      this.executions.delete(execution.id);
    }
    
    return this.flows.delete(id);
  }

  // Flow Executions
  async getExecution(id: string): Promise<FlowExecution | undefined> {
    return this.executions.get(id);
  }

  async getExecutionsByFlow(flowId: string): Promise<FlowExecution[]> {
    return Array.from(this.executions.values())
      .filter(exec => exec.flowId === flowId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getExecutionsByAccount(accountId: string): Promise<FlowExecution[]> {
    return Array.from(this.executions.values())
      .filter(exec => exec.accountId === accountId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllExecutions(): Promise<FlowExecution[]> {
    return Array.from(this.executions.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecentExecutions(limit: number): Promise<FlowExecution[]> {
    return Array.from(this.executions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createExecution(insertExecution: InsertFlowExecution): Promise<FlowExecution> {
    const id = randomUUID();
    const execution: FlowExecution = {
      id,
      flowId: insertExecution.flowId,
      accountId: insertExecution.accountId,
      triggerType: insertExecution.triggerType,
      triggerData: insertExecution.triggerData,
      status: insertExecution.status,
      executionPath: (insertExecution.executionPath as string[] | null) || null,
      errorMessage: insertExecution.errorMessage || null,
      createdAt: new Date(),
    };
    this.executions.set(id, execution);
    return execution;
  }

  async updateExecution(id: string, updates: Partial<FlowExecution>): Promise<FlowExecution | undefined> {
    const execution = this.executions.get(id);
    if (!execution) return undefined;
    
    const updated = { ...execution, ...updates };
    this.executions.set(id, updated);
    return updated;
  }

  // Webhook Events
  async getWebhookEvent(id: string): Promise<WebhookEvent | undefined> {
    return this.webhookEvents.get(id);
  }

  async getUnprocessedWebhookEvents(): Promise<WebhookEvent[]> {
    return Array.from(this.webhookEvents.values())
      .filter(event => !event.processed)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createWebhookEvent(insertEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const id = randomUUID();
    const event: WebhookEvent = {
      id,
      accountId: insertEvent.accountId || null,
      eventType: insertEvent.eventType,
      payload: insertEvent.payload,
      processed: insertEvent.processed ?? false,
      createdAt: new Date(),
    };
    this.webhookEvents.set(id, event);
    return event;
  }

  async markWebhookEventProcessed(id: string): Promise<boolean> {
    const event = this.webhookEvents.get(id);
    if (!event) return false;
    
    event.processed = true;
    this.webhookEvents.set(id, event);
    return true;
  }
}

export const storage = new MemStorage();
