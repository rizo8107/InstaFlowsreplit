# Instagram Automation Platform

## Overview
A comprehensive web-based Instagram automation platform designed to empower users with the ability to create sophisticated chat flow workflows for managing multiple Instagram accounts. The platform features a visual drag-and-drop interface builder for defining conditional logic and automated actions, aiming to streamline Instagram engagement and customer interaction for businesses and individuals.

## User Preferences
I prefer simple language and detailed explanations. I want iterative development with clear communication at each step. Ask before making major changes. Do not make changes to the folder `Z` or the file `Y`. I appreciate comprehensive documentation and well-structured code.

## System Architecture

### UI/UX
The platform features a clean, responsive design inspired by Instagram's aesthetic, utilizing a gradient color scheme (from #E4405F to #833AB4) and the Helvetica Neue font family. It incorporates Shadcn UI components with custom theming to ensure a consistent and modern user experience. Key pages include a Dashboard, Flows, Flow Builder, Templates, Accounts, and Activity.

### Technical Implementations
The application is a full-stack TypeScript project, with a React frontend utilizing ReactFlow for the visual drag-and-drop builder, TanStack Query for data fetching, and Tailwind CSS for styling. The backend is built with Express.js, handling API routes for account management, flow management, templates, execution tracking, and Instagram webhooks. Persistence is managed via PostgreSQL with Drizzle ORM.

### Feature Specifications
- **Visual Flow Builder**: Allows creation of complex automation workflows using custom Trigger, Condition, and Action nodes.
- **Multi-Account Support**: Manage and automate multiple Instagram accounts from a single dashboard.
- **Condition Logic**: Implement if/else branching with AND/OR operators based on various Instagram event data (e.g., message text, username, media type).
- **Action Types**: Supports automated actions such as replying to comments, sending direct messages (DMs), deleting/hiding comments, liking media, sending links, making API calls, and introducing delays. Includes advanced DM features like button templates.
- **Real-time Webhooks**: Processes Instagram events in real-time to trigger and execute flows.
- **Activity Logging**: Provides a comprehensive log of all flow executions, including status and details.
- **Variable System**: Enables dynamic messaging and actions through variable substitution (e.g., `{username}`, `{message_text}`).
- **Contact Management**: Automatically creates and updates contacts from webhook events, with full CRUD operations.
- **Flow Templates**: A library of pre-built automation templates to expedite workflow creation.
- **AI Agents with RAG**: Intelligent AI agents powered by Google Gemini that can send automated Instagram DMs, trigger flows, search knowledge bases, and manage conversations with built-in memory and tool-calling capabilities. Agents integrate seamlessly with Instagram automation flows for personalized customer interactions.

### System Design Choices
- **Flow Execution Engine**: A core service responsible for evaluating conditions, substituting variables, and executing actions sequentially based on defined flow paths.
- **Instagram API Integration**: A dedicated wrapper service for all interactions with the Instagram Graph API (v24.0), ensuring compliance and robust error handling.
- **Database Storage**: PostgreSQL with Drizzle ORM is used for persistent storage of all application data, including accounts, flows, templates, executions, webhook events, AI agents, conversations, and memory.
- **Modular Architecture**: Services are designed to be modular (e.g., `InstagramAPI`, `FlowEngine`, `DatabaseStorage`, `GeminiService`) for maintainability and scalability.
- **AI Agent System**: Gemini-powered agents with RAG (Retrieval-Augmented Generation) capabilities, tool calling for Instagram automation, conversation memory, and knowledge base search. Agents can execute flows, send DMs, access contacts, and provide intelligent, context-aware responses.

## External Dependencies

- **Instagram Graph API (v24.0)**: Core integration for all Instagram-related functionalities, including message sending, comment management, and media interaction.
- **Google Gemini API**: AI model provider for intelligent agent conversations, tool calling, and RAG capabilities (models: gemini-2.5-flash, gemini-2.5-pro).
- **PostgreSQL**: Relational database used for all persistent data storage.
- **ReactFlow**: Library for building the interactive node-based flow editor in the frontend.
- **Drizzle ORM**: TypeScript ORM for interacting with the PostgreSQL database.
- **Express.js**: Web application framework for the backend API.
- **React**: Frontend JavaScript library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Shadcn UI**: Reusable UI components used in the frontend.
- **TanStack Query**: Data-fetching library for React.
- **Wouter**: Small routing library for React.