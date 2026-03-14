import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const casesRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      caseType: z.string().optional(),
      assignedTo: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getCases(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getCaseById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      titleAr: z.string().optional(),
      clientId: z.number().optional(),
      prospectiveClientId: z.number().optional(),
      proposalId: z.number().optional(),
      caseType: z.enum(["retainer", "litigation", "corporate", "misa", "advisory", "other"]),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      assignedTo: z.number().optional(),
      supervisorId: z.number().optional(),
      practiceArea: z.string().optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const typePrefix: Record<string, string> = {
        retainer: "RET", litigation: "LIT", corporate: "CORP",
        misa: "MISA", advisory: "ADV", other: "GEN",
      };
      const prefix = typePrefix[input.caseType] || "GEN";
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      const refNum = `${prefix}-${new Date().getFullYear()}-${timestamp}`;

      const id = await db.createCase({
        ...input,
        referenceNumber: refNum,
        status: "intake",
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });

      await db.logActivity({
        userId: ctx.user.id,
        entityType: "case",
        entityId: id,
        action: "created",
        description: `Created case ${refNum}`,
      });

      return { id, referenceNumber: refNum };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      status: z.enum(["intake", "active", "on_hold", "completed", "closed", "archived"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      assignedTo: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.status === "closed") updateData.closedAt = new Date();
      await db.updateCase(id, updateData);
      return { success: true };
    }),
});
