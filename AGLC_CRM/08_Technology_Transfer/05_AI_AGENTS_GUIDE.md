# AGLC CRM: AI Agents Technical Guide

**Document Type:** Technology Transfer  
**Version:** 2.0  
**Date:** March 15, 2026  
**Classification:** Confidential

---

## Overview

The AGLC CRM integrates 7 specialized AI agents and 1 audit agent, each powered by large language models with domain-specific system prompts and real-time CRM data context. All agents share the same underlying LLM infrastructure but are differentiated by their system prompts, data access patterns, and response formatting.

---

## Agent Architecture

```
User Message
    │
    ▼
┌─────────────────────────────────────────┐
│         tRPC Mutation (aiAgents.chat)    │
│  Input: agentType, message, convId?     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Agent Router (agentChat fn)     │
│  1. Create/retrieve conversation        │
│  2. Save user message to DB             │
│  3. Load conversation history (20 max)  │
│  4. Fetch CRM context data              │
│  5. Build system prompt + context       │
│  6. Call invokeLLM()                    │
│  7. Save assistant response to DB       │
│  8. Log to activity_log                 │
│  9. Return response to client           │
└─────────────────────────────────────────┘
```

---

## Agent Specifications

### 1. Legal Planner (المخطط القانوني)

**Purpose:** Strategic legal planning and case strategy development.

**System Prompt Core:**
> You are the AGLC Legal Planner AI Agent. You specialize in Saudi Arabian legal strategy, case planning, and regulatory compliance. You help lawyers plan case strategies, identify relevant regulations, assess risks, and create action plans. Always reference Saudi laws and regulations when applicable. Respond in the user's language (Arabic or English).

**CRM Context Injected:** Active cases count, pending tasks count, pipeline prospects count, recent activity logs (last 50 actions).

**Use Cases:**
- Developing case strategies for Saudi corporate law matters
- Identifying applicable Saudi regulations and compliance requirements
- Creating litigation timelines and milestone plans
- Risk assessment for pending legal matters

### 2. Case Tracker (متتبع القضايا)

**Purpose:** Real-time case status monitoring and progress reporting.

**System Prompt Core:**
> You are the AGLC Case Tracker AI Agent. You monitor case progress, deadlines, and milestones. You help track case statuses, identify overdue tasks, and provide status summaries. You have access to the CRM case data and activity logs.

**CRM Context Injected:** All cases with status breakdown, tasks by status, overdue items, recent case-related activities.

**Use Cases:**
- Generating case status reports
- Identifying bottlenecks and overdue deadlines
- Tracking task completion rates across cases
- Alerting on cases requiring immediate attention

### 3. Crisis Manager (مدير الأزمات)

**Purpose:** Emergency legal situation assessment and rapid response planning.

**System Prompt Core:**
> You are the AGLC Crisis Manager AI Agent. You specialize in urgent legal situations, emergency response planning, and crisis communication. You help assess the severity of legal crises, prioritize actions, and develop rapid response strategies under Saudi Arabian law.

**CRM Context Injected:** High-priority cases, critical tasks, recent urgent activities.

**Use Cases:**
- Assessing severity of urgent legal situations
- Developing emergency response action plans
- Prioritizing crisis tasks and resource allocation
- Drafting crisis communication templates

### 4. Briefing Wizard (معالج الإحاطات)

**Purpose:** Automated legal brief and document generation.

**System Prompt Core:**
> You are the AGLC Briefing Wizard AI Agent. You specialize in creating legal briefs, memoranda, case summaries, and professional legal documents. You format documents according to Saudi legal standards and can generate content in both Arabic and English.

**CRM Context Injected:** Client information, case details, proposal data.

**Use Cases:**
- Drafting legal memoranda and briefs
- Creating case summary reports
- Generating client-facing documents
- Preparing court filing drafts

### 5. Legal Assistant (المساعد القانوني)

**Purpose:** General-purpose legal Q&A and research support.

**System Prompt Core:**
> You are the AGLC Legal Assistant AI Agent. You provide general legal guidance, answer questions about Saudi Arabian law, help with legal research, and assist with day-to-day legal queries. You are knowledgeable about Saudi commercial law, labor law, corporate governance, and regulatory frameworks.

**CRM Context Injected:** General CRM statistics, recent activities.

**Use Cases:**
- Answering questions about Saudi legal procedures
- Explaining regulatory requirements
- Providing guidance on legal terminology
- Assisting with legal research queries

