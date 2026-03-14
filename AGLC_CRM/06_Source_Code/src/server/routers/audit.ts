import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { drizzle } from "drizzle-orm/mysql2";
import { aiConversations, aiMessages, activityLog } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { ENV } from "../_core/env";
import mysql from "mysql2/promise";

const pool = mysql.createPool(ENV.databaseUrl);
const dbConn = drizzle(pool);

const AUDIT_SYSTEM_PROMPT = `You are the AGLC CRM Audit & Support Agent — an AI assistant embedded in the legal practice management system for Al-Ahmari & Gashlan Law Firm (الأحمري وقشلان للمحاماة والاستشارات القانونية).

Your responsibilities:
1. **Audit Trail Analysis**: Review activity logs, identify patterns, flag anomalies, and generate compliance reports.
2. **System Support**: Help users navigate the CRM, explain features, troubleshoot issues, and provide best practices.
3. **Data Integrity**: Monitor data quality, identify missing fields, duplicate records, and inconsistencies.
4. **Compliance Monitoring**: Track regulatory compliance, deadline adherence, and permission usage.
5. **Performance Insights**: Analyze team productivity, case resolution times, billing efficiency, and pipeline health.

You respond in both Arabic and English based on the user's language preference. Be professional, precise, and reference specific CRM modules when applicable.

Available CRM modules: Pipeline, Cases, Tasks, Fee Proposals, Billing, Clients, Team, Notifications, Reports, AI Agents, Settings, Companies.

When analyzing audit data, always:
- Cite specific timestamps and user actions
- Highlight potential risks or compliance issues
- Suggest corrective actions when appropriate
- Reference relevant Saudi legal requirements when applicable`;

export const auditRouter = router({
  // Get or create a conversation
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.conversationId) {
        const messages = await dbConn
          .select()
          .from(aiMessages)
          .where(eq(aiMessages.conversationId, input.conversationId as any))
          .orderBy(aiMessages.createdAt);
        return { conversationId: input.conversationId, messages };
      }
      return { conversationId: null, messages: [] };
    }),

  // List user's conversations
  listConversations: protectedProcedure.query(async ({ ctx }) => {
      const convos = await dbConn
        .select()
        .from(aiConversations)
        .where(eq(aiConversations.userId, ctx.user.id))
        .orderBy(desc(aiConversations.updatedAt))
        .limit(20);
    return convos;
  }),

  // Send a message and get AI response
  chat: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().optional(),
        message: z.string().min(1).max(4000),
        context: z.enum(["general", "audit", "support", "legal"]).default("general"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let conversationId = input.conversationId;

      // Create conversation if needed
      if (!conversationId) {
        const [newConvo] = await dbConn.insert(aiConversations).values({
          userId: ctx.user.id,
          title: input.message.slice(0, 100),
          context: input.context,
        });
        conversationId = (newConvo as any).insertId;
      }

      // Save user message
      await dbConn.insert(aiMessages).values({
        conversationId: conversationId as any,
        role: "user",
        content: input.message,
      });

      // Get conversation history
      const history = await dbConn
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conversationId as any))
        .orderBy(aiMessages.createdAt)
        .limit(20);

      // Get recent activity logs for audit context
      const recentActivity = await dbConn
        .select()
        .from(activityLog)
        .orderBy(desc(activityLog.createdAt))
        .limit(50);

      const activityContext = recentActivity.length > 0
        ? `\n\nRecent System Activity (last 50 actions):\n${recentActivity.map((a: any) =>
            `[${a.createdAt?.toISOString()}] User#${a.userId} ${a.action} on ${a.entityType}#${a.entityId}: ${a.description || 'N/A'}`
          ).join('\n')}`
        : '\n\nNo recent activity logs available.';

      // Build messages for LLM
      const llmMessages = [
        { role: "system" as const, content: AUDIT_SYSTEM_PROMPT + activityContext },
        ...history.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content as string,
        })),
      ];

      // Call LLM
      const response = await invokeLLM({ messages: llmMessages });
      const assistantContent =
        response.choices?.[0]?.message?.content || "عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.";

      // Save assistant response
      const assistantText = typeof assistantContent === 'string' ? assistantContent : JSON.stringify(assistantContent);
      await dbConn.insert(aiMessages).values({
        conversationId: conversationId as any,
        role: "assistant",
        content: assistantText,
      });

      // Log the AI interaction
      await dbConn.insert(activityLog).values({
        userId: ctx.user.id,
        entityType: "ai_audit",
        entityId: conversationId as any,
        action: "ai_chat",
        description: `AI Audit Agent conversation: ${input.message.slice(0, 100)}`,
      });

      return {
        conversationId,
        response: assistantContent,
      };
    }),

  // Get audit summary
  getAuditSummary: protectedProcedure.query(async ({ ctx }) => {
    const recentActivity = await dbConn
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(100);

    // Group by action type
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<number, number> = {};
    recentActivity.forEach((a: any) => {
      actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
      if (a.userId) userCounts[a.userId] = (userCounts[a.userId] || 0) + 1;
    });

    return {
      totalActions: recentActivity.length,
      actionBreakdown: actionCounts,
      userActivity: userCounts,
      lastActivity: recentActivity[0] || null,
    };
  }),

  // Delete a conversation
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await dbConn.delete(aiMessages).where(eq(aiMessages.conversationId, input.conversationId as any));
      await dbConn.delete(aiConversations).where(eq(aiConversations.id, input.conversationId));
      return { success: true };
    }),
});
