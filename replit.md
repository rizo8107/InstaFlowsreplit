# Instagram Automation Platform

## Overview
This project is a comprehensive web-based Instagram automation platform designed to empower users with a visual drag-and-drop interface for creating sophisticated chat flow workflows. It enables seamless management of multiple Instagram accounts, automates interactions, and streamlines communication through a powerful visual builder. The platform's core purpose is to provide a user-friendly tool for businesses and individuals to enhance their Instagram presence and engagement through automated responses and actions.

## User Preferences
I am the user, and my preferences are as follows:
- I want concise explanations.
- I prefer to be asked before major changes are made to the codebase.
- I prefer an iterative development approach.
- I like functional programming paradigms.
- I prefer detailed explanations for complex features.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The platform features an intuitive interface with a visual drag-and-drop flow builder using ReactFlow. The design system incorporates Instagram branding with a gradient color scheme (#E4405F to #833AB4), clean grays, and status-indicating colors. Typography utilizes a Helvetica Neue font stack for an Instagram-like feel. Components are built with Shadcn UI and custom Instagram theming, featuring a sidebar navigation and a responsive canvas workspace. Interactions include hover elevations, smooth transitions, and drag-and-drop functionality.

### Technical Implementations
The application is a full-stack TypeScript project, utilizing an Express.js backend and a React frontend. React with Wouter handles routing, while TanStack Query manages data fetching. Tailwind CSS is used for styling. User authentication is managed by Passport.js with session management via `express-session`, supporting Instagram OAuth for account connection. Password hashing is done with scrypt.

### Feature Specifications
- **Visual Flow Builder**: Allows users to create automation workflows using custom node types (Trigger, Condition, Action) with a drag-and-drop interface.
- **Multi-Account Support**: Manages multiple Instagram accounts via Graph API tokens.
- **Condition Logic**: Supports complex if/else conditions with AND/OR operators, including various field options (message_text, comment_text, username, user_id, sender_id, comment_id, message_id, media_id).
- **Action Types**: Includes actions such as reply, direct message (DM), delete, hide, like, send links, make API calls, introduce delays, set variables, and stop flow execution. DM actions support Instagram Generic Templates with up to 3 buttons.
- **Real-time Webhooks**: Processes Instagram events (comments, DMs, mentions) in real-time to trigger flow executions.
- **Activity Logging**: Provides a dashboard for tracking all flow executions, including success/failure status and detailed error handling.
- **Variable System**: Enables dynamic message templates and data manipulation using custom variables within flows.
- **Contact Management**: Automatically creates and updates contacts from webhook events, preventing duplicates and linking contacts to Instagram accounts.
- **Flow Templates Library**: Offers pre-built automation templates with category filtering and search functionality.

### System Design Choices
- **Frontend Structure**: Organized into pages (Dashboard, Flows, Flow Builder, Templates, Accounts, Activity) and reusable components (custom flow nodes, configuration panels, node palette, sidebar).
- **Backend Structure**: API routes for accounts, flows, templates, executions, and Instagram webhooks. Core services include `InstagramAPI` (Graph API wrapper), `FlowEngine` (for execution logic), and `DatabaseStorage` (for persistence).
- **Flow Execution**: Asynchronous execution with condition evaluation (contains, equals, regex, not_contains, not_equals), variable substitution (e.g., `{username}`), sequential node execution, and robust error handling.
- **Data Models**: Key models include `InstagramAccount`, `Flow`, `FlowTemplate`, `FlowExecution`, `WebhookEvent`, and `Contact`.
- **Database**: PostgreSQL is used for persistence, integrated via Drizzle ORM. All data is tenant-isolated by the authenticated user.
- **Instagram Graph API v24.0 Compliance**: All API interactions are updated to comply with Instagram Graph API v24.0, using correct endpoints and request formats for DMs and comment actions.

## External Dependencies
- **Instagram Graph API**: Core integration for managing Instagram accounts, sending messages, and performing actions.
- **Facebook OAuth**: Used for one-click Instagram account connection and user authentication.
- **PostgreSQL**: Relational database for persistent storage.
- **ReactFlow**: Library for the visual drag-and-drop flow builder.
- **TanStack Query**: Data fetching and caching library.
- **Shadcn UI**: UI component library.
- **Passport.js**: Authentication middleware for Node.js.
- **Drizzle ORM**: TypeScript ORM for interacting with PostgreSQL.
- **Express.js**: Web application framework for the backend.
- **React**: Frontend JavaScript library.