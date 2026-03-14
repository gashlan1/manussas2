import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const pipelineRouter = router({
  list: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
      source: z.string().optional(),
      isMisa: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getProspectiveClients(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getProspectiveClientById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      contactName: z.string().min(1),
      companyName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      nationality: z.string().optional(),
      source: z.enum(["website", "referral", "misa_platform", "walk_in", "conference", "whatsapp", "email", "other"]),
      isMisa: z.boolean().default(false),
      industry: z.string().optional(),
      estimatedValue: z.number().optional(),
      serviceInterest: z.string().optional(),
      notes: z.string().optional(),
      misaApplicationId: z.string().optional(),
      misaServiceType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const prefix = input.isMisa ? "PC-MISA" : "PC";
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      const refNum = `${prefix}-${new Date().getFullYear()}-${timestamp}`;

      const id = await db.createProspectiveClient({
        ...input,
        referenceNumber: refNum,
        stage: "initial_contact",
      });

      await db.createPipelineActivity({
        prospectiveClientId: id,
        activityType: "stage_change",
        toStage: "initial_contact",
        description: "Prospective client created",
        performedBy: ctx.user.id,
      });

      await db.logActivity({
        userId: ctx.user.id,
        entityType: "prospective_client",
        entityId: id,
        action: "created",
        description: `Created prospective client ${refNum}`,
      });

      return { id, referenceNumber: refNum };
    }),

  updateStage: protectedProcedure
    .input(z.object({
      id: z.number(),
      stage: z.enum(["initial_contact", "qualification", "proposal_sent", "negotiation", "signed", "lost"]),
      lostReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const pc = await db.getProspectiveClientById(input.id);
      if (!pc) throw new Error("Prospective client not found");

      const updateData: any = { stage: input.stage };
      if (input.stage === "signed") updateData.convertedAt = new Date();
      if (input.stage === "lost") {
        updateData.lostAt = new Date();
        updateData.lostReason = input.lostReason;
      }

      await db.updateProspectiveClient(input.id, updateData);
      await db.createPipelineActivity({
        prospectiveClientId: input.id,
        activityType: "stage_change",
        fromStage: pc.stage,
        toStage: input.stage,
        description: `Stage changed from ${pc.stage} to ${input.stage}`,
        performedBy: ctx.user.id,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      contactName: z.string().optional(),
      companyName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      estimatedValue: z.number().optional(),
      notes: z.string().optional(),
      qualificationScore: z.number().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProspectiveClient(id, data);
      return { success: true };
    }),

  getActivities: protectedProcedure
    .input(z.object({ prospectiveClientId: z.number() }))
    .query(async ({ input }) => {
      return db.getPipelineActivities(input.prospectiveClientId);
    }),

  stats: protectedProcedure.query(async () => {
    return db.getPipelineStats();
  }),
});
