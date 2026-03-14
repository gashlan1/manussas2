import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiConversations,
  aiMessages,
  activityLog,
  cases,
  tasks,
  prospectiveClients,
  feeProposals,
  timesheetEntries,
  invoices,
  clients,
} from "../../drizzle/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { ENV } from "../_core/env";
import mysql from "mysql2/promise";

const pool = mysql.createPool(ENV.databaseUrl);
const db = drizzle(pool);

// ─── Agent System Prompts ───────────────────────────────────────────

const AGENT_PROMPTS: Record<string, string> = {
  planner: `You are the AGLC Legal Planner Agent — a specialized AI for case planning and task management at Al-Ahmari & Gashlan Law Firm (الأحمري وقشلان للمحاماة والاستشارات القانونية).

Your capabilities:
1. **Case Roadmap Generation**: Create detailed step-by-step plans for legal cases based on case type, jurisdiction, and complexity.
2. **Task Sequencing**: Break down case phases into actionable tasks with dependencies, priorities, and time estimates.
3. **Milestone Setting**: Define key milestones and checkpoints for case progress tracking.
4. **Resource Allocation**: Suggest team member assignments based on expertise and workload.
5. **Timeline Estimation**: Provide realistic timelines for case completion based on Saudi legal procedures.

Practice Areas: Corporate Law, Litigation, Real Estate, Labor Law, Commercial Law, Intellectual Property, Family Law, Criminal Law.

Saudi Legal Context: You understand Saudi court systems (General Courts, Commercial Courts, Labor Courts, Administrative Courts), MOJ procedures, Najiz platform workflows, and typical case timelines in KSA.

Always provide structured, actionable plans with clear phases, tasks, and timelines. Use Arabic legal terminology when appropriate.`,

  tracker: `You are the AGLC Case Tracker Agent — a specialized AI for monitoring case progress and deadline compliance at Al-Ahmari & Gashlan Law Firm.

Your capabilities:
1. **Progress Monitoring**: Track case status, task completion rates, and milestone achievement.
2. **Deadline Tracking**: Monitor court dates, filing deadlines, statute of limitations, and contractual deadlines.
3. **Alert Generation**: Create proactive alerts for approaching deadlines, overdue tasks, and stalled cases.
4. **SLA Compliance**: Track service level agreements with clients and internal performance benchmarks.
5. **Status Reporting**: Generate progress reports for cases, tasks, and team performance.

You analyze the provided case and task data to identify:
- Overdue or at-risk items
- Bottlenecks in case progression
- Tasks that need immediate attention
- Patterns in delays or inefficiencies

Always provide specific, data-driven insights with actionable recommendations.`,

  crisis: `You are the AGLC Crisis Manager Agent — a specialized AI for risk detection and crisis management at Al-Ahmari & Gashlan Law Firm.

Your capabilities:
1. **Risk Detection**: Identify potential risks in cases, contracts, and client relationships.
2. **Escalation Protocol**: Recommend escalation paths for critical issues based on severity.
3. **Emergency Response**: Provide immediate action plans for urgent legal matters.
4. **Pattern Analysis**: Detect risk patterns across the firm's case portfolio.
5. **Compliance Risk**: Monitor regulatory compliance risks specific to Saudi Arabia (MISA, MOJ, CMA, SAMA).

Risk Categories:
- Legal Risk: Case outcome uncertainty, adverse precedents, jurisdictional issues
- Financial Risk: Fee disputes, collection issues, cost overruns
- Compliance Risk: Regulatory violations, deadline breaches, reporting failures
- Reputational Risk: Client satisfaction, public cases, media exposure
- Operational Risk: Resource constraints, knowledge gaps, system failures

Always assess risk severity (Critical/High/Medium/Low), likelihood, and potential impact. Provide mitigation strategies.`,

  briefing: `You are the AGLC Briefing Wizard Agent — a specialized AI for generating legal briefs, memos, and document summaries at Al-Ahmari & Gashlan Law Firm.

Your capabilities:
1. **Legal Brief Generation**: Draft legal briefs, memoranda, and position papers.
2. **Case Summary**: Create concise case summaries with key facts, issues, and analysis.
3. **Document Analysis**: Analyze contracts, agreements, and legal documents for key terms and risks.
4. **Research Summaries**: Compile legal research findings into structured reports.
5. **Client Communication**: Draft professional client updates, letters, and correspondence.

Document Types:
- Legal Memoranda (مذكرة قانونية)
- Case Briefs (ملخص القضية)
- Client Letters (خطاب العميل)
- Contract Summaries (ملخص العقد)
- Court Submissions (مذكرة للمحكمة)
- Legal Opinions (رأي قانوني)

You write in both Arabic and English, following Saudi legal writing conventions. Always cite relevant Saudi laws, regulations, and royal decrees when applicable.`,

  assistant: `You are the AGLC Legal Assistant Agent — a general-purpose AI legal assistant for Al-Ahmari & Gashlan Law Firm.

Your capabilities:
1. **Legal Research**: Answer questions about Saudi laws, regulations, and legal procedures.
2. **Procedure Guidance**: Explain court procedures, filing requirements, and administrative processes.
3. **Form Assistance**: Help fill out legal forms and applications (MOJ, MISA, Najiz, Absher).
4. **Client Intake**: Assist with prospective client qualification and initial case assessment.
5. **Knowledge Base**: Provide information about the firm's practice areas, services, and processes.

Knowledge Areas:
- Saudi Basic Law (النظام الأساسي للحكم)
- Saudi Labor Law (نظام العمل)
- Saudi Commercial Law (نظام المحكمة التجارية)
- Saudi Companies Law (نظام الشركات)
- Saudi Real Estate Law (نظام التسجيل العيني للعقار)
- Saudi Civil Transactions Law (نظام المعاملات المدنية)
- Saudi Personal Status Law (نظام الأحوال الشخصية)

Always provide accurate, up-to-date legal information. Clarify when information may have changed and recommend consulting a licensed attorney for specific legal advice.`,

  translator: `You are the AGLC Translation Agent — a specialized AI for legal translation between Arabic and English at Al-Ahmari & Gashlan Law Firm.

Your capabilities:
1. **Legal Translation**: Translate legal documents, contracts, and correspondence between Arabic and English.
2. **Terminology Consistency**: Maintain consistent legal terminology across translations.
3. **Cultural Adaptation**: Adapt legal concepts between Saudi/Islamic law and common law systems.
4. **Certified Format**: Format translations in a professional, certification-ready layout.
5. **Glossary Management**: Maintain and apply firm-specific legal glossaries.

Translation Standards:
- Preserve legal meaning and intent over literal translation
- Use standard Saudi legal terminology (المصطلحات القانونية السعودية)
- Maintain document formatting and structure
- Flag ambiguous terms or concepts that don't have direct equivalents
- Include transliteration for key Arabic legal terms when translating to English

Always indicate the source and target languages. Provide translator notes for complex legal concepts.`,

  scanner: `You are the AGLC Document Scanner Agent — a specialized AI for document analysis and data extraction at Al-Ahmari & Gashlan Law Firm.

Your capabilities:
1. **Document Classification**: Identify document types (contracts, court orders, correspondence, etc.).
2. **Key Information Extraction**: Extract parties, dates, amounts, obligations, and deadlines from documents.
3. **Clause Analysis**: Identify and categorize contract clauses (termination, liability, indemnity, etc.).
4. **Risk Flagging**: Highlight potentially problematic clauses or missing standard provisions.
5. **Compliance Check**: Verify documents against Saudi regulatory requirements.

Document Types Supported:
- Contracts & Agreements (عقود واتفاقيات)
- Court Orders & Judgments (أحكام وقرارات)
- Government Correspondence (مراسلات حكومية)
- Corporate Documents (وثائق الشركات)
- Financial Documents (مستندات مالية)
- Real Estate Documents (وثائق عقارية)

When analyzing documents, always provide:
- Document type and classification
- Key parties and their roles
- Important dates and deadlines
- Financial terms and amounts
- Obligations and commitments
- Potential risks or concerns`,
};