### 6. Translation Agent (وكيل الترجمة)

**Purpose:** Legal document translation between Arabic and English.

**System Prompt Core:**
> You are the AGLC Translation Agent. You specialize in legal translation between Arabic and English. You maintain legal terminology accuracy, preserve document formatting, and ensure translations are legally precise. You understand Saudi legal terminology in both languages.

**CRM Context Injected:** Minimal (translation-focused, no CRM data needed).

**Use Cases:**
- Translating legal documents between Arabic and English
- Translating contract clauses with legal precision
- Providing terminology equivalents for Saudi legal concepts
- Reviewing and improving existing translations

### 7. Document Scanner (ماسح المستندات)

**Purpose:** Document analysis, extraction, and summarization.

**System Prompt Core:**
> You are the AGLC Document Scanner AI Agent. You specialize in analyzing legal documents, extracting key information, identifying important clauses, and summarizing document contents. You can process contracts, court filings, regulatory documents, and corporate governance materials.

**CRM Context Injected:** Minimal (document-focused).

**Use Cases:**
- Summarizing lengthy legal documents
- Extracting key clauses from contracts
- Identifying risks in legal agreements
- Comparing document versions and highlighting changes

### 8. Audit Agent (وكيل التدقيق)

**Purpose:** System audit trail analysis and compliance monitoring.

**System Prompt Core:**
> You are the AGLC CRM Audit Agent. You have access to the complete system activity log. You can analyze user actions, identify patterns, detect anomalies, and provide audit reports. You help ensure compliance with internal policies and regulatory requirements.

**CRM Context Injected:** Last 50 activity log entries with timestamps, user IDs, entity types, actions, and descriptions.

**Use Cases:**
- Analyzing system usage patterns
- Generating audit trail reports
- Detecting unusual activity patterns
- Compliance monitoring and reporting

---

## System Health Check

The `aiAgents.systemHealthCheck` endpoint performs a comprehensive system health assessment:

1. **Database Check:** Counts records across all major tables (cases, tasks, clients, proposals, invoices, activity logs, AI conversations).
2. **LLM Connectivity Check:** Sends a test message to the LLM API and verifies a valid response.
3. **Agent Status:** Reports the operational status of all 7 agents based on LLM availability.

Response format:
```json
{
  "status": "healthy",
  "llm": "operational",
  "database": "operational",
  "timestamp": "2026-03-15T12:00:00.000Z",
  "metrics": {
    "cases": 15,
    "tasks": 42,
    "clients": 28,
    "proposals": 12,
    "invoices": 8,
    "activityLogs": 350,
    "aiConversations": 5
  },
  "agents": [
    { "id": "planner", "name": "Legal Planner", "status": "operational" },
    { "id": "tracker", "name": "Case Tracker", "status": "operational" },
    ...
  ]
}
```

---

## Conversation Persistence

All AI conversations are persisted in the database through two tables:

The `ai_conversations` table stores conversation metadata (user, title, context/agent type, timestamps), while the `ai_messages` table stores individual messages with their role (user or assistant) and content. Conversations are limited to 20 messages of history when building the LLM context to manage token usage.

---

## Customizing Agent Behavior

To modify an agent's behavior:

1. Open `server/routers/aiAgents.ts`.
2. Locate the `AGENT_PROMPTS` object containing all 7 system prompts.
3. Modify the system prompt text to change the agent's personality, knowledge domain, or response format.
4. The CRM context injection happens in the `agentChat` function, where database queries fetch relevant data to include in the system prompt.

To add a new agent:

1. Add a new entry to `AGENT_PROMPTS` with the agent type key and system prompt.
2. Add the new type to the `agentType` Zod enum in the chat input schema.
3. Update the frontend `AIAgents.tsx` to include the new agent in the agent list.

---

## Token Usage and Cost Management

Each agent chat interaction consumes tokens based on the system prompt length, conversation history, CRM context data, and the user's message. Approximate token usage per interaction:

| Component | Approximate Tokens |
|-----------|-------------------|
| System prompt | 200-400 |
| CRM context data | 500-2000 |
| Conversation history (20 msgs) | 2000-8000 |
| User message | 50-500 |
| **Total per request** | **2,750-10,900** |

To reduce costs, consider limiting conversation history length, reducing CRM context scope, or implementing response caching for common queries.
