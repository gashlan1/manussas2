# AGLC CRM: Database Schema Reference

**Document Type:** Technology Transfer  
**Version:** 2.0  
**Date:** March 15, 2026  
**Classification:** Confidential

---

## Overview

The AGLC CRM database uses MySQL 8.0+ (TiDB-compatible) with 25 tables organized across 10 functional domains. The schema is managed through Drizzle ORM with TypeScript type inference, ensuring compile-time safety for all database operations. All timestamps are stored in UTC, and all monetary values are stored in Saudi Riyals (SAR) as integers to avoid floating-point precision issues.

---

## Entity Relationship Summary

```
users ──────────┬──── company_members ──── companies
                │
                ├──── prospective_clients ──── pipeline_activities
                │           │
                │           └──── (converts to) ──── clients
                │                                      │
                │           ┌──────────────────────────┤
                │           │                          │
                ├──── fee_proposals ──── proposal_line_items
                │           │
                │           └──── invoices ──── payments
                │                    │
                ├──── cases ─────────┤
                │       │            │
                ├──── tasks          │
                │                    │
                ├──── timesheet_entries
                │
                ├──── notifications
                │
                ├──── activity_log
                │
                └──── ai_conversations ──── ai_messages
```

---

## Table Definitions

### 1. users

The core user table storing all authenticated users with their profile information and CRM-specific fields.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique user identifier |
| openId | VARCHAR(64) | NOT NULL, UNIQUE | Manus OAuth identifier |
| name | TEXT | - | Full display name |
| email | VARCHAR(320) | - | Email address |
| loginMethod | VARCHAR(64) | - | OAuth provider method |
| role | ENUM('user','admin') | NOT NULL, DEFAULT 'user' | System access level |
| firmRole | VARCHAR(64) | DEFAULT 'associate' | Law firm role (partner, associate, etc.) |
| themePreference | VARCHAR(32) | DEFAULT 'classic-normal' | Selected UI theme |
| language | VARCHAR(5) | DEFAULT 'ar' | Preferred language (ar/en) |
| avatarUrl | TEXT | - | Profile image URL |
| phone | VARCHAR(32) | - | Phone number |
| title | VARCHAR(128) | - | Job title |
| department | VARCHAR(128) | - | Department name |
| hourlyRate | INT | - | Billing rate in SAR/hour |
| isActive | BOOLEAN | DEFAULT true | Account active status |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | Account creation time |
| updatedAt | TIMESTAMP | NOT NULL, ON UPDATE | Last modification time |
| lastSignedIn | TIMESTAMP | NOT NULL, DEFAULT NOW | Last login timestamp |

### 2. companies

Multi-tenant company records with configurable module access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Company identifier |
| code | VARCHAR(32) | NOT NULL, UNIQUE | Short company code |
| nameEn | VARCHAR(255) | NOT NULL | English company name |
| nameAr | VARCHAR(255) | - | Arabic company name |
| companyType | VARCHAR(64) | NOT NULL | Type: law_firm, consulting, real_estate, etc. |
| logoUrl | TEXT | - | Company logo URL |
| primaryColor | VARCHAR(16) | - | Brand color hex code |
| enabledModules | JSON | - | Array of enabled module codes |
| settings | JSON | - | Company-specific configuration |
| isActive | BOOLEAN | DEFAULT true | Active status |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

### 3. company_members

Junction table linking users to companies with role assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Membership identifier |
| companyId | INT | NOT NULL, FK | Reference to companies.id |
| userId | INT | NOT NULL, FK | Reference to users.id |
| firmRole | VARCHAR(64) | NOT NULL | Role within the company |
| isActive | BOOLEAN | DEFAULT true | Membership active status |
| createdAt | TIMESTAMP | NOT NULL | Join date |

### 4. prospective_clients

Pipeline prospects with 6-stage workflow and MISA integration fields.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Prospect identifier |
| referenceNumber | VARCHAR(32) | NOT NULL, UNIQUE | Format: PC-YYYY-XXXX |
| isMisa | BOOLEAN | NOT NULL, DEFAULT false | MISA platform referral flag |
| contactName | VARCHAR(255) | NOT NULL | Primary contact name |
| companyName | VARCHAR(255) | - | Company/organization name |
| email | VARCHAR(320) | - | Contact email |
| phone | VARCHAR(32) | - | Contact phone |
| nationality | VARCHAR(64) | - | Contact nationality |
| stage | ENUM | NOT NULL, DEFAULT 'initial_contact' | Pipeline stage (6 values) |
| source | ENUM | NOT NULL, DEFAULT 'other' | Lead source (8 values) |
| assignedTo | INT | FK | Assigned team member |
| assignedCao | BOOLEAN | DEFAULT false | CAO assignment flag |
| industry | VARCHAR(128) | - | Industry sector |
| estimatedValue | INT | - | Estimated deal value (SAR) |
| serviceInterest | VARCHAR(128) | - | Service type of interest |
| notes | MEDIUMTEXT | - | Free-form notes |
| qualificationScore | INT | - | Lead quality score (0-100) |
| misaApplicationId | VARCHAR(64) | - | MISA application reference |
| misaServiceType | VARCHAR(64) | - | MISA service category |
| misaCompanyType | VARCHAR(64) | - | MISA company classification |
| metadata | JSON | - | Additional structured data |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |
| convertedAt | TIMESTAMP | - | Client conversion timestamp |

