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
  - `/api/executions` - Flow execution tracking
  - `/api/webhooks/instagram` - Instagram webhook receiver
  
- **Core Services**:
  - **InstagramAPI**: Wrapper for Instagram Graph API calls
  - **FlowEngine**: Executes flows with condition evaluation and action execution
  - **MemStorage**: In-memory data persistence

- **Flow Execution**:
  - Condition evaluation with contains, equals, regex, not_contains, not_equals
  - Variable substitution ({username}, {message_text}, etc.)
  - Sequential node execution following edges
  - Error handling and execution path tracking

### Data Models
- **InstagramAccount**: Connected Instagram accounts with access tokens
- **Flow**: Automation workflows with nodes and edges
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
1. Connect Instagram account with Graph API token
2. Create a new flow with trigger type (comment, DM, mention, story reply)
3. Add condition nodes to filter events
4. Add action nodes to respond or perform operations
5. Connect nodes to define workflow logic
6. Activate flow to start automation
7. Monitor executions in activity log

## Technical Notes
- Uses in-memory storage (MemStorage) for development
- Instagram API calls require valid access tokens
- Webhooks need to be configured in Meta for Developers console
- Flow execution is asynchronous with error handling
- All dates stored as JavaScript Date objects
- Node types: trigger, condition, action with type-specific data

## Future Enhancements
- Flow templates library
- Flow testing mode (dry run)
- Analytics dashboard
- Flow versioning
- Advanced scheduling
- Multi-language support
- Team collaboration features
