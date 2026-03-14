import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  serial,
  double,
  mediumtext,
} from "drizzle-orm/mysql-core";

// ============================================================
// CORE: Users
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  firmRole: varchar("firm_role", { length: 64 }).default("associate"),
  themePreference: varchar("theme_preference", { length: 32 }).default("classic-normal"),
  language: varchar("language", { length: 5 }).default("ar"),
  avatarUrl: text("avatar_url"),
  phone: varchar("phone", { length: 32 }),
  title: varchar("title", { length: 128 }),
  department: varchar("department", { length: 128 }),
  hourlyRate: int("hourly_rate"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// CORE: Companies (Multi-Tenant)
// ============================================================
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  companyType: varchar("company_type", { length: 64 }).notNull(), // law_firm, consulting, real_estate, etc.
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 16 }),
  enabledModules: json("enabled_modules"), // Array of module codes enabled for this company
  settings: json("settings"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const companyMembers = mysqlTable("company_members", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id").notNull(),
  userId: int("user_id").notNull(),
  firmRole: varchar("firm_role", { length: 64 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 01: Prospective Client Pipeline
// ============================================================
export const prospectiveClients = mysqlTable("prospective_clients", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("reference_number", { length: 32 }).notNull().unique(),
  isMisa: boolean("is_misa").default(false).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  nationality: varchar("nationality", { length: 64 }),
  stage: mysqlEnum("stage", [
    "initial_contact", "qualification", "proposal_sent", "negotiation", "signed", "lost",
  ]).default("initial_contact").notNull(),
  source: mysqlEnum("source", [
    "website", "referral", "misa_platform", "walk_in", "conference", "whatsapp", "email", "other",
  ]).default("other").notNull(),
  assignedTo: int("assigned_to"),
  assignedCao: boolean("assigned_cao").default(false),
  industry: varchar("industry", { length: 128 }),
  estimatedValue: int("estimated_value"),
  serviceInterest: varchar("service_interest", { length: 128 }),
  notes: mediumtext("notes"),
  qualificationScore: int("qualification_score"),
  misaApplicationId: varchar("misa_application_id", { length: 64 }),
  misaServiceType: varchar("misa_service_type", { length: 64 }),
  misaCompanyType: varchar("misa_company_type", { length: 64 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  convertedAt: timestamp("converted_at"),
  lostAt: timestamp("lost_at"),
  lostReason: text("lost_reason"),
});

export const pipelineActivities = mysqlTable("pipeline_activities", {
  id: int("id").autoincrement().primaryKey(),
  prospectiveClientId: int("prospective_client_id").notNull(),
  activityType: varchar("activity_type", { length: 32 }).notNull(),
  fromStage: varchar("from_stage", { length: 32 }),
  toStage: varchar("to_stage", { length: 32 }),
  description: text("description"),
  performedBy: int("performed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pipelineMetrics = mysqlTable("pipeline_metrics", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 16 }).notNull(),
  totalInquiries: int("total_inquiries").default(0),
  totalQualified: int("total_qualified").default(0),
  totalProposalsSent: int("total_proposals_sent").default(0),
  totalSigned: int("total_signed").default(0),
  totalLost: int("total_lost").default(0),
  totalValueSar: int("total_value_sar").default(0),
  conversionRate: int("conversion_rate"),
  avgDaysToConvert: int("avg_days_to_convert"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 02: Fee Proposals
// ============================================================
export const feeProposals = mysqlTable("fee_proposals", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("reference_number", { length: 32 }).notNull().unique(),
  prospectiveClientId: int("prospective_client_id"),
  clientId: int("client_id"),
  category: mysqlEnum("category", [
    "standard_retainer", "framework_retainer", "fixed_fee",
    "contingency", "hybrid", "misa_services", "litigation",
  ]).notNull(),
  isDualOption: boolean("is_dual_option").default(false),
  secondOptionCategory: varchar("second_option_category", { length: 32 }),
  status: mysqlEnum("fp_status", [
    "draft", "internal_review", "cao_review", "mp_approval",
    "approved", "sent", "client_review", "accepted",
    "rejected", "expired", "withdrawn",
  ]).default("draft").notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }),
  totalValueSar: int("total_value_sar"),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  proposalData: json("proposal_data").notNull(),
  dualOptionData: json("dual_option_data"),
  termsSnapshot: json("terms_snapshot"),
  createdBy: int("created_by").notNull(),
  assignedReviewer: int("assigned_reviewer"),
  approvedBy: int("approved_by"),
  approvedAt: timestamp("approved_at"),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"),
  docusignEnvelopeId: varchar("docusign_envelope_id", { length: 128 }),
  notes: mediumtext("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const proposalLineItems = mysqlTable("proposal_line_items", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposal_id").notNull(),
  isSecondOption: boolean("is_second_option").default(false),
  description: text("description").notNull(),
  role: varchar("role", { length: 64 }),
  ratePerHour: int("rate_per_hour"),
  estimatedHours: int("estimated_hours"),
  fixedAmount: int("fixed_amount"),
  milestoneDescription: text("milestone_description"),
  governmentFee: int("government_fee"),
  professionalFee: int("professional_fee"),
  contingencyPercent: double("contingency_percent"),
  subtotal: int("subtotal"),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proposalActivities = mysqlTable("proposal_activities", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposal_id").notNull(),
  activityType: varchar("activity_type", { length: 32 }).notNull(),
  fromStatus: varchar("from_status", { length: 32 }),
  toStatus: varchar("to_status", { length: 32 }),
  description: text("description"),
  performedBy: int("performed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 03: Billing & Timesheets
// ============================================================
export const timesheetEntries = mysqlTable("timesheet_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  caseId: int("case_id"),
  taskId: int("task_id"),
  clientId: int("client_id").notNull(),
  date: timestamp("date").notNull(),
  durationMinutes: int("duration_minutes").notNull(),
  description: text("description").notNull(),
  role: varchar("role", { length: 64 }).notNull(),
  ratePerHour: int("rate_per_hour").notNull(),
  billableAmount: int("billable_amount").notNull(),
  isBillable: boolean("is_billable").default(true),
  status: mysqlEnum("ts_status", [
    "draft", "submitted", "approved", "rejected", "billed",
  ]).default("draft").notNull(),
  approvedBy: int("approved_by"),
  approvedAt: timestamp("approved_at"),
  invoiceId: int("invoice_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("reference_number", { length: 32 }).notNull().unique(),
  clientId: int("client_id").notNull(),
  proposalId: int("proposal_id"),
  subtotalSar: int("subtotal_sar").notNull(),
  vatPercent: double("vat_percent").default(15),
  vatAmount: int("vat_amount"),
  totalSar: int("total_sar").notNull(),
  paidAmount: int("paid_amount").default(0),
  balanceDue: int("balance_due"),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  status: mysqlEnum("inv_status", [
    "draft", "sent", "paid", "partial", "overdue", "void",
  ]).default("draft").notNull(),
  issuedAt: timestamp("issued_at"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  lineItems: json("line_items"),
  notes: mediumtext("notes"),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const retainerTracking = mysqlTable("retainer_tracking", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id").notNull(),
  proposalId: int("proposal_id").notNull(),
  retainerType: varchar("retainer_type", { length: 32 }).notNull(),
  allottedHoursMonthly: int("allotted_hours_monthly"),
  consumedMinutes: int("consumed_minutes").default(0),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  alert50Sent: boolean("alert_50_sent").default(false),
  alert75Sent: boolean("alert_75_sent").default(false),
  alert90Sent: boolean("alert_90_sent").default(false),
  alert100Sent: boolean("alert_100_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoice_id").notNull(),
  amountSar: int("amount_sar").notNull(),
  paymentMethod: varchar("payment_method", { length: 32 }),
  paymentReference: varchar("payment_reference", { length: 128 }),
  receivedAt: timestamp("received_at").notNull(),
  notes: text("notes"),
  recordedBy: int("recorded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 04: Terms & Conditions
// ============================================================
export const termsLibrary = mysqlTable("terms_library", {
  id: int("id").autoincrement().primaryKey(),
  termType: mysqlEnum("term_type", ["default", "optional", "assumption", "exclusion"]).notNull(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  bodyEn: mediumtext("body_en").notNull(),
  bodyAr: mediumtext("body_ar").notNull(),
  isActive: boolean("is_active").default(true),
  isRemovable: boolean("is_removable").default(true),
  sortOrder: int("sort_order").default(0),
  version: int("version").default(1),
  lastEditedBy: int("last_edited_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const termsVersionHistory = mysqlTable("terms_version_history", {
  id: int("id").autoincrement().primaryKey(),
  termId: int("term_id").notNull(),
  version: int("version").notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  bodyEn: mediumtext("body_en").notNull(),
  bodyAr: mediumtext("body_ar").notNull(),
  changedBy: int("changed_by"),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proposalTerms = mysqlTable("proposal_terms", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposal_id").notNull(),
  termId: int("term_id").notNull(),
  termType: mysqlEnum("pt_term_type", ["default", "optional", "assumption", "exclusion"]).notNull(),
  titleEn: varchar("pt_title_en", { length: 255 }).notNull(),
  titleAr: varchar("pt_title_ar", { length: 255 }).notNull(),
  bodyEn: mediumtext("pt_body_en").notNull(),
  bodyAr: mediumtext("pt_body_ar").notNull(),
  versionAtTime: int("version_at_time").notNull(),
  sortOrder: int("pt_sort_order").default(0),
  createdAt: timestamp("pt_created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 05: DocuSign Integration
// ============================================================
export const docusignEnvelopes = mysqlTable("docusign_envelopes", {
  id: int("id").autoincrement().primaryKey(),
  envelopeId: varchar("envelope_id", { length: 128 }).notNull().unique(),
  proposalId: int("proposal_id").notNull(),
  clientId: int("client_id").notNull(),
  status: mysqlEnum("ds_status", [
    "created", "sent", "delivered", "viewed", "signed", "completed", "declined", "voided",
  ]).default("created").notNull(),
  signer1Name: varchar("signer1_name", { length: 255 }).notNull(),
  signer1Email: varchar("signer1_email", { length: 320 }).notNull(),
  signer1Title: varchar("signer1_title", { length: 128 }),
  signer1SignedAt: timestamp("signer1_signed_at"),
  signer2Name: varchar("signer2_name", { length: 255 }).notNull(),
  signer2Email: varchar("signer2_email", { length: 320 }).notNull(),
  signer2Title: varchar("signer2_title", { length: 128 }),
  signer2SignedAt: timestamp("signer2_signed_at"),
  documentUrl: text("document_url"),
  documentKey: varchar("document_key", { length: 255 }),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  voidedAt: timestamp("voided_at"),
  voidReason: text("void_reason"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const docusignAuditLog = mysqlTable("docusign_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  envelopeId: varchar("ds_envelope_id", { length: 128 }).notNull(),
  eventType: varchar("event_type", { length: 32 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 320 }),
  recipientName: varchar("recipient_name", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  description: text("ds_description"),
  rawPayload: json("raw_payload"),
  createdAt: timestamp("ds_audit_created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 06: MISA Platform Integration
// ============================================================
export const misaApplications = mysqlTable("misa_applications", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: varchar("application_id", { length: 64 }).notNull().unique(),
  prospectiveClientId: int("prospective_client_id"),
  applicantName: varchar("applicant_name", { length: 255 }).notNull(),
  applicantEmail: varchar("applicant_email", { length: 320 }),
  applicantPhone: varchar("applicant_phone", { length: 32 }),
  applicantNationality: varchar("applicant_nationality", { length: 64 }),
  companyName: varchar("misa_company_name", { length: 255 }),
  serviceType: mysqlEnum("service_type", [
    "llc_incorporation", "branch_office", "representative_office",
    "professional_license", "commercial_registration",
    "foreign_investment_license", "special_economic_zone", "other",
  ]).notNull(),
  companyType: varchar("misa_company_type_val", { length: 64 }),
  capitalAmount: int("capital_amount"),
  numberOfShareholders: int("number_of_shareholders"),
  businessActivity: text("business_activity"),
  status: mysqlEnum("misa_status", [
    "received", "triage", "complete", "incomplete", "in_progress",
    "government_submission", "approved", "rejected", "completed",
  ]).default("received").notNull(),
  isComplete: boolean("is_complete").default(false),
  missingDocuments: json("missing_documents"),
  triageNotes: mediumtext("triage_notes"),
  triagedBy: int("triaged_by"),
  triagedAt: timestamp("triaged_at"),
  aiBriefing: mediumtext("ai_briefing"),
  aiBriefingGeneratedAt: timestamp("ai_briefing_generated_at"),
  proposalId: int("misa_proposal_id"),
  governmentFeeSchedule: json("government_fee_schedule"),
  submittedToGovernmentAt: timestamp("submitted_to_government_at"),
  governmentApprovedAt: timestamp("government_approved_at"),
  completedAt: timestamp("misa_completed_at"),
  rawApplicationData: json("raw_application_data"),
  metadata: json("misa_metadata"),
  createdAt: timestamp("misa_created_at").defaultNow().notNull(),
  updatedAt: timestamp("misa_updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================
// PLUGIN 07: Role Architecture
// ============================================================
export const roleDefinitions = mysqlTable("role_definitions", {
  id: int("id").autoincrement().primaryKey(),
  role: varchar("role_code", { length: 64 }).notNull().unique(),
  displayNameEn: varchar("display_name_en", { length: 128 }).notNull(),
  displayNameAr: varchar("display_name_ar", { length: 128 }).notNull(),
  description: text("role_description"),
  hierarchyLevel: int("hierarchy_level").notNull(),
  canViewAllClients: boolean("can_view_all_clients").default(false),
  canViewFinancials: boolean("can_view_financials").default(false),
  canApproveFeeProposals: boolean("can_approve_fee_proposals").default(false),
  canAmendFeeProposals: boolean("can_amend_fee_proposals").default(false),
  canViewPipeline: boolean("can_view_pipeline").default(false),
  canManagePipeline: boolean("can_manage_pipeline").default(false),
  canViewBilling: boolean("can_view_billing").default(false),
  canManageBilling: boolean("can_manage_billing").default(false),
  canViewReports: boolean("can_view_reports").default(false),
  canGenerateReports: boolean("can_generate_reports").default(false),
  canManageUsers: boolean("can_manage_users").default(false),
  canManageRoles: boolean("can_manage_roles").default(false),
  canExportData: boolean("can_export_data").default(false),
  canAccessAdminPanel: boolean("can_access_admin_panel").default(false),
  metadata: json("role_metadata"),
  createdAt: timestamp("role_created_at").defaultNow().notNull(),
  updatedAt: timestamp("role_updated_at").defaultNow().onUpdateNow().notNull(),
});

export const dailyWorkflowTemplates = mysqlTable("daily_workflow_templates", {
  id: int("id").autoincrement().primaryKey(),
  role: varchar("wf_role", { length: 64 }).notNull(),
  timeSlot: varchar("time_slot", { length: 8 }).notNull(),
  taskDescription: text("task_description").notNull(),
  taskDescriptionAr: text("task_description_ar"),
  isRequired: boolean("is_required").default(true),
  sortOrder: int("wf_sort_order").default(0),
  createdAt: timestamp("wf_created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 08: Notifications
// ============================================================
export const notificationTemplates = mysqlTable("notification_templates", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("nt_code", { length: 64 }).notNull().unique(),
  titleEn: varchar("nt_title_en", { length: 255 }).notNull(),
  titleAr: varchar("nt_title_ar", { length: 255 }).notNull(),
  bodyTemplateEn: mediumtext("body_template_en").notNull(),
  bodyTemplateAr: mediumtext("body_template_ar").notNull(),
  channel: mysqlEnum("channel", ["in_app", "email", "whatsapp"]).default("in_app").notNull(),
  priority: mysqlEnum("nt_priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  recipientRoles: json("recipient_roles"),
  escalationPath: json("escalation_path"),
  escalationTimeoutMinutes: int("escalation_timeout_minutes"),
  cronExpression: varchar("nt_cron_expression", { length: 64 }),
  isScheduled: boolean("is_scheduled").default(false),
  isActive: boolean("nt_is_active").default(true),
  createdAt: timestamp("nt_created_at").defaultNow().notNull(),
  updatedAt: timestamp("nt_updated_at").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  templateCode: varchar("template_code", { length: 64 }).notNull(),
  recipientId: int("recipient_id").notNull(),
  channel: mysqlEnum("notif_channel", ["in_app", "email", "whatsapp"]).notNull(),
  priority: mysqlEnum("notif_priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  status: mysqlEnum("notif_status", [
    "pending", "sent", "delivered", "read", "acknowledged", "escalated", "failed",
  ]).default("pending").notNull(),
  titleEn: varchar("notif_title_en", { length: 255 }).notNull(),
  titleAr: varchar("notif_title_ar", { length: 255 }),
  bodyEn: mediumtext("notif_body_en").notNull(),
  bodyAr: mediumtext("notif_body_ar"),
  relatedEntityType: varchar("related_entity_type", { length: 32 }),
  relatedEntityId: int("related_entity_id"),
  actionUrl: text("action_url"),
  sentAt: timestamp("notif_sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: int("escalated_to"),
  metadata: json("notif_metadata"),
  createdAt: timestamp("notif_created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 09: Permission Matrix
// ============================================================
export const permissionMatrix = mysqlTable("permission_matrix", {
  id: int("id").autoincrement().primaryKey(),
  role: varchar("pm_role", { length: 64 }).notNull(),
  moduleCode: varchar("module_code", { length: 64 }).notNull(),
  accessLevel: mysqlEnum("access_level", ["none", "view", "edit", "full", "admin"]).default("none").notNull(),
  customOverrides: json("custom_overrides"),
  createdAt: timestamp("pm_created_at").defaultNow().notNull(),
  updatedAt: timestamp("pm_updated_at").defaultNow().onUpdateNow().notNull(),
});

export const permissionAuditLog = mysqlTable("permission_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  role: varchar("pal_role", { length: 64 }).notNull(),
  moduleCode: varchar("pal_module_code", { length: 64 }).notNull(),
  previousLevel: varchar("previous_level", { length: 16 }),
  newLevel: varchar("new_level", { length: 16 }),
  changedBy: int("changed_by").notNull(),
  reason: text("pal_reason"),
  createdAt: timestamp("pal_created_at").defaultNow().notNull(),
});

// ============================================================
// PLUGIN 10: Reporting Suite
// ============================================================
export const reportDefinitions = mysqlTable("report_definitions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("report_code", { length: 64 }).notNull().unique(),
  titleEn: varchar("report_title_en", { length: 255 }).notNull(),
  titleAr: varchar("report_title_ar", { length: 255 }).notNull(),
  description: text("report_description"),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly", "quarterly", "annual", "adhoc"]).notNull(),
  cronExpression: varchar("report_cron", { length: 64 }),
  recipientRoles: json("report_recipient_roles"),
  dataSources: json("data_sources"),
  templateConfig: json("template_config"),
  isActive: boolean("report_is_active").default(true),
  createdAt: timestamp("report_created_at").defaultNow().notNull(),
  updatedAt: timestamp("report_updated_at").defaultNow().onUpdateNow().notNull(),
});

export const reportInstances = mysqlTable("report_instances", {
  id: int("id").autoincrement().primaryKey(),
  definitionId: int("definition_id").notNull(),
  status: mysqlEnum("report_inst_status", ["scheduled", "generating", "completed", "failed"]).default("scheduled").notNull(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  generatedData: json("generated_data"),
  pdfUrl: text("pdf_url"),
  excelUrl: text("excel_url"),
  generatedBy: int("generated_by"),
  generatedAt: timestamp("generated_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("ri_created_at").defaultNow().notNull(),
});

export const dashboardWidgets = mysqlTable("dashboard_widgets", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("widget_code", { length: 64 }).notNull().unique(),
  titleEn: varchar("widget_title_en", { length: 255 }).notNull(),
  titleAr: varchar("widget_title_ar", { length: 255 }).notNull(),
  widgetType: varchar("widget_type", { length: 16 }).notNull(),
  chartType: varchar("chart_type", { length: 16 }),
  dataSource: varchar("data_source", { length: 128 }).notNull(),
  refreshIntervalSeconds: int("refresh_interval_seconds").default(300),
  defaultSize: varchar("default_size", { length: 16 }).default("medium"),
  visibleToRoles: json("visible_to_roles"),
  config: json("widget_config"),
  sortOrder: int("widget_sort_order").default(0),
  isActive: boolean("widget_is_active").default(true),
  createdAt: timestamp("widget_created_at").defaultNow().notNull(),
});

// ============================================================
// CORE: Cases (expanded from Phase 1)
// ============================================================
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("case_reference", { length: 32 }).notNull().unique(),
  title: varchar("case_title", { length: 255 }).notNull(),
  titleAr: varchar("case_title_ar", { length: 255 }),
  clientId: int("case_client_id"),
  prospectiveClientId: int("case_pc_id"),
  proposalId: int("case_proposal_id"),
  caseType: mysqlEnum("case_type", [
    "retainer", "litigation", "corporate", "misa", "advisory", "other",
  ]).default("other").notNull(),
  status: mysqlEnum("case_status", [
    "intake", "active", "on_hold", "completed", "closed", "archived",
  ]).default("intake").notNull(),
  priority: mysqlEnum("case_priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  assignedTo: int("case_assigned_to"),
  supervisorId: int("supervisor_id"),
  practiceArea: varchar("practice_area", { length: 128 }),
  description: mediumtext("case_description"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("case_due_date"),
  closedAt: timestamp("case_closed_at"),
  totalBilledSar: int("total_billed_sar").default(0),
  metadata: json("case_metadata"),
  createdAt: timestamp("case_created_at").defaultNow().notNull(),
  updatedAt: timestamp("case_updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================
// CORE: Tasks
// ============================================================
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("task_title", { length: 255 }).notNull(),
  titleAr: varchar("task_title_ar", { length: 255 }),
  caseId: int("task_case_id"),
  assignedTo: int("task_assigned_to"),
  createdBy: int("task_created_by").notNull(),
  status: mysqlEnum("task_status", [
    "pending", "in_progress", "blocked", "completed", "cancelled",
  ]).default("pending").notNull(),
  priority: mysqlEnum("task_priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  description: mediumtext("task_description"),
  dueDate: timestamp("task_due_date"),
  completedAt: timestamp("task_completed_at"),
  estimatedMinutes: int("estimated_minutes"),
  actualMinutes: int("actual_minutes"),
  metadata: json("task_metadata"),
  createdAt: timestamp("task_created_at").defaultNow().notNull(),
  updatedAt: timestamp("task_updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================
// CORE: Clients
// ============================================================
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("client_reference", { length: 32 }).notNull().unique(),
  nameEn: varchar("client_name_en", { length: 255 }).notNull(),
  nameAr: varchar("client_name_ar", { length: 255 }),
  email: varchar("client_email", { length: 320 }),
  phone: varchar("client_phone", { length: 32 }),
  companyName: varchar("client_company", { length: 255 }),
  industry: varchar("client_industry", { length: 128 }),
  nationality: varchar("client_nationality", { length: 64 }),
  isVip: boolean("is_vip").default(false),
  status: mysqlEnum("client_status", ["active", "inactive", "prospect"]).default("active").notNull(),
  convertedFromPcId: int("converted_from_pc_id"),
  notes: mediumtext("client_notes"),
  metadata: json("client_metadata"),
  createdAt: timestamp("client_created_at").defaultNow().notNull(),
  updatedAt: timestamp("client_updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================
// CORE: Activity Log (universal audit trail)
// ============================================================
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("al_user_id"),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: int("entity_id").notNull(),
  action: varchar("al_action", { length: 64 }).notNull(),
  description: text("al_description"),
  previousData: json("previous_data"),
  newData: json("new_data"),
  createdAt: timestamp("al_created_at").defaultNow().notNull(),
});

// ============================================================
// AI: Conversations & Messages (for LLM Audit Agent)
// ============================================================
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("aic_user_id").notNull(),
  title: varchar("aic_title", { length: 255 }),
  context: varchar("aic_context", { length: 64 }).default("general"), // general, audit, support, legal
  createdAt: timestamp("aic_created_at").defaultNow().notNull(),
  updatedAt: timestamp("aic_updated_at").defaultNow().onUpdateNow().notNull(),
});

export const aiMessages = mysqlTable("ai_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("aim_conversation_id").notNull(),
  role: varchar("aim_role", { length: 16 }).notNull(), // user, assistant, system
  content: mediumtext("aim_content").notNull(),
  createdAt: timestamp("aim_created_at").defaultNow().notNull(),
});