**Stage values:** initial_contact, qualification, proposal_sent, negotiation, signed, lost

**Source values:** website, referral, misa_platform, walk_in, conference, whatsapp, email, other

### 5. pipeline_activities

Activity log for pipeline interactions (calls, emails, meetings).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Activity identifier |
| prospectiveClientId | INT | NOT NULL, FK | Reference to prospect |
| userId | INT | NOT NULL, FK | User who performed activity |
| type | ENUM | NOT NULL | Activity type (6 values) |
| summary | TEXT | NOT NULL | Activity description |
| outcome | TEXT | - | Result of the activity |
| nextAction | TEXT | - | Planned follow-up |
| nextActionDate | TIMESTAMP | - | Follow-up deadline |
| metadata | JSON | - | Additional data |
| createdAt | TIMESTAMP | NOT NULL | Activity timestamp |

### 6. fee_proposals

Fee proposals with 7 fee type categories and full financial tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Proposal identifier |
| referenceNumber | VARCHAR(32) | NOT NULL, UNIQUE | Format: FP-YYYY-XXXX |
| clientId | INT | NOT NULL, FK | Reference to clients.id |
| feeType | ENUM | NOT NULL | Fee structure type (7 values) |
| status | ENUM | NOT NULL, DEFAULT 'draft' | Proposal status (8 values) |
| scopeOfWork | MEDIUMTEXT | NOT NULL | Detailed scope description |
| totalAmountSar | INT | NOT NULL | Total amount in SAR |
| vatPercent | INT | DEFAULT 15 | VAT percentage |
| vatAmount | INT | - | Calculated VAT amount |
| grandTotalSar | INT | - | Total including VAT |
| validUntil | TIMESTAMP | - | Proposal expiry date |
| paymentTerms | TEXT | - | Payment schedule terms |
| lineItems | JSON | - | Itemized fee breakdown |
| notes | MEDIUMTEXT | - | Additional notes |
| createdBy | INT | FK | Author user ID |
| approvedBy | INT | FK | Approver user ID |
| sentAt | TIMESTAMP | - | Date sent to client |
| respondedAt | TIMESTAMP | - | Client response date |
| metadata | JSON | - | Additional data |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

**Fee types:** fixed, hourly, retainer, contingency, hybrid, success_fee, subscription

**Status values:** draft, internal_review, sent, client_review, negotiation, accepted, rejected, expired

### 7. proposal_line_items

Individual line items within fee proposals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Line item identifier |
| proposalId | INT | NOT NULL, FK | Reference to fee_proposals.id |
| description | TEXT | NOT NULL | Service description |
| quantity | INT | DEFAULT 1 | Number of units |
| unitPrice | INT | NOT NULL | Price per unit (SAR) |
| totalPrice | INT | NOT NULL | Line total (SAR) |
| sortOrder | INT | DEFAULT 0 | Display order |

### 8. timesheet_entries

Time tracking records linked to cases, tasks, and clients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Entry identifier |
| userId | INT | NOT NULL, FK | Timekeeper user ID |
| caseId | INT | FK | Associated case |
| taskId | INT | FK | Associated task |
| clientId | INT | NOT NULL, FK | Billed client |
| date | TIMESTAMP | NOT NULL | Work date |
| durationMinutes | INT | NOT NULL | Time spent (minutes) |
| description | TEXT | NOT NULL | Work description |
| role | VARCHAR(64) | NOT NULL | Billing role |
| ratePerHour | INT | NOT NULL | Hourly rate (SAR) |
| billableAmount | INT | - | Calculated billable amount |
| isBillable | BOOLEAN | DEFAULT true | Billable flag |
| status | ENUM | NOT NULL, DEFAULT 'draft' | Entry status (5 values) |
| approvedBy | INT | FK | Approver user ID |
| approvedAt | TIMESTAMP | - | Approval timestamp |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

### 9. invoices

Client invoices with VAT calculation and payment tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Invoice identifier |
| referenceNumber | VARCHAR(32) | NOT NULL, UNIQUE | Format: INV-YYYY-XXXX |
| clientId | INT | NOT NULL, FK | Billed client |
| proposalId | INT | FK | Associated proposal |
| subtotalSar | INT | NOT NULL | Pre-tax amount |
| vatPercent | INT | DEFAULT 15 | VAT percentage |
| vatAmount | INT | - | Calculated VAT |
| totalSar | INT | - | Total including VAT |
| paidAmount | INT | DEFAULT 0 | Amount received |
| balanceDue | INT | - | Outstanding balance |
| status | ENUM | NOT NULL, DEFAULT 'draft' | Invoice status (6 values) |
| lineItems | JSON | - | Itemized charges |
| notes | MEDIUMTEXT | - | Additional notes |
| issuedAt | TIMESTAMP | - | Date sent to client |
| dueDate | TIMESTAMP | - | Payment due date |
| paidAt | TIMESTAMP | - | Full payment date |
| billingPeriodStart | TIMESTAMP | - | Billing period start |
| billingPeriodEnd | TIMESTAMP | - | Billing period end |
| createdBy | INT | FK | Creator user ID |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

