import { eq, desc, and, sql, like, gte, lte, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, prospectiveClients, pipelineActivities, pipelineMetrics,
  feeProposals, proposalLineItems, proposalActivities,
  timesheetEntries, invoices, retainerTracking, payments,
  termsLibrary, termsVersionHistory, proposalTerms,
  docusignEnvelopes, docusignAuditLog,
  misaApplications,
  roleDefinitions, dailyWorkflowTemplates,
  notificationTemplates, notifications,
  permissionMatrix, permissionAuditLog,
  reportDefinitions, reportInstances, dashboardWidgets,
  cases, tasks, clients, activityLog,
  companies, companyMembers,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================
// USERS
// ============================================================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserProfile(userId: number, data: { firmRole?: string; themePreference?: string; language?: string; phone?: string; title?: string; department?: string; hourlyRate?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ============================================================
// PROSPECTIVE CLIENTS (Pipeline)
// ============================================================
export async function getProspectiveClients(filters?: { stage?: string; source?: string; isMisa?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.stage) conditions.push(eq(prospectiveClients.stage, filters.stage as any));
  if (filters?.source) conditions.push(eq(prospectiveClients.source, filters.source as any));
  if (filters?.isMisa !== undefined) conditions.push(eq(prospectiveClients.isMisa, filters.isMisa));
  const query = conditions.length > 0
    ? db.select().from(prospectiveClients).where(and(...conditions)).orderBy(desc(prospectiveClients.createdAt))
    : db.select().from(prospectiveClients).orderBy(desc(prospectiveClients.createdAt));
  return query;
}

export async function getProspectiveClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(prospectiveClients).where(eq(prospectiveClients.id, id)).limit(1);
  return result[0];
}

export async function createProspectiveClient(data: typeof prospectiveClients.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(prospectiveClients).values(data);
  return result[0].insertId;
}

export async function updateProspectiveClient(id: number, data: Partial<typeof prospectiveClients.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(prospectiveClients).set(data).where(eq(prospectiveClients.id, id));
}

export async function createPipelineActivity(data: typeof pipelineActivities.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(pipelineActivities).values(data);
}

export async function getPipelineActivities(pcId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pipelineActivities).where(eq(pipelineActivities.prospectiveClientId, pcId)).orderBy(desc(pipelineActivities.createdAt));
}

export async function getPipelineStats() {
  const db = await getDb();
  if (!db) return { total: 0, byStage: {}, totalValue: 0 };
  const all = await db.select().from(prospectiveClients);
  const byStage: Record<string, number> = {};
  let totalValue = 0;
  all.forEach(pc => {
    byStage[pc.stage] = (byStage[pc.stage] || 0) + 1;
    totalValue += pc.estimatedValue || 0;
  });
  return { total: all.length, byStage, totalValue };
}

// ============================================================
// FEE PROPOSALS
// ============================================================
export async function getFeeProposals(filters?: { status?: string; category?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(feeProposals.status, filters.status as any));
  if (filters?.category) conditions.push(eq(feeProposals.category, filters.category as any));
  return conditions.length > 0
    ? db.select().from(feeProposals).where(and(...conditions)).orderBy(desc(feeProposals.createdAt))
    : db.select().from(feeProposals).orderBy(desc(feeProposals.createdAt));
}

export async function getFeeProposalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(feeProposals).where(eq(feeProposals.id, id)).limit(1);
  return result[0];
}

export async function createFeeProposal(data: typeof feeProposals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(feeProposals).values(data);
  return result[0].insertId;
}

export async function updateFeeProposal(id: number, data: Partial<typeof feeProposals.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(feeProposals).set(data).where(eq(feeProposals.id, id));
}

export async function getProposalLineItems(proposalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(proposalLineItems).where(eq(proposalLineItems.proposalId, proposalId)).orderBy(proposalLineItems.sortOrder);
}

export async function createProposalLineItem(data: typeof proposalLineItems.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(proposalLineItems).values(data);
}

export async function createProposalActivity(data: typeof proposalActivities.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(proposalActivities).values(data);
}

// ============================================================
// BILLING & TIMESHEETS
// ============================================================
export async function getTimesheetEntries(filters?: { userId?: number; caseId?: number; status?: string; dateFrom?: Date; dateTo?: Date }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.userId) conditions.push(eq(timesheetEntries.userId, filters.userId));
  if (filters?.caseId) conditions.push(eq(timesheetEntries.caseId, filters.caseId));
  if (filters?.status) conditions.push(eq(timesheetEntries.status, filters.status as any));
  if (filters?.dateFrom) conditions.push(gte(timesheetEntries.date, filters.dateFrom));
  if (filters?.dateTo) conditions.push(lte(timesheetEntries.date, filters.dateTo));
  return conditions.length > 0
    ? db.select().from(timesheetEntries).where(and(...conditions)).orderBy(desc(timesheetEntries.date))
    : db.select().from(timesheetEntries).orderBy(desc(timesheetEntries.date));
}

export async function createTimesheetEntry(data: typeof timesheetEntries.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timesheetEntries).values(data);
  return result[0].insertId;
}

export async function updateTimesheetEntry(id: number, data: Partial<typeof timesheetEntries.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(timesheetEntries).set(data).where(eq(timesheetEntries.id, id));
}

export async function getInvoices(filters?: { clientId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.clientId) conditions.push(eq(invoices.clientId, filters.clientId));
  if (filters?.status) conditions.push(eq(invoices.status, filters.status as any));
  return conditions.length > 0
    ? db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt))
    : db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function createInvoice(data: typeof invoices.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invoices).values(data);
  return result[0].insertId;
}

