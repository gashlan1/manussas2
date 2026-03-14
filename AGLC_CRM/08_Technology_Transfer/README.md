# AGLC CRM: Technology Transfer Package

**Date:** March 15, 2026  
**Classification:** Confidential

---

## Package Contents

This package contains the complete technology transfer materials for the AGLC CRM system, including all source code, documentation, database schemas, and deployment instructions.

### Documentation

| Document | File | Description |
|----------|------|-------------|
| Architecture Guide | `01_ARCHITECTURE_GUIDE.md` | System overview, tech stack, data flow, module registry |
| API Reference | `02_API_REFERENCE.md` | Complete tRPC endpoint documentation with inputs/outputs |
| Database Schema | `03_DATABASE_SCHEMA.md` | All 25+ tables with column definitions and relationships |
| Deployment Guide | `04_DEPLOYMENT_GUIDE.md` | Installation, configuration, environment setup, Kimi adaptation |
| AI Agents Guide | `05_AI_AGENTS_GUIDE.md` | All 8 AI agents with system prompts and customization |
| Enhancement Plan | `06_ENHANCEMENT_PLAN.md` | 4-phase roadmap with priorities and effort estimates |
| Audit Report | `AGLC_CRM_Audit_Report.md` | Complete system audit with findings and recommendations |

### Source Code

| Directory | Contents |
|-----------|----------|
| `source_code/` | Complete project source (ready to install and run) |
| `source_code/client/` | React 19 frontend with 13 pages, 5 themes, bilingual UI |
| `source_code/server/` | Express + tRPC backend with 12 routers |
| `source_code/drizzle/` | Database schema (688 lines, 25+ tables) |
| `source_code/shared/` | Shared types and constants |

### Reference Documents

| File | Description |
|------|-------------|
| `reference_documents/README.docx` through `README10.docx` | Original plugin specifications |
| `reference_documents/AGLC_CRM_KNOWLEDGE_TRANSFER.pdf` | Knowledge transfer document |
| `reference_documents/AGLC_TASK_EXPORT.zip` | Task export data |

---

## Quick Start

```bash
cd source_code
pnpm install
# Configure .env with required variables (see 04_DEPLOYMENT_GUIDE.md)
pnpm db:push
pnpm dev
```

---

## System Summary

| Metric | Value |
|--------|-------|
| Frontend Pages | 13 |
| Backend Routers | 12 |
| Database Tables | 25+ |
| AI Agents | 7 + 1 Audit |
| Visual Themes | 5 |
| Languages | Arabic (RTL) + English (LTR) |
| Test Cases | 26 passing |
| TypeScript Errors | 0 |
| Total Source Lines | ~8,000+ |
