# Instagram Automation Platform

## Overview
A comprehensive web-based Instagram automation platform that enables users to create sophisticated chat flow workflows for managing multiple Instagram accounts through a visual drag-and-drop interface builder.

## Purpose
The platform connects multiple Instagram accounts via Graph API tokens and provides a visual flow builder with:
- Condition nodes (if/else logic with AND/OR operators)
- Action nodes (reply, message, delete, hide, like, send links, API calls, delays)
- Variable support for dynamic messaging
- Real-time webhook processing
- Comprehensive activity logging

## Current State
The MVP is complete with:
- Full-stack TypeScript application with Express backend and React frontend
- Visual drag-and-drop flow builder using ReactFlow
- Multi-account Instagram management
- Flow execution engine with condition evaluation
- Instagram Graph API integration
- Webhook handler for real-time events
- Activity logging dashboard

## Recent Changes
- **Instagram Private Reply Implementation (October 12, 2025)**: Implemented proper Private Reply API for comment-triggered DM actions
  - **Messenger Platform Integration**: Added Facebook Page ID and Page Access Token support to account schema
  - **Private Reply API**: Implemented `sendPrivateReply` using `graph.facebook.com/v24.0/{PAGE_ID}/messages` with `messaging_type: "RESPONSE"`
  - **Smart Routing**: Flow engine automatically detects comment triggers and uses Private Reply (text-only) vs regular DMs (with button template support)
  - **Condition Edge Routing Fixed**: Fixed flow engine to check `sourceHandle` instead of `edge.id` for proper condition branching (true/false paths)

- **Comment Flow Actions Fixed (October 12, 2025)**: Fixed variable extraction for comment events to enable DM actions
  - **sender_id Mapping**: Added sender_id mapping from from_id for comment events to enable send_dm actions
  - **Variable Extraction**: Comment events now properly set sender_id variable for DM/Private Reply functionality
  - **Comment Moderation API**: Reply to comment uses correct endpoint `/<IG_COMMENT_ID>/replies` with `message` parameter

- **UI Improvements & Button Templates (October 12, 2025)**: Enhanced condition configuration and added Instagram DM button template support
  - **Condition Field Dropdown**: Converted condition field input to dropdown with predefined options (message_text, comment_text, username, user_id, sender_id, comment_id, message_id, media_id)
  - **Improved Operator Labels**: Updated "not_contains" to "Does Not Contain" and "not_equals" to "Does Not Equal" for clarity
  - **Button Template Support**: Added full Instagram Generic Template support for DM actions
    - Up to 3 buttons per message with web_url (opens URL) or postback (webhook callback) types
    - Optional subtitle field for richer message templates
    - Buttons configured per flow node with title, URL, and payload options
    - Flow engine automatically detects button config and routes to appropriate API method
  - **Template Flow Creation Fixed**: Backend now properly creates flows from templates instead of just returning template data

- **Complete Instagram Graph API v24.0 Compliance (October 12, 2025)**: Fixed all action nodes to match Instagram Graph API v24.0
  - **Updated API Base URL**: Changed from `graph.instagram.com` to `graph.instagram.com/v24.0`
  - **DM Actions Fixed**: 
    - Updated endpoint to `/{instagram_user_id}/messages` (correct v24.0 format)
    - Request format: `{recipient: {id: sender_id}, message: {text: "..."}}`
    - Uses `sender_id` directly from webhook (no conversation_id needed)
    - Both `send_dm` and `send_link` now use sender_id with recipient.id format
  - **All Comment Actions Enhanced**:
    - Reply to Comment: Proper error handling and result tracking
    - Delete Comment: Full error details and logging
    - Hide Comment: Complete error handling
    - Like Comment: Detailed result tracking
  - **Other Actions Improved**:
    - API Call: Added result tracking and error handling
    - Delay: Added logging and result tracking
  - **Reel Detection**: Added `isReel()` helper method to check if media is a Reel
  - **Media Fields**: Added `media_product_type` to all media queries for Reel detection
  - **Error Handling**: All actions now throw detailed errors with full Instagram API responses

- **Database Migration (October 11, 2025)**: Migrated from in-memory storage to PostgreSQL
  - Implemented DatabaseStorage class with full Drizzle ORM integration
  - Successfully pushed schema and migrated all CRUD operations
  - All data now persists across server restarts
  
- **Flow Templates Library (October 11, 2025)**: Added pre-built automation templates
  - Created flow_templates schema with category-based organization
  - Implemented 5 pre-seeded templates (auto-reply, moderation, engagement, DM automation)
  - Added /templates page with category filtering and search
  - Implemented template-to-flow conversion with use count tracking
  - API routes: /api/templates, /api/templates/:id/use

