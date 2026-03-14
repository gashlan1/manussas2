# AGLC CRM - Source Code

## Overview

This is the complete source code for the AGLC Law Firm CRM system, built with React 19, TypeScript, tRPC, Express, and Drizzle ORM on MySQL/TiDB.

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Tailwind CSS 4 | UI with shadcn/ui components |
| API | tRPC 11 + Express 4 | Type-safe RPC with Superjson |
| Database | Drizzle ORM + MySQL (TiDB) | 25+ tables with migrations |
| Auth | Manus OAuth | Session-based authentication |
| AI | LLM Integration | Audit agent with conversation history |
| Storage | S3 | File storage with CDN |

## Modules (10 Plugins)

1. **Pipeline** - Prospective client tracking with Kanban stages
2. **Fee Proposals** - Proposal creation, line items, approval workflow
3. **Billing** - Timesheets, invoices, retainer tracking, payments
4. **Cases** - Case management with phases and assignments
5. **Tasks** - Task board with priorities and status tracking
6. **Clients** - Client database with company associations
7. **Team** - User management with roles and permissions
8. **Notifications** - Multi-channel notification system
9. **Reports** - Analytics and reporting dashboard
10. **AI Agents** - AI-powered legal assistants

## Additional Features

- **Audit Agent** - LLM-powered audit trail analysis and support
- **Multi-Company** - Multi-tenant architecture for managing multiple companies
- **5 Themes** - Classic Dark, Classic Light, Neon Dark, Neon Light, LawSurface Blue
- **Bilingual** - Full Arabic/English with RTL/LTR switching
- **Design System** - Custom CSS variables with gold/navy/copper accents

## Getting Started

```bash
pnpm install
pnpm db:push
pnpm dev
```

## File Structure

```
client/src/
  pages/          - 14 page components
  components/     - Reusable UI components
  contexts/       - Theme, Language, CRM Theme contexts
  App.tsx         - Routes and layout
server/
  routers/        - 11 tRPC routers
  db.ts           - Database query helpers
  _core/          - Framework plumbing
drizzle/
  schema.ts       - 25+ database tables
```
