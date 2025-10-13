# AI Agent Instagram Automation Guide

## Overview
AI Agents can now send automated Instagram DM conversations through the platform's flow system. Agents have access to powerful tools that integrate directly with your Instagram accounts and automation flows.

## Available Instagram Tools

### 1. **send_instagram_dm**
Send direct messages on Instagram to specific users.

**Parameters:**
- `accountId`: Your Instagram account ID (from your connected accounts)
- `recipientId`: The Instagram user ID of the recipient
- `message`: The message text to send

**Example Usage:**
```
Agent: "I'll send a welcome message to the new follower"
Tool Call: send_instagram_dm
- accountId: "abc123..."
- recipientId: "987654321"
- message: "Hi! Thanks for following us. How can I help you today?"
```

### 2. **execute_flow**
Trigger automated Instagram flows by name to start conversation sequences.

**Parameters:**
- `flowName`: Name of the flow to execute
- `testData`: Optional test data (username, message_text, instagram_user_id, etc.)

**Example Usage:**
```
Agent: "I'll trigger the welcome sequence for this user"
Tool Call: execute_flow
- flowName: "DM Welcome Sequence"
- testData: {
    "username": "john_doe",
    "message_text": "hello",
    "instagram_user_id": "123456789"
  }
```

### 3. **get_instagram_contacts**
Get list of Instagram contacts/users to find user IDs for messaging.

**Parameters:**
- `accountId`: Optional filter by specific account

**Example Usage:**
```
Agent: "Let me check who has interacted with your account"
Tool Call: get_instagram_contacts
- accountId: "abc123..." (optional)

Result: List of contacts with their usernames and Instagram user IDs
```

### 4. **search_knowledge_base**
Search the agent's knowledge base for relevant information.

**Example Usage:**
```
Agent searches for previous conversations, customer preferences, or learned information
```

### 5. **get_current_time**
Get current date and time for scheduling and time-based logic.

## How to Create an Instagram Automation Agent

### Step 1: Create a New Agent
1. Go to **AI Agents** page
2. Click **Create Agent**
3. Fill in the details:
   - **Name**: e.g., "Instagram Support Agent"
   - **Description**: e.g., "Handles customer inquiries via DM"
   - **Model**: Choose Gemini 2.5 Flash (fast) or Pro (advanced)
   - **System Prompt**: Define the agent's personality and role

### Step 2: Configure System Prompt
Example system prompt for Instagram automation:

```
You are an Instagram customer support agent for [Your Brand]. 

Your role:
- Respond to customer inquiries via Instagram DM
- Use a friendly, professional tone
- Help customers with product questions, orders, and support
- Trigger automation flows when needed

Guidelines:
- Always greet new customers warmly
- Use the get_instagram_contacts tool to find user information
- Use send_instagram_dm to send personalized messages
- Use execute_flow to trigger automated sequences like "Welcome Flow" or "Order Status Flow"
- Keep responses concise and helpful
- If you don't know something, be honest and offer to help in other ways

Available Instagram accounts:
- @your_brand_official (ID: abc123...)

Available Flows:
- "DM Welcome Sequence" - Welcome new followers
- "FAQ Auto-Responder" - Answer common questions
- "Order Status Check" - Help with order tracking
```

### Step 3: Enable Tools
Make sure to enable:
- ✅ **Enable Memory (RAG)** - Agent remembers conversations
- ✅ **Enable Tools** - Agent can use Instagram automation tools
- ✅ Select these tools:
  - `send_instagram_dm`
  - `execute_flow`
  - `get_instagram_contacts`
  - `search_knowledge_base`
  - `get_current_time`

### Step 4: Configure Settings
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 8192 (longer responses)

## Example Conversations

### Example 1: Welcome New Follower
```
User: "Someone just followed us, welcome them!"

Agent: "I'll welcome the new follower. Let me get their information first."
[Uses get_instagram_contacts]

Agent: "I'll send them a personalized welcome message."
[Uses send_instagram_dm]
Result: "Hi @newuser! Thanks for following us! 🎉 We're excited to have you..."
```

### Example 2: Trigger Automation Flow
```
User: "A customer asked about our products in DM"

Agent: "I'll trigger our product information flow for them."
[Uses execute_flow with "Product Info Flow"]

Result: "Flow executed successfully. The customer will receive our product catalog and pricing."
```

### Example 3: Handle Customer Inquiry
```
User: "Customer @john_doe is asking about order #12345"

Agent: "Let me help with that order inquiry."
[Uses search_knowledge_base to check order information]
[Uses send_instagram_dm to respond]

Result: "Sent DM to @john_doe: 'Hi John! Your order #12345 is on its way...'"
```

## Best Practices

### 1. **Message Formatting**
- Keep messages concise and friendly
- Use emojis sparingly and appropriately
- Personalize with usernames: "Hi @username!"
- Include clear calls-to-action

### 2. **Flow Integration**
- Use flows for multi-step conversations
- Let flows handle complex sequences
- Use agents for personalization and context

### 3. **Memory Management**
- Agents learn from conversations
- Review memory periodically
- Add important context manually if needed

### 4. **Tool Usage**
- Always get contacts before sending messages
- Verify account IDs are correct
- Test flows before agent triggers them
- Check tool results and handle errors gracefully

## Troubleshooting

### Agent Not Sending Messages
- ✅ Check Instagram account is connected
- ✅ Verify account ID is correct
- ✅ Ensure recipient ID is valid
- ✅ Check account has necessary permissions

### Flow Not Executing
- ✅ Verify flow name exactly matches
- ✅ Ensure flow is active
- ✅ Check flow has correct trigger type
- ✅ Provide required test data

### Tools Not Working
- ✅ Ensure "Enable Tools" is checked
- ✅ Verify tools are selected in agent config
- ✅ Check GEMINI_API_KEY is set
- ✅ Review error messages in chat

## Advanced Usage

### Combining Multiple Tools
Agents can chain tool calls for complex workflows:

1. **Get Contacts** → Find user information
2. **Search Knowledge** → Check previous interactions
3. **Send DM** → Send personalized message
4. **Execute Flow** → Trigger follow-up automation

### Scheduled Automation
Use `get_current_time` to implement time-based logic:
- Send good morning messages
- Follow up after specific time periods
- Schedule promotional messages

### Context-Aware Responses
Agents use memory to:
- Remember customer preferences
- Track conversation history
- Provide consistent support across sessions

## Integration with Existing Flows

AI Agents **complement** your existing Instagram automation flows:

- **Flows** handle structured, predictable sequences
- **Agents** handle dynamic, conversational responses
- **Together** they create intelligent, automated customer experiences

Example workflow:
1. Flow detects new DM (Trigger)
2. Flow checks for keywords (Condition)
3. If complex query → Agent handles personalized response
4. If simple → Flow sends pre-defined message
5. Agent can trigger additional flows as needed

---

## Quick Start Checklist

- [ ] Create AI Agent with Instagram-focused system prompt
- [ ] Enable Memory (RAG) and Tools
- [ ] Select Instagram automation tools
- [ ] Test agent in chat interface
- [ ] Verify agent can access Instagram accounts
- [ ] Test sending DMs through agent
- [ ] Test triggering flows through agent
- [ ] Review agent memory and learnings
- [ ] Monitor agent performance in Activity logs

Your AI Agent is now ready to handle automated Instagram conversations! 🚀
