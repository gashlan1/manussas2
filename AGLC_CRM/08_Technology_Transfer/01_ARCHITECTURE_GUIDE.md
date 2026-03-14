# AGLC CRM: System Architecture Guide

**Document Type:** Technology Transfer  
**Version:** 2.0  
**Date:** March 15, 2026  
**Classification:** Confidential

---

## 1. System Overview

The AGLC CRM is a full-stack, bilingual (Arabic/English) Customer Relationship Management system purpose-built for Alahmari and Gashlan Law Co. It is designed around a multi-tenant architecture that supports multiple companies under a single deployment, with company-specific module configurations and role-based access control.

The system is built on a modern TypeScript-first stack with end-to-end type safety, real-time data synchronization, and integrated AI capabilities powered by large language models. The architecture follows a monorepo pattern where the client and server share types through tRPC, eliminating the need for manual API contract maintenance.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 19.2 | Component-based UI with hooks |
| Styling | Tailwind CSS | 4.1 | Utility-first CSS with 5 custom themes |
| UI Components | shadcn/ui + Radix | Latest | Accessible, composable components |
| State Management | TanStack Query | 5.90 | Server state with cache invalidation |
| Routing | Wouter | 3.3 | Lightweight client-side routing |
| API Layer | tRPC | 11.6 | End-to-end typesafe RPC |
| Server Runtime | Express | 4.21 | HTTP server with middleware |
| Database ORM | Drizzle ORM | 0.44 | Type-safe SQL query builder |
| Database | MySQL/TiDB | 8.0+ | Relational data storage |
| Authentication | Manus OAuth + JWT | - | Session-based auth with JWT tokens |
| File Storage | AWS S3 | - | Object storage for documents |
| AI/LLM | OpenAI-compatible API | - | 7 specialized AI agents |
| Language | TypeScript | 5.9 | Full-stack type safety |
| Build Tool | Vite | 7.1 | Fast dev server and production builds |
| Testing | Vitest | 2.1 | Unit and integration testing |
| Package Manager | pnpm | 10.4 | Fast, disk-efficient package management |

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Dashboard │ │ Pipeline │ │  Cases   │ │   AI Agents      │  │
│  │   Page   │ │   Page   │ │   Page   │ │   (7 Agents)     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │             │            │                 │            │
│  ┌────┴─────────────┴────────────┴─────────────────┴────────┐  │
│  │              tRPC Client (TanStack Query)                 │  │
│  │         useQuery / useMutation / invalidate               │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │ HTTP POST /api/trpc/*                 │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                    SERVER (Express 4)                            │
│  ┌──────────────────────┴────────────────────────────────────┐  │
│  │                   tRPC Router (11 routers)                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │  │
│  │  │ pipeline │ │proposals │ │ billing  │ │  aiAgents   │   │  │
│  │  │  router  │ │  router  │ │  router  │ │   router    │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │  │
│  │  │  cases   │ │  tasks   │ │ clients  │ │   audit     │   │  │
│  │  │  router  │ │  router  │ │  router  │ │   router    │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │  │
│  │  │   team   │ │notificat.│ │dashboard │                   │  │
│  │  │  router  │ │  router  │ │  router  │                   │  │
│  │  └──────────┘ └──────────┘ └──────────┘                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────┴────────────────────────────────────┐  │
│  │                   Database Layer (Drizzle ORM)             │  │
│  │                   db.ts (493 lines, 40+ helpers)           │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────┐  ┌────────┴──────┐  ┌──────────────────────────┐ │
│  │ LLM API  │  │  MySQL/TiDB   │  │     AWS S3 Storage       │ │
│  │ (7 agents│  │  (25+ tables) │  │  (Documents, Files)      │ │
│  └──────────┘  └───────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```
aglc-crm/
├── client/                          # Frontend application
│   ├── index.html                   # HTML entry with Google Fonts (Arabic + English)
│   ├── public/                      # Static assets (favicon, robots.txt)
│   └── src/
│       ├── App.tsx                  # Route definitions (13 routes)
│       ├── main.tsx                 # React root with providers
│       ├── index.css                # Design system (590 lines, 5 themes)
│       ├── const.ts                 # OAuth login URL helper
│       ├── lib/
│       │   ├── trpc.ts              # tRPC client binding
│       │   └── utils.ts             # Tailwind merge utility
│       ├── contexts/
│       │   ├── CrmThemeContext.tsx   # 5-theme switching context
│       │   ├── LanguageContext.tsx   # Arabic/English RTL/LTR context
│       │   └── ThemeContext.tsx      # Base dark/light theme provider
│       ├── components/
│       │   ├── DashboardLayout.tsx   # Main layout with sidebar (364 lines)
│       │   ├── AIChatBox.tsx         # Reusable AI chat component
│       │   ├── Map.tsx               # Google Maps integration
│       │   └── ui/                   # 50+ shadcn/ui components
│       ├── pages/
│       │   ├── Dashboard.tsx         # Executive dashboard (251 lines)
│       │   ├── Pipeline.tsx          # Kanban pipeline board (249 lines)
│       │   ├── Cases.tsx             # Case management (249 lines)
│       │   ├── Tasks.tsx             # Task board (192 lines)
│       │   ├── FeeProposals.tsx      # Fee proposals (264 lines)
│       │   ├── Billing.tsx           # Timesheets + invoices (324 lines)
│       │   ├── Clients.tsx           # Client directory (213 lines)
│       │   ├── Team.tsx              # Team management (121 lines)
│       │   ├── Notifications.tsx     # Notification center (100 lines)
│       │   ├── Reports.tsx           # Analytics reports (135 lines)
│       │   ├── AIAgents.tsx          # 7 AI agents interface (469 lines)
│       │   ├── AuditAgent.tsx        # Audit agent chat (318 lines)
│       │   └── Settings.tsx          # Theme/language/company settings (418 lines)
│       └── hooks/                    # Custom React hooks
├── server/
│   ├── _core/                       # Framework plumbing (DO NOT MODIFY)
│   │   ├── index.ts                 # Express server entry
│   │   ├── trpc.ts                  # tRPC initialization
│   │   ├── context.ts               # Request context builder
│   │   ├── llm.ts                   # LLM invocation helper (332 lines)
│   │   ├── oauth.ts                 # Manus OAuth handler
│   │   ├── env.ts                   # Environment variables
│   │   ├── notification.ts          # Owner notification helper
│   │   ├── imageGeneration.ts       # Image generation helper
│   │   ├── voiceTranscription.ts    # Whisper transcription helper
│   │   └── map.ts                   # Google Maps proxy
│   ├── db.ts                        # Database query helpers (493 lines, 40+ functions)
│   ├── storage.ts                   # S3 file storage helpers
│   ├── routers.ts                   # Main router aggregation
│   └── routers/
│       ├── pipeline.ts              # Prospective client pipeline (125 lines)
│       ├── proposals.ts             # Fee proposals CRUD (142 lines)
│       ├── billing.ts               # Timesheets, invoices, payments (152 lines)
│       ├── cases.ts                 # Case management (82 lines)
│       ├── tasks.ts                 # Task management (53 lines)
│       ├── clients.ts               # Client directory (48 lines)
│       ├── team.ts                  # Team/user management (40 lines)
│       ├── notifications.ts         # Notification CRUD (41 lines)
│       ├── dashboard.ts             # Dashboard analytics (19 lines)
│       ├── companies.ts             # Multi-tenant companies (29 lines)
│       ├── aiAgents.ts              # 7 AI agents with LLM (410 lines)
│       └── audit.ts                 # Audit agent with LLM (178 lines)
├── drizzle/
│   ├── schema.ts                    # Database schema (688 lines, 25+ tables)
│   └── meta/                        # Migration snapshots
├── shared/
│   ├── const.ts                     # Shared constants
│   └── types.ts                     # Shared TypeScript types
├── todo.md                          # Feature tracking (681 lines)
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
├── vitest.config.ts                 # Test configuration
└── drizzle.config.ts                # Drizzle ORM configuration
```

---

## 5. Data Flow

The system follows a unidirectional data flow pattern. When a user interacts with the frontend, the following sequence occurs:

1. The React component calls a tRPC hook (useQuery for reads, useMutation for writes).
2. The tRPC client serializes the request using SuperJSON and sends it as an HTTP POST to `/api/trpc/*`.
3. The Express server receives the request and builds a context object containing the authenticated user (if any).
4. The tRPC router validates the input using Zod schemas and executes the procedure.
5. The procedure calls database helper functions from `server/db.ts`, which use Drizzle ORM to execute SQL queries.
6. The response flows back through tRPC with full type inference, and TanStack Query caches the result on the client.

For AI agent interactions, the flow extends to include an LLM call. The agent router retrieves relevant CRM data from the database, constructs a system prompt with that context, appends the conversation history, and sends the complete message array to the LLM API. The response is saved to the `ai_messages` table and returned to the client.

---

## 6. Authentication Flow

Authentication uses Manus OAuth with JWT session cookies. The flow is as follows:

1. The client redirects to the Manus OAuth portal with the application ID and return URL encoded in the state parameter.
2. After successful authentication, the OAuth server redirects back to `/api/oauth/callback` with an authorization code.
3. The server exchanges the code for user information, creates or updates the user record in the database, and issues a JWT session cookie.
4. Subsequent requests include the session cookie, which the context builder verifies to extract the authenticated user.
5. Protected procedures require a valid user context; public procedures work without authentication.

The `useAuth()` hook on the client provides the current user state, and `getLoginUrl()` generates the correct OAuth redirect URL.

---

## 7. Multi-Tenant Architecture

The system supports multiple companies through the `companies` and `company_members` tables. Each company has a unique code, configurable modules (stored as JSON), and its own settings. Users can belong to multiple companies through the membership table.

The `enabledModules` field on the company record controls which CRM features are available. This allows the same deployment to serve a law firm with full legal modules, a consulting firm with simplified case management, or a real estate company with property-focused workflows.

---

## 8. Module Registry

| Module | Router | Tables | Description |
|--------|--------|--------|-------------|
| Pipeline | `pipeline` | `prospective_clients`, `pipeline_activities` | Prospective client tracking with 6-stage Kanban |
| Fee Proposals | `proposals` | `fee_proposals`, `proposal_line_items` | 7-category fee proposal management |
| Billing | `billing` | `timesheet_entries`, `invoices`, `payments`, `retainer_tracking` | Time tracking, invoicing, payments |
| Cases | `cases` | `cases` | Legal case lifecycle management |
| Tasks | `tasks` | `tasks` | Task assignment and tracking |
| Clients | `clients` | `clients` | Client directory and profiles |
| Team | `team` | `users`, `company_members` | Team management and roles |
| Notifications | `notifications` | `notifications`, `notification_templates` | Multi-channel notification system |
| AI Agents | `aiAgents` | `ai_conversations`, `ai_messages` | 7 specialized LLM-powered agents |
| Audit | `audit` | `activity_log`, `ai_conversations` | System audit trail and AI support |
| Dashboard | `dashboard` | (aggregates from all tables) | Executive KPI dashboard |
| Companies | `companies` | `companies`, `company_members` | Multi-tenant company management |

---

## 9. Error Handling Strategy

The system uses a layered error handling approach. At the tRPC level, procedures throw `TRPCError` with appropriate codes (UNAUTHORIZED, FORBIDDEN, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR). The client receives typed error responses that can be handled in the `onError` callback of mutations or displayed through the Sonner toast notification system.

For AI agent errors, the system includes fallback responses in Arabic to ensure the user always receives feedback, even when the LLM service is unavailable. The system health check endpoint monitors LLM connectivity and database status in real time.

---

## 10. Performance Considerations

The frontend uses TanStack Query's built-in caching to minimize redundant API calls. Query keys are structured hierarchically (e.g., `pipeline.list`, `cases.list`) to enable targeted cache invalidation after mutations. The database layer uses Drizzle ORM's query builder, which generates optimized SQL without the overhead of a full ORM abstraction.

For the AI agents, conversation history is limited to the last 20 messages to control token usage and response latency. The system prompt for each agent is carefully crafted to include only relevant CRM context, reducing unnecessary token consumption.
