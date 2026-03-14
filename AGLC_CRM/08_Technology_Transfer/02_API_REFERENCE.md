# AGLC CRM: API Reference (tRPC Endpoints)

**Document Type:** Technology Transfer  
**Version:** 2.0  
**Date:** March 15, 2026  
**Classification:** Confidential

---

## Overview

All API endpoints are exposed through tRPC at the base path `/api/trpc/*`. The client uses typed hooks (`useQuery` for reads, `useMutation` for writes) that automatically infer input and output types from the server router definitions. All requests use HTTP POST with SuperJSON serialization.

Authentication is handled via JWT session cookies. Procedures marked as `protectedProcedure` require a valid session; `publicProcedure` endpoints are accessible without authentication.

---

## 1. Pipeline Router (`pipeline.*`)

Manages the prospective client pipeline with a 6-stage Kanban workflow.

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `pipeline.list` | Query | Yes | `{ stage?: string, source?: string, assignedTo?: number }` | `ProspectiveClient[]` |
| `pipeline.getById` | Query | Yes | `{ id: number }` | `ProspectiveClient` |
| `pipeline.create` | Mutation | Yes | `{ contactName, companyName?, email?, phone?, source, industry?, estimatedValue?, serviceInterest?, notes?, isMisa?, misaApplicationId?, misaServiceType?, misaCompanyType? }` | `{ id, referenceNumber }` |
| `pipeline.updateStage` | Mutation | Yes | `{ id: number, stage: "initial_contact" \| "qualification" \| "proposal_sent" \| "negotiation" \| "signed" \| "lost" }` | `{ success: true }` |
| `pipeline.update` | Mutation | Yes | `{ id: number, ...fields }` | `{ success: true }` |
| `pipeline.addActivity` | Mutation | Yes | `{ prospectiveClientId: number, type: "call" \| "email" \| "meeting" \| "note" \| "whatsapp" \| "document", summary: string, outcome?: string, nextAction?: string, nextActionDate?: string }` | `{ id }` |
| `pipeline.getActivities` | Query | Yes | `{ prospectiveClientId: number }` | `PipelineActivity[]` |
| `pipeline.convert` | Mutation | Yes | `{ prospectiveClientId: number }` | `{ clientId, referenceNumber }` |

---

## 2. Proposals Router (`proposals.*`)

Manages fee proposals with 7 fee categories.

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `proposals.list` | Query | Yes | `{ clientId?: number, status?: string, feeType?: string }` | `FeeProposal[]` |
| `proposals.getById` | Query | Yes | `{ id: number }` | `FeeProposal` |
| `proposals.create` | Mutation | Yes | `{ clientId: number, feeType: "fixed" \| "hourly" \| "retainer" \| "contingency" \| "hybrid" \| "success_fee" \| "subscription", scopeOfWork: string, totalAmountSar: number, vatPercent?: number, validUntil?: string, paymentTerms?: string, lineItems?: any, notes?: string }` | `{ id, referenceNumber }` |
| `proposals.updateStatus` | Mutation | Yes | `{ id: number, status: "draft" \| "internal_review" \| "sent" \| "client_review" \| "negotiation" \| "accepted" \| "rejected" \| "expired" }` | `{ success: true }` |
| `proposals.update` | Mutation | Yes | `{ id: number, ...fields }` | `{ success: true }` |

---

## 3. Billing Router (`billing.*`)

Manages timesheets, invoices, payments, and retainer tracking.

### 3.1 Timesheets (`billing.timesheets.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `billing.timesheets.list` | Query | Yes | `{ clientId?: number, userId?: number, status?: string }` | `TimesheetEntry[]` |
| `billing.timesheets.create` | Mutation | Yes | `{ clientId: number, caseId?: number, taskId?: number, date: string, durationMinutes: number (min 15), description: string, role: string, ratePerHour: number, isBillable?: boolean }` | `{ id }` |
| `billing.timesheets.updateStatus` | Mutation | Yes | `{ id: number, status: "draft" \| "submitted" \| "approved" \| "rejected" \| "billed" }` | `{ success: true }` |

### 3.2 Invoices (`billing.invoices.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `billing.invoices.list` | Query | Yes | `{ clientId?: number, status?: string }` | `Invoice[]` |
| `billing.invoices.create` | Mutation | Yes | `{ clientId: number, proposalId?: number, subtotalSar: number, vatPercent?: number (default 15), lineItems?: any, notes?: string, dueDate?: string, billingPeriodStart?: string, billingPeriodEnd?: string }` | `{ id, referenceNumber }` |
| `billing.invoices.updateStatus` | Mutation | Yes | `{ id: number, status: "draft" \| "sent" \| "paid" \| "partial" \| "overdue" \| "void" }` | `{ success: true }` |
| `billing.invoices.recordPayment` | Mutation | Yes | `{ invoiceId: number, amountSar: number, paymentMethod?: string, paymentReference?: string, notes?: string }` | `{ success: true }` |

### 3.3 Retainers (`billing.retainers.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `billing.retainers.list` | Query | Yes | `{ clientId?: number }` | `RetainerTracking[]` |

---