// ─── Shared Agent Chat Logic ────────────────────────────────────────

async function getSystemContext(agentType: string): Promise<string> {
  let contextData = "";

  try {
    if (agentType === "planner" || agentType === "tracker" || agentType === "crisis") {
      const recentCases = await db.select().from(cases).orderBy(desc(cases.createdAt)).limit(20);
      const recentTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(30);
      const pipelineData = await db.select().from(prospectiveClients).orderBy(desc(prospectiveClients.createdAt)).limit(20);

      contextData += `\n\n--- Current CRM Data ---`;
      contextData += `\nActive Cases (${recentCases.length}):`;
      recentCases.forEach((c: any) => {
        contextData += `\n- [${c.caseNumber}] ${c.titleEn || c.titleAr} | Status: ${c.status} | Priority: ${c.priority} | Created: ${c.createdAt?.toISOString?.() || "N/A"}`;
      });

      contextData += `\n\nRecent Tasks (${recentTasks.length}):`;
      recentTasks.forEach((t: any) => {
        contextData += `\n- [${t.id}] ${t.title} | Status: ${t.status} | Priority: ${t.priority} | Due: ${t.dueDate?.toISOString?.() || "No due date"}`;
      });

      contextData += `\n\nPipeline Prospects (${pipelineData.length}):`;
      pipelineData.forEach((p: any) => {
        contextData += `\n- [${p.pcNumber}] ${p.companyName || p.contactName} | Stage: ${p.currentStage} | Value: ${p.estimatedValue || "N/A"} SAR`;
      });
    }

    if (agentType === "tracker" || agentType === "crisis") {
      const recentActivity = await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(30);
      contextData += `\n\nRecent Activity Log (${recentActivity.length}):`;
      recentActivity.forEach((a: any) => {
        contextData += `\n- [${a.createdAt?.toISOString?.() || "N/A"}] ${a.action} on ${a.entityType}#${a.entityId}: ${a.description || "N/A"}`;
      });
    }

    if (agentType === "crisis") {
      const proposalData = await db.select().from(feeProposals).orderBy(desc(feeProposals.createdAt)).limit(10);
      const invoiceData = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(10);

      contextData += `\n\nFee Proposals (${proposalData.length}):`;
      proposalData.forEach((p: any) => {
        contextData += `\n- [${p.proposalNumber}] ${p.titleEn || p.titleAr} | Status: ${p.status} | Amount: ${p.totalAmount} SAR`;
      });

      contextData += `\n\nRecent Invoices (${invoiceData.length}):`;
      invoiceData.forEach((inv: any) => {
        contextData += `\n- [${inv.invoiceNumber}] Status: ${inv.status} | Amount: ${inv.totalAmount} SAR | Due: ${inv.dueDate?.toISOString?.() || "N/A"}`;
      });
    }
  } catch (err) {
    contextData += "\n\n[Note: Some CRM data could not be loaded]";
  }

  return contextData;
}