### 10. payments

Payment records linked to invoices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Payment identifier |
| invoiceId | INT | NOT NULL, FK | Associated invoice |
| amountSar | INT | NOT NULL | Payment amount (SAR) |
| paymentMethod | VARCHAR(64) | - | Method (bank_transfer, etc.) |
| paymentReference | VARCHAR(128) | - | Transaction reference |
| receivedAt | TIMESTAMP | NOT NULL | Payment date |
| recordedBy | INT | FK | Recording user ID |
| notes | TEXT | - | Payment notes |
| createdAt | TIMESTAMP | NOT NULL | Record creation time |

### 11. retainer_tracking

Monthly retainer consumption tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Record identifier |
| clientId | INT | NOT NULL, FK | Client on retainer |
| proposalId | INT | FK | Associated retainer proposal |
| periodStart | TIMESTAMP | NOT NULL | Period start date |
| periodEnd | TIMESTAMP | NOT NULL | Period end date |
| retainerAmountSar | INT | NOT NULL | Monthly retainer amount |
| usedAmountSar | INT | DEFAULT 0 | Amount consumed |
| remainingAmountSar | INT | - | Remaining balance |
| hoursIncluded | INT | - | Hours in retainer |
| hoursUsed | INT | DEFAULT 0 | Hours consumed |
| status | ENUM | NOT NULL, DEFAULT 'active' | Tracking status |
| createdAt | TIMESTAMP | NOT NULL | Record creation time |

### 12-16. Additional Tables

The remaining tables follow similar patterns:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `misa_applications` | MISA platform integration tracking | applicationId, serviceType (7 types), status (7 states), investorName, investmentAmount |
| `role_definitions` | Configurable role templates | code, nameEn, nameAr, permissions (JSON), isSystemRole |
| `daily_workflow_templates` | Workflow automation templates | roleCode, dayOfWeek, tasks (JSON), isActive |
| `notification_templates` | Notification message templates | code, nameEn, nameAr, channel, priority, bodyTemplate, variables (JSON) |
| `notifications` | User notification records | userId, channel, priority, status, title, body, entityType, entityId, readAt |
| `permission_matrix` | Role-based access control | roleCode, module, accessLevel (5 levels) |
| `permission_audit_log` | Permission change tracking | changedBy, roleCode, module, oldLevel, newLevel, reason |
| `report_definitions` | Report configuration | code, nameEn, nameAr, frequency, dataSource, filters (JSON) |
| `report_instances` | Generated report records | reportId, status, generatedAt, fileUrl, parameters (JSON) |
| `dashboard_widgets` | Configurable dashboard widgets | code, nameEn, nameAr, widgetType, dataSource, config (JSON) |
| `cases` | Legal case management | referenceNumber, clientId, caseType (8 types), status (6 states), priority |
| `tasks` | Task management | title, caseId, assignedTo, status (5 states), priority, dueDate |
| `clients` | Client directory | referenceNumber, companyName, contactPerson, status, industry |
| `activity_log` | System audit trail | userId, entityType, entityId, action, description, metadata (JSON) |
| `ai_conversations` | AI agent conversation sessions | userId, title, context, updatedAt |
| `ai_messages` | Individual AI chat messages | conversationId, role (user/assistant), content |

---

## Enum Value Reference

| Enum Name | Values |
|-----------|--------|
| Pipeline Stage | initial_contact, qualification, proposal_sent, negotiation, signed, lost |
| Lead Source | website, referral, misa_platform, walk_in, conference, whatsapp, email, other |
| Fee Type | fixed, hourly, retainer, contingency, hybrid, success_fee, subscription |
| Proposal Status | draft, internal_review, sent, client_review, negotiation, accepted, rejected, expired |
| Case Type | corporate, litigation, regulatory, ip, labor, real_estate, banking, other |
| Case Status | intake, active, on_hold, completed, closed, archived |
| Task Status | pending, in_progress, blocked, completed, cancelled |
| Priority | low, medium, high, critical |
| Invoice Status | draft, sent, paid, partial, overdue, void |
| Timesheet Status | draft, submitted, approved, rejected, billed |
| Notification Channel | in_app, email, whatsapp |
| Notification Priority | low, normal, high, urgent |
| Access Level | none, view, edit, full, admin |
| User Role | user, admin |
| MISA Service Type | 100_percent_foreign, joint_venture, branch_office, regional_hq, rep_office, professional_license, other |
| MISA Status | draft, submitted, under_review, approved, rejected, requires_info, completed |
