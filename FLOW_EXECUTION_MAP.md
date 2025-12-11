# Instagram Automation Flow Execution Map

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER POSTS COMMENT ON INSTAGRAM              │
│                    "I love this product!"                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         INSTAGRAM SENDS WEBHOOK TO YOUR SERVER                  │
│         POST /api/webhooks/instagram                            │
│                                                                 │
│   payload: {                                                    │
│     object: "instagram",                                        │
│     entry: [{                                                   │
│       id: "123456789",  ← Instagram User ID                     │
│       changes: [{                                               │
│         field: "comments",                                      │
│         value: {                                                │
│           id: "789",                                            │
│           text: "I love this product!",                         │
│           from: { id: "999", username: "customer1" }            │
│         }                                                       │
│       }]                                                        │
│     }]                                                          │
│   }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   STEP 1: FIND INSTAGRAM ACCOUNT IN DATABASE                   │
│                                                                 │
│   const account = await storage.getAccountByUserId("123456789") │
│                                                                 │
│   ┌───────────────────────────────────────────┐                │
│   │ instagram_accounts TABLE:                 │                │
│   │ ──────────────────────────────────────── │                │
│   │ id: "abc-123"                             │                │
│   │ userId: "user-xyz"                        │                │
│   │ username: "mybrand"                       │                │
│   │ instagramUserId: "123456789" ← MUST MATCH │                │
│   │ accessToken: "IGQVJXa..."                 │                │
│   │ isActive: true ← MUST BE TRUE             │                │
│   └───────────────────────────────────────────┘                │
│                                                                 │
│   ⚠️  IF NOT FOUND → Auto-update first active account          │
│                    → Or create webhook event as "unknown"       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   STEP 2: SAVE WEBHOOK EVENT TO DATABASE                       │
│                                                                 │
│   await storage.createWebhookEvent({                            │
│     accountId: "abc-123",                                       │
│     eventType: "comment_received",                              │
│     payload: { ... },                                           │
│     processed: false                                            │
│   })                                                            │
│                                                                 │
│   ┌───────────────────────────────────────────┐                │
│   │ webhook_events TABLE:                     │                │
│   │ ──────────────────────────────────────── │                │
│   │ id: "evt-456"                             │                │
│   │ accountId: "abc-123"                      │                │
│   │ eventType: "comment_received"             │                │
│   │ processed: false                          │                │
│   │ createdAt: 2025-12-11                     │                │
│   └───────────────────────────────────────────┘                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   STEP 3: FIND MATCHING FLOWS                                  │
│                                                                 │
│   const flows = await storage.getActiveFlows()                 │
│                                                                 │
│   Filters applied:                                              │
│   ✅ flow.accountId === "abc-123"                               │
│   ✅ flow.isActive === true                                     │
│   ✅ flow has trigger node with triggerType = "comment_received"│
│   ✅ (optional) media filter matches if enabled                 │
│                                                                 │
│   ┌───────────────────────────────────────────┐                │
│   │ flows TABLE:                              │                │
│   │ ──────────────────────────────────────── │                │
│   │ id: "flow-789"                            │                │
│   │ accountId: "abc-123" ← MUST MATCH         │                │
│   │ name: "Auto-Reply Comments"               │                │
│   │ isActive: true ← MUST BE TRUE             │                │
│   │ nodes: [                                  │                │
│   │   {                                       │                │
│   │     type: "trigger",                      │                │
│   │     data: {                               │                │
│   │       triggerType: "comment_received" ←   │                │
│   │     }                                     │                │
│   │   },                                      │                │
│   │   { type: "action", ... }                 │                │
│   │ ]                                         │                │
│   └───────────────────────────────────────────┘                │
│                                                                 │
│   Result: matchingFlows = [flow-789]                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   STEP 4: CREATE EXECUTION RECORD (FOR EACH MATCHING FLOW)     │
│                                                                 │
│   const execution = await storage.createExecution({             │
│     flowId: "flow-789",                                         │
│     accountId: "abc-123",                                       │
│     triggerType: "comment_received",                            │
│     triggerData: { comment_text: "I love this product!" },      │
│     status: "running",                                          │
│     executionPath: [],                                          │
│     errorMessage: null                                          │
│   })                                                            │
│                                                                 │
│   ┌───────────────────────────────────────────┐                │
│   │ flow_executions TABLE:                    │                │
│   │ ──────────────────────────────────────── │                │
│   │ id: "exec-999"                            │                │
│   │ flowId: "flow-789" ← Links to flow        │                │
│   │ accountId: "abc-123"                      │                │
│   │ triggerType: "comment_received"           │                │
│   │ status: "running"                         │                │
│   │ createdAt: 2025-12-11                     │                │
│   └───────────────────────────────────────────┘                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   STEP 5: EXECUTE FLOW WITH FLOW ENGINE                        │
│                                                                 │
│   const api = new InstagramAPI(account.accessToken)            │
│   const engine = new FlowEngine(api, flow, triggerData)        │
│   const result = await engine.execute()                        │
│                                                                 │
│   Flow execution steps:                                         │
│   1. Find trigger node                                          │
│   2. Extract variables ({{comment_text}}, {{from_username}})   │
│   3. Execute next node (condition or action)                    │
│   4. Evaluate conditions if present                             │
│   5. Execute actions (reply, like, hide, etc.)                  │
│   6. Follow edges to next nodes                                 │
│   7. Continue until no more nodes                               │
│                                                                 │
│   Example flow:                                                 │
│   [Trigger: comment_received]                                   │
│          │                                                      │
│          ▼                                                      │
│   [Condition: comment_text contains "love"]                     │
│      │                        │                                 │
│     YES                      NO                                 │
│      │                        │                                 │
│      ▼                        ▼                                 │
│   [Reply: "Thank you!"]  [Like comment]                         │
│                                                                 │
│   Result: {                                                     │
│     success: true,                                              │
│     executionPath: ["trigger-1", "condition-2", "action-3"],    │
│     nodeResults: [ ... ]                                        │
│   }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   STEP 6: UPDATE EXECUTION RECORD WITH RESULTS                 │
│                                                                 │
│   await storage.updateExecution(execution.id, {                 │
│     status: "success",  // or "failed"                          │
│     executionPath: ["trigger-1", "condition-2", "action-3"],    │
│     nodeResults: [ ... ],                                       │
│     errorMessage: null                                          │
│   })                                                            │
│                                                                 │
│   ┌───────────────────────────────────────────┐                │
│   │ flow_executions TABLE (UPDATED):          │                │
│   │ ──────────────────────────────────────── │                │
│   │ id: "exec-999"                            │                │
│   │ flowId: "flow-789"                        │                │
│   │ status: "success" ← UPDATED               │                │
│   │ executionPath: [...] ← UPDATED            │                │
│   │ nodeResults: {...} ← UPDATED              │                │
│   └───────────────────────────────────────────┘                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   STEP 7: MARK WEBHOOK AS PROCESSED                            │
│                                                                 │
│   await storage.markWebhookEventProcessed(webhookEvent.id)     │
│                                                                 │
│   ┌───────────────────────────────────────────┐                │
│   │ webhook_events TABLE (UPDATED):           │                │
│   │ ──────────────────────────────────────── │                │
│   │ id: "evt-456"                             │                │
│   │ processed: true ← UPDATED                 │                │
│   └───────────────────────────────────────────┘                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│   RESULT: USER SEES IN ACTIVITY PAGE                           │
│                                                                 │
│   Execution shows:                                              │
│   ✅ Flow name: "Auto-Reply Comments"                           │
│   ✅ Status: Success                                            │
│   ✅ Trigger: Comment received                                  │
│   ✅ Execution path: trigger → condition → action               │
│   ✅ Timestamp: 2025-12-11 16:50                                │
│                                                                 │
│   Instagram action performed:                                   │
│   💬 Reply posted: "Thank you! We're glad you love it! ❤️"      │
└─────────────────────────────────────────────────────────────────┘
```

## Common Failure Points

### ❌ FAILURE POINT 1: Account Not Found
```
Webhook payload Instagram User ID: "123456789"
Database account instagram_user_id: "987654321" (MISMATCH!)