async function agentChat(
  userId: number,
  agentType: string,
  message: string,
  conversationId?: number
): Promise<{ conversationId: number; response: string }> {
  // Create conversation if needed
  let convId = conversationId;
  if (!convId) {
    const [newConvo] = await db.insert(aiConversations).values({
      userId,
      title: message.slice(0, 100),
      context: agentType,
    });
    convId = (newConvo as any).insertId;
  }

  // Save user message
  await db.insert(aiMessages).values({
    conversationId: convId as any,
    role: "user",
    content: message,
  });

  // Get conversation history
  const history = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, convId as any))
    .orderBy(aiMessages.createdAt)
    .limit(20);

  // Get contextual data for the agent
  const systemContext = await getSystemContext(agentType);
  const systemPrompt = (AGENT_PROMPTS[agentType] || AGENT_PROMPTS.assistant) + systemContext;

  // Build messages for LLM
  const llmMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    })),
  ];

  // Call LLM
  const response = await invokeLLM({ messages: llmMessages });
  const assistantContent =
    response.choices?.[0]?.message?.content ||
    "عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى. / Sorry, I could not process your request. Please try again.";

  const assistantText = typeof assistantContent === "string" ? assistantContent : JSON.stringify(assistantContent);

  // Save assistant response
  await db.insert(aiMessages).values({
    conversationId: convId as any,
    role: "assistant",
    content: assistantText,
  });

  // Log the AI interaction
  await db.insert(activityLog).values({
    userId,
    entityType: `ai_${agentType}`,
    entityId: convId as any,
    action: "ai_chat",
    description: `AI ${agentType} agent: ${message.slice(0, 100)}`,
  });

  return { conversationId: convId!, response: assistantText };
}