export async function updateInvoice(id: number, data: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function getRetainerTracking(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  return clientId
    ? db.select().from(retainerTracking).where(eq(retainerTracking.clientId, clientId))
    : db.select().from(retainerTracking);
}

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(payments).values(data);
}

// ============================================================
// CASES
// ============================================================
export async function getCases(filters?: { status?: string; caseType?: string; assignedTo?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(cases.status, filters.status as any));
  if (filters?.caseType) conditions.push(eq(cases.caseType, filters.caseType as any));
  if (filters?.assignedTo) conditions.push(eq(cases.assignedTo, filters.assignedTo));
  return conditions.length > 0
    ? db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt))
    : db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result[0];
}

export async function createCase(data: typeof cases.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cases).values(data);
  return result[0].insertId;
}

export async function updateCase(id: number, data: Partial<typeof cases.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(cases).set(data).where(eq(cases.id, id));
}

// ============================================================
// TASKS
// ============================================================
export async function getTasks(filters?: { status?: string; assignedTo?: number; caseId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));
  if (filters?.assignedTo) conditions.push(eq(tasks.assignedTo, filters.assignedTo));
  if (filters?.caseId) conditions.push(eq(tasks.caseId, filters.caseId));
  return conditions.length > 0
    ? db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt))
    : db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: typeof tasks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

// ============================================================
// CLIENTS
// ============================================================
export async function getClients(filters?: { status?: string; isVip?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(clients.status, filters.status as any));
  if (filters?.isVip !== undefined) conditions.push(eq(clients.isVip, filters.isVip));
  return conditions.length > 0
    ? db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.createdAt))
    : db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function createClient(data: typeof clients.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result[0].insertId;
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function getUserNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.recipientId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ readAt: new Date(), status: "read" as any }).where(eq(notifications.id, id));
}

// ============================================================
// TERMS & CONDITIONS
// ============================================================
export async function getTermsLibrary(termType?: string) {
  const db = await getDb();
  if (!db) return [];
  return termType
    ? db.select().from(termsLibrary).where(eq(termsLibrary.termType, termType as any)).orderBy(termsLibrary.sortOrder)
    : db.select().from(termsLibrary).orderBy(termsLibrary.sortOrder);
}

// ============================================================
// ROLES & PERMISSIONS
// ============================================================
export async function getRoleDefinitions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roleDefinitions).orderBy(roleDefinitions.hierarchyLevel);
}

export async function getPermissionMatrix(role?: string) {
  const db = await getDb();
  if (!db) return [];
  return role
    ? db.select().from(permissionMatrix).where(eq(permissionMatrix.role, role))
    : db.select().from(permissionMatrix);
}

// ============================================================
// REPORTS & WIDGETS
// ============================================================
export async function getDashboardWidgets(role?: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dashboardWidgets).where(eq(dashboardWidgets.isActive, true)).orderBy(dashboardWidgets.sortOrder);
}

export async function getReportDefinitions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reportDefinitions).where(eq(reportDefinitions.isActive, true));
}

// ============================================================
// MISA APPLICATIONS
// ============================================================
export async function getMisaApplications(status?: string) {
  const db = await getDb();
  if (!db) return [];
  return status
    ? db.select().from(misaApplications).where(eq(misaApplications.status, status as any)).orderBy(desc(misaApplications.createdAt))
    : db.select().from(misaApplications).orderBy(desc(misaApplications.createdAt));
}

export async function createMisaApplication(data: typeof misaApplications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(misaApplications).values(data);
  return result[0].insertId;
}

// ============================================================
// ACTIVITY LOG
// ============================================================
export async function logActivity(data: typeof activityLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values(data);
}

export async function getActivityLog(entityType?: string, entityId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (entityType) conditions.push(eq(activityLog.entityType, entityType));
  if (entityId) conditions.push(eq(activityLog.entityId, entityId));
  return conditions.length > 0
    ? db.select().from(activityLog).where(and(...conditions)).orderBy(desc(activityLog.createdAt)).limit(limit)
    : db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
}

// ============================================================
// COMPANIES (Multi-tenant)
// ============================================================
export async function getCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(companies.nameEn);
}

export async function createCompany(data: typeof companies.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(data);
  return result[0].insertId;
}

// ============================================================
// DASHBOARD ANALYTICS
// ============================================================
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return {
    totalCases: 0, activeCases: 0, totalClients: 0, totalProposals: 0,
    totalInvoiced: 0, totalPaid: 0, pipelineValue: 0, pendingTasks: 0,
  };

  const [caseRows] = await db.select({ count: count() }).from(cases);
  const [activeCaseRows] = await db.select({ count: count() }).from(cases).where(eq(cases.status, "active"));
  const [clientRows] = await db.select({ count: count() }).from(clients);
  const [proposalRows] = await db.select({ count: count() }).from(feeProposals);
  const [taskRows] = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, "pending"));

  const invoiceRows = await db.select({ total: sql<number>`COALESCE(SUM(total_sar), 0)`, paid: sql<number>`COALESCE(SUM(paid_amount), 0)` }).from(invoices);
  const pipelineRows = await db.select({ value: sql<number>`COALESCE(SUM(estimated_value), 0)` }).from(prospectiveClients).where(eq(prospectiveClients.stage, "negotiation" as any));

  return {
    totalCases: caseRows?.count || 0,
    activeCases: activeCaseRows?.count || 0,
    totalClients: clientRows?.count || 0,
    totalProposals: proposalRows?.count || 0,
    totalInvoiced: invoiceRows[0]?.total || 0,
    totalPaid: invoiceRows[0]?.paid || 0,
    pipelineValue: pipelineRows[0]?.value || 0,
    pendingTasks: taskRows?.count || 0,
  };
}
