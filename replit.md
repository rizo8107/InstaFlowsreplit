# Instagram Automation Platform

## Overview
A comprehensive web-based Instagram automation platform that enables users to create sophisticated chat flow workflows for managing multiple Instagram accounts through a visual drag-and-drop interface builder.

## Purpose
The platform connects multiple Instagram accounts via Graph API tokens and provides a visual flow builder with:
- Condition nodes (if/else logic with AND/OR operators)
- Action nodes (reply, message, delete, hide, like, send links, API calls, delays, set variables, stop flow)
- Variable support for dynamic messaging
- Real-time webhook processing
- Comprehensive activity logging
- Edge deletion for easy flow modification

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
- **Media-Specific Conditions & Display (October 13, 2025)**: Added media filtering and visual display
  - **Media Details Fetch**: Webhook handler now fetches full media details (caption, thumbnail, permalink, type)
  - **Reel Detection**: Automatically detects reels via permalink pattern (`/reel/`)
  - **New Condition Fields**: Added `media_caption` and `is_reel` condition fields for filtering
  - **Visual Media Display**: Activity page now shows media thumbnails and captions
    - Clickable thumbnails linking to Instagram permalink
    - Reel badge for video content
    - Caption display with truncation
    - Available in both executions and webhook events tabs
  - **API Enhancement**: Added `getMedia()` method to fetch media details via Instagram Graph API

- **Webhook Setup & Legal Pages (October 13, 2025)**: Enhanced setup guide and compliance
  - **Webhook Token**: Default verify token set to "zenthra" (configurable via environment)
  - **Terms & Privacy Pages**: Added complete legal documentation at `/terms` and `/privacy`
  - **Enhanced Setup Guide**: Accounts page now includes:
    - Copy-paste webhook URL and verify token
    - Step-by-step Meta for Developers setup instructions
    - Privacy policy and terms URLs for Meta app configuration
    - Direct links to required resources

- **Template System Enhanced (October 13, 2025)**: Expanded template library
  - **12 Professional Templates**: Up from 5 original templates
  - **New Templates Added**:
    - Lead Generation - Comment to DM
    - FAQ Auto-Responder
    - Giveaway Entry Manager
    - Customer Support Triage
    - Influencer Collaboration Response
    - Negative Comment Alert & Hide
    - Product Launch Hype Builder
  - **Fixed Template Creation**: Proper JSON parsing and dialog state reset

- **Auto-Contact Creation from Webhooks (October 12, 2025)**: Contacts now auto-save from webhook events
  - **Automatic Storage**: Webhook events automatically create/update contacts
    - Comment webhooks: Saves from_id (user ID) and from_username
    - DM webhooks: Saves sender_id (user ID)
    - Mention/Story webhooks: Saves from_id and from_username
  - **Duplicate Prevention**: Upsert logic prevents duplicate contacts
    - Checks accountId + instagramUserId combination
    - Updates username if it changes
  - **Storage Methods**: Added getContactByInstagramUserId and upsertContact to storage layer

- **Contacts Management & Enhanced Node Palette (October 12, 2025)**: Added contacts page and improved node palette
  - **Contacts Page**: New page to store Instagram user contacts
    - Store user ID and username for each contact
    - Filter contacts by Instagram account
    - Full CRUD operations (create, read, update, delete)
    - Linked to Instagram accounts for organization
  - **Enhanced Node Palette**: Improved usability with organized sections
    - "Basic Nodes" section with descriptions (Trigger, If/Else, Action)
    - "Quick Actions" section for commonly used pre-configured nodes
    - Time Delay, Send DM, and Reply Comment as one-click additions
    - Visual icons and color coding for better recognition
  - **Edge Deletion Improved**: Delete button now always visible on edges (better UX)

- **Additional Node Types & Edge Deletion (October 12, 2025)**: Enhanced flow builder with new capabilities
  - **Edge Deletion**: Added ability to delete connections between nodes
    - Custom edge component with hover-to-reveal delete button (X icon)
    - Keyboard deletion support (Delete key)
    - Edges are now focusable and updatable for better UX
    - Uses smooth step path style for consistent visual appearance
  - **New Action Types**:
    - **Set Variable**: Store custom values in variables for use in subsequent nodes
      - Configure variable name and value (supports variable substitution)
      - Variables accessible in all downstream nodes
    - **Stop Flow**: Immediately halt flow execution
      - No further nodes processed after stop_flow action
      - Useful for conditional early termination
  - **Node Deletion**: All nodes now have hover-to-reveal delete buttons with red destructive styling

- **Comment Flow DM Actions Fixed (October 12, 2025)**: Fixed DM actions for comment-triggered flows
  - **sender_id Mapping**: Comment events map `from_id` to `sender_id` for send_dm actions
  - **Unified DM Approach**: All DM actions use `sender_id` with Instagram Graph API (no Private Reply complexity)
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
- **Comment Actions**: 
  - **Reply to Comment**: Uses `POST /{comment_id}/replies` with `{message: "..."}` to reply publicly on Instagram
  - **Send DM from Comment**: Uses `sender_id` (mapped from `from_id`) with endpoint `POST /{instagram_user_id}/messages` and body `{recipient: {id: sender_id}, message: {text: "..."}}`
- **DM Actions**: Uses `POST /{instagram_user_id}/messages` with `{recipient: {id: sender_id}, message: {text: "..."}}`. Supports button templates.
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