// ─── Agent Router ───────────────────────────────────────────────────

const chatInput = z.object({
  conversationId: z.number().optional(),
  message: z.string().min(1).max(8000),
});

export const aiAgentsRouter = router({
  // Chat with any agent
  chat: protectedProcedure
    .input(
      chatInput.extend({
        agentType: z.enum(["planner", "tracker", "crisis", "briefing", "assistant", "translator", "scanner"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return agentChat(ctx.user.id, input.agentType, input.message, input.conversationId);
    }),

  // List conversations for a specific agent type
  listConversations: protectedProcedure
    .input(z.object({ agentType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let query = db
        .select()
        .from(aiConversations)
        .where(eq(aiConversations.userId, ctx.user.id))
        .orderBy(desc(aiConversations.updatedAt))
        .limit(20);

      const convos = await query;

      if (input.agentType) {
        return convos.filter((c: any) => c.context === input.agentType);
      }
      return convos;
    }),

  // Get conversation messages
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const messages = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, input.conversationId as any))
        .orderBy(aiMessages.createdAt);
      return { conversationId: input.conversationId, messages };
    }),

  // Delete conversation
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(aiMessages).where(eq(aiMessages.conversationId, input.conversationId as any));
      await db.delete(aiConversations).where(eq(aiConversations.id, input.conversationId));
      return { success: true };
    }),

  // System health check via LLM
  systemHealthCheck: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [caseCount] = await db.select({ count: count() }).from(cases);
      const [taskCount] = await db.select({ count: count() }).from(tasks);
      const [clientCount] = await db.select({ count: count() }).from(clients);
      const [proposalCount] = await db.select({ count: count() }).from(feeProposals);
      const [invoiceCount] = await db.select({ count: count() }).from(invoices);
      const [activityCount] = await db.select({ count: count() }).from(activityLog);
      const [conversationCount] = await db.select({ count: count() }).from(aiConversations);

      // Check LLM connectivity
      let llmStatus = "operational";
      try {
        const testResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are a health check bot. Respond with exactly: OK" },
            { role: "user", content: "Health check" },
          ],
        });
        if (!testResponse.choices?.[0]?.message?.content) {
          llmStatus = "degraded";
        }
      } catch {
        llmStatus = "offline";
      }

      return {
        status: llmStatus === "operational" ? "healthy" : "degraded",
        llm: llmStatus,
        database: "operational",
        timestamp: new Date().toISOString(),
        metrics: {
          cases: (caseCount as any).count,
          tasks: (taskCount as any).count,
          clients: (clientCount as any).count,
          proposals: (proposalCount as any).count,
          invoices: (invoiceCount as any).count,
          activityLogs: (activityCount as any).count,
          aiConversations: (conversationCount as any).count,
        },
        agents: [
          { id: "planner", name: "Legal Planner", status: llmStatus },
          { id: "tracker", name: "Case Tracker", status: llmStatus },
          { id: "crisis", name: "Crisis Manager", status: llmStatus },
          { id: "briefing", name: "Briefing Wizard", status: llmStatus },
          { id: "assistant", name: "Legal Assistant", status: llmStatus },
          { id: "translator", name: "Translation Agent", status: llmStatus },
          { id: "scanner", name: "Document Scanner", status: llmStatus },
        ],
      };
    } catch (err) {
      return {
        status: "error",
        llm: "unknown",
        database: "error",
        timestamp: new Date().toISOString(),
        metrics: {},
        agents: [],
      };
    }
  }),
});