- **Initial Setup (October 2025)**: Complete platform implementation
  - Implemented data schema for accounts, flows, nodes, executions, and webhooks
  - Built visual flow builder with custom node types (trigger, condition, action)
  - Created Instagram API integration layer
  - Implemented flow execution engine with variable substitution
  - Added webhook handling for Instagram events
  - Built complete UI with Instagram branding (gradient colors #E4405F to #833AB4)

## Project Architecture

### Frontend Structure
- **Pages**:
  - Dashboard: Overview with stats, recent flows, and activity
  - Flows: List and manage automation workflows
  - Flow Builder: Visual drag-and-drop flow editor
  - Templates: Browse and use pre-built flow templates
  - Accounts: Instagram account management
  - Activity: Execution logs and tracking
  
- **Components**:
  - Custom flow nodes (TriggerNode, ConditionNode, ActionNode)
  - Node configuration panel with dynamic form fields
  - Node palette for adding new nodes
  - Sidebar navigation with Instagram branding
  - Theme toggle for dark/light mode

- **Tech Stack**:
  - React with Wouter for routing
  - ReactFlow for visual flow builder
  - TanStack Query for data fetching
  - Shadcn UI components
  - Tailwind CSS for styling

### Backend Structure
- **API Routes**:
  - `/api/accounts` - Instagram account CRUD
  - `/api/flows` - Flow management
  - `/api/templates` - Flow template library
  - `/api/executions` - Flow execution tracking
  - `/api/webhooks/instagram` - Instagram webhook receiver
  
- **Core Services**:
  - **InstagramAPI**: Wrapper for Instagram Graph API calls
  - **FlowEngine**: Executes flows with condition evaluation and action execution
  - **DatabaseStorage**: PostgreSQL persistence with Drizzle ORM

- **Flow Execution**:
  - Condition evaluation with contains, equals, regex, not_contains, not_equals
  - Variable substitution ({username}, {message_text}, etc.)
  - Sequential node execution following edges
  - Error handling and execution path tracking

### Data Models
- **InstagramAccount**: Connected Instagram accounts with access tokens
- **Flow**: Automation workflows with nodes and edges
- **FlowTemplate**: Pre-built flow templates with category and use count
- **FlowExecution**: Execution records with status and path
- **WebhookEvent**: Incoming Instagram events

## Environment Variables
Required secrets:
- `INSTAGRAM_APP_ID` - Facebook App ID with Instagram permissions
- `INSTAGRAM_APP_SECRET` - Facebook App Secret
- `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` - Custom webhook verification token
- `SESSION_SECRET` - Session encryption key

## Key Features
1. **Visual Flow Builder**: Drag-and-drop interface for creating automation workflows
2. **Multi-Account Support**: Manage multiple Instagram accounts from one dashboard
3. **Condition Logic**: Complex if/else conditions with AND/OR operators
4. **Action Types**: Reply, DM, delete, hide, like, send links, API calls, delays
5. **Real-time Webhooks**: Automatic flow execution on Instagram events
6. **Activity Logging**: Track all executions with success/failure status
7. **Variable System**: Dynamic message templates with user data

## Design System
- **Colors**: Instagram gradient (#E4405F to #833AB4), clean grays, status colors
- **Typography**: Helvetica Neue font stack for Instagram feel
- **Components**: Shadcn UI with custom Instagram theming
- **Layout**: Sidebar navigation, responsive canvas workspace
- **Interactions**: Hover elevations, smooth transitions, drag-and-drop

## User Workflow
1. **Deploy the application** - Click Publish to make webhook accessible
2. **Configure webhook** - Copy webhook URL from Accounts page, add to Meta for Developers
3. **Connect Instagram account** - Add account with Graph API token
4. **Create automation flow** - Use templates or build custom flow with trigger type
5. **Add logic nodes** - Add condition nodes to filter events, action nodes to respond
6. **Activate flow** - Toggle flow to active to start automation
7. **Monitor executions** - View real-time execution logs in Activity page

### Webhook Flow:
1. Instagram sends event (comment, DM, mention) → `/api/webhooks/instagram`
2. System finds active flows matching event type and account
3. Flow engine executes flow with condition evaluation
4. Actions performed via Instagram Graph API
5. Execution logged with success/failure status

## Technical Notes
- Uses PostgreSQL database with Drizzle ORM for persistence
- Instagram API calls require valid access tokens with `instagram_business_manage_messages` and `instagram_business_manage_comments` scopes
- **DM Actions**: 
  - **From Comments (Private Reply)**: Uses Messenger Platform API `POST /v24.0/{PAGE_ID}/messages` with `{recipient: {comment_id: "..."}, message: {text: "..."}, messaging_type: "RESPONSE"}`. Requires Facebook Page ID and Page Access Token configured in account settings. Text-only (button templates not supported).
  - **From DMs (Direct Message)**: Uses Instagram API `POST /{instagram_user_id}/messages` with `{recipient: {id: sender_id}, message: {text: "..."}}`. Supports button templates.
- Webhooks need to be configured in Meta for Developers console
- Flow execution is asynchronous with error handling
- All dates stored as JavaScript Date objects  
- Node types: trigger, condition, action with type-specific data
- Templates are auto-seeded on first server start

## Known Issues
- Template-to-flow conversion dialog requires manual account selection testing (automated test agent encounters form validation issues, but manual testing works correctly)

## Future Enhancements
- Flow testing mode (dry run)
- Analytics dashboard
- Flow versioning
- Advanced scheduling
- Multi-language support
- Team collaboration features