## 4. Cases Router (`cases.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `cases.list` | Query | Yes | `{ status?: string, caseType?: string, assignedTo?: number }` | `Case[]` |
| `cases.getById` | Query | Yes | `{ id: number }` | `Case` |
| `cases.create` | Mutation | Yes | `{ title: string, clientId: number, caseType: "corporate" \| "litigation" \| "regulatory" \| "ip" \| "labor" \| "real_estate" \| "banking" \| "other", description?: string, priority?: "low" \| "medium" \| "high" \| "critical", assignedTo?: number, courtName?: string, filingDate?: string }` | `{ id, referenceNumber }` |
| `cases.updateStatus` | Mutation | Yes | `{ id: number, status: "intake" \| "active" \| "on_hold" \| "completed" \| "closed" \| "archived" }` | `{ success: true }` |
| `cases.update` | Mutation | Yes | `{ id: number, ...fields }` | `{ success: true }` |

---

## 5. Tasks Router (`tasks.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `tasks.list` | Query | Yes | `{ status?: string, assignedTo?: number, caseId?: number, priority?: string }` | `Task[]` |
| `tasks.create` | Mutation | Yes | `{ title: string, caseId?: number, assignedTo?: number, priority?: string, dueDate?: string, description?: string }` | `{ id }` |
| `tasks.updateStatus` | Mutation | Yes | `{ id: number, status: "pending" \| "in_progress" \| "blocked" \| "completed" \| "cancelled" }` | `{ success: true }` |
| `tasks.update` | Mutation | Yes | `{ id: number, ...fields }` | `{ success: true }` |

---

## 6. Clients Router (`clients.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `clients.list` | Query | Yes | `{ status?: string, search?: string }` | `Client[]` |
| `clients.getById` | Query | Yes | `{ id: number }` | `Client` |
| `clients.create` | Mutation | Yes | `{ companyName: string, contactPerson: string, email?: string, phone?: string, industry?: string, address?: string, notes?: string }` | `{ id, referenceNumber }` |
| `clients.update` | Mutation | Yes | `{ id: number, ...fields }` | `{ success: true }` |

---

## 7. Team Router (`team.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `team.list` | Query | Yes | `(none)` | `User[]` |
| `team.getById` | Query | Yes | `{ id: number }` | `User` |
| `team.updateProfile` | Mutation | Yes | `{ name?: string, phone?: string, title?: string, department?: string, hourlyRate?: number }` | `{ success: true }` |

---

## 8. Notifications Router (`notifications.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `notifications.list` | Query | Yes | `{ unreadOnly?: boolean }` | `Notification[]` |
| `notifications.markRead` | Mutation | Yes | `{ id: number }` | `{ success: true }` |
| `notifications.markAllRead` | Mutation | Yes | `(none)` | `{ success: true }` |

---

## 9. Dashboard Router (`dashboard.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `dashboard.stats` | Query | Yes | `(none)` | `{ activeCases, totalClients, feeProposals, revenue, pipelineValue, pendingTasks, totalCases, outstanding, pipelineFunnel, recentActivity }` |

---

## 10. Companies Router (`companies.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `companies.list` | Query | Yes | `(none)` | `Company[]` |
| `companies.create` | Mutation | Yes | `{ nameEn: string, nameAr?: string, companyType: string, enabledModules?: string[] }` | `{ id }` |

---

## 11. AI Agents Router (`aiAgents.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `aiAgents.chat` | Mutation | Yes | `{ agentType: "planner" \| "tracker" \| "crisis" \| "briefing" \| "assistant" \| "translator" \| "scanner", message: string (max 8000), conversationId?: number }` | `{ conversationId, response }` |
| `aiAgents.listConversations` | Query | Yes | `{ agentType?: string }` | `AIConversation[]` |
| `aiAgents.getConversation` | Query | Yes | `{ conversationId: number }` | `{ conversationId, messages[] }` |
| `aiAgents.deleteConversation` | Mutation | Yes | `{ conversationId: number }` | `{ success: true }` |
| `aiAgents.systemHealthCheck` | Query | Yes | `(none)` | `{ status, llm, database, timestamp, metrics, agents[] }` |

---

## 12. Audit Router (`audit.*`)

| Endpoint | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `audit.chat` | Mutation | Yes | `{ message: string, conversationId?: number, context?: "general" \| "audit" \| "support" \| "legal" }` | `{ conversationId, response }` |
| `audit.getConversation` | Query | Yes | `{ conversationId?: number }` | `{ conversationId, messages[] }` |
| `audit.listConversations` | Query | Yes | `(none)` | `AIConversation[]` |
| `audit.getAuditSummary` | Query | Yes | `(none)` | `{ totalActions, actionBreakdown, userActivity, lastActivity }` |
| `audit.deleteConversation` | Mutation | Yes | `{ conversationId: number }` | `{ success: true }` |

---

## Reference Number Formats

All entities use auto-generated reference numbers for human-readable identification:

| Entity | Format | Example |
|--------|--------|---------|
| Prospective Client | `PC-{YEAR}-{4CHAR}` | PC-2026-I88T |
| Client | `CL-{YEAR}-{4CHAR}` | CL-2026-USK4 |
| Fee Proposal | `FP-{YEAR}-{4CHAR}` | FP-2026-I9XI |
| Case | `{TYPE}-{YEAR}-{4CHAR}` | CORP-2026-I9F9 |
| Invoice | `INV-{YEAR}-{4CHAR}` | INV-2026-A3B2 |