FIX: Update database to match webhook ID
```

### ❌ FAILURE POINT 2: No Matching Flows
```
Account found: ✅
Active flows exist: ✅
But filter fails because:
  - flow.accountId !== webhook account
  - flow.isActive === false
  - trigger type doesn't match
  - media filter doesn't match

FIX: Ensure flow is ACTIVE and trigger type matches
```

### ❌ FAILURE POINT 3: Execution Created But Fails
```
Execution record created: ✅
Flow engine runs: ✅
But execution fails due to:
  - Invalid access token
  - API rate limit
  - Missing permissions
  - Network error

CHECK: Activity page shows execution with error message
```

## Data Flow Summary

```
Instagram Event
      ↓
Webhook Payload (instagramUserId)
      ↓
Match Account (instagram_accounts.instagramUserId)
      ↓
Save Webhook Event (webhook_events)
      ↓
Find Active Flows (flows WHERE isActive = true)
      ↓
Create Execution (flow_executions)
      ↓
Run Flow Engine (evaluate conditions → execute actions)
      ↓
Update Execution (status, results)
      ↓
Mark Webhook Processed
      ↓
Display in Activity Page
```

## Database Relationships

```
users
  └─ instagram_accounts (userId → users.id)
       └─ flows (accountId → instagram_accounts.id)
       │    └─ flow_executions (flowId → flows.id)
       │
       └─ webhook_events (accountId → instagram_accounts.id)
       └─ contacts (accountId → instagram_accounts.id)
```

## Critical Fields to Verify

1. **instagram_accounts table:**
   - `instagramUserId` must match webhook payload `entry[].id`
   - `isActive` must be `true`
   - `accessToken` must be valid

2. **flows table:**
   - `accountId` must match the account receiving webhook
   - `isActive` must be `true`
   - Must have trigger node with correct `triggerType`

3. **flow_executions table:**
   - `flowId` links back to flows.id
   - `accountId` should match
   - `status` shows success/failed/running

## Why Activity Might Be Empty

**Scenario 1:** Webhook never reaches server
- Check Meta webhook dashboard for delivery status
- Verify callback URL is correct
- Check server is accessible from internet

**Scenario 2:** Webhook reaches server but no account match
- Instagram User ID mismatch
- Check webhook_events table for unknown events

**Scenario 3:** Account matches but no flows trigger
- No flows exist
- Flows exist but isActive = false
- Trigger type doesn't match webhook event

**Scenario 4:** Flow triggers but execution fails
- Check flow_executions table
- Look at errorMessage field
- Check Activity page for error details

**Scenario 5:** Everything works but not visible in UI
- Frontend filtering by account
- Verify logged-in user owns the accounts
- Check API endpoints return data
