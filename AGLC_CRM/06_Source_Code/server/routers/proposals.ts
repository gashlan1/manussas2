import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const proposalsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getFeeProposals(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const proposal = await db.getFeeProposalById(input.id);
      if (!proposal) return null;
      const lineItems = await db.getProposalLineItems(input.id);
      return { ...proposal, lineItems };
    }),

  create: protectedProcedure
    .input(z.object({
      category: z.enum(["standard_retainer", "framework_retainer", "fixed_fee", "contingency", "hybrid", "misa_services", "litigation"]),
      titleEn: z.string().min(1),
      titleAr: z.string().optional(),
      prospectiveClientId: z.number().optional(),
      clientId: z.number().optional(),
      isDualOption: z.boolean().default(false),
      secondOptionCategory: z.string().optional(),
      totalValueSar: z.number().optional(),
      proposalData: z.any(),
      dualOptionData: z.any().optional(),
      notes: z.string().optional(),
      lineItems: z.array(z.object({
        description: z.string(),
        role: z.string().optional(),
        ratePerHour: z.number().optional(),
        estimatedHours: z.number().optional(),
        fixedAmount: z.number().optional(),
        governmentFee: z.number().optional(),
        professionalFee: z.number().optional(),
        subtotal: z.number().optional(),
        isSecondOption: z.boolean().default(false),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const prefixMap: Record<string, string> = {
        standard_retainer: "FP", framework_retainer: "FP", fixed_fee: "FP",
        contingency: "FP", hybrid: "FP", misa_services: "FP-MISA", litigation: "FP-LIT",
      };
      const prefix = prefixMap[input.category] || "FP";
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      const refNum = `${prefix}-${new Date().getFullYear()}-${timestamp}`;

      const { lineItems, ...proposalData } = input;
      const id = await db.createFeeProposal({
        ...proposalData,
        referenceNumber: refNum,
        titleAr: proposalData.titleAr || "",
        status: "draft",
        createdBy: ctx.user.id,
        proposalData: proposalData.proposalData || {},
      });

      if (lineItems?.length) {
        for (let i = 0; i < lineItems.length; i++) {
          await db.createProposalLineItem({
            proposalId: id,
            ...lineItems[i],
            description: lineItems[i].description,
            sortOrder: i,
          });
        }
      }

      await db.createProposalActivity({
        proposalId: id,
        activityType: "created",
        toStatus: "draft",
        description: "Fee proposal created",
        performedBy: ctx.user.id,
      });

      await db.logActivity({
        userId: ctx.user.id,
        entityType: "fee_proposal",
        entityId: id,
        action: "created",
        description: `Created fee proposal ${refNum}`,
      });

      return { id, referenceNumber: refNum };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "internal_review", "cao_review", "mp_approval", "approved", "sent", "client_review", "accepted", "rejected", "expired", "withdrawn"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const proposal = await db.getFeeProposalById(input.id);
      if (!proposal) throw new Error("Proposal not found");

      const updateData: any = { status: input.status };
      if (input.status === "approved") {
        updateData.approvedBy = ctx.user.id;
        updateData.approvedAt = new Date();
      }
      if (input.status === "sent") updateData.sentAt = new Date();

      await db.updateFeeProposal(input.id, updateData);
      await db.createProposalActivity({
        proposalId: input.id,
        activityType: "status_change",
        fromStatus: proposal.status,
        toStatus: input.status,
        description: `Status changed from ${proposal.status} to ${input.status}`,
        performedBy: ctx.user.id,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      titleEn: z.string().optional(),
      titleAr: z.string().optional(),
      totalValueSar: z.number().optional(),
      notes: z.string().optional(),
      proposalData: z.any().optional(),
      assignedReviewer: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateFeeProposal(id, data);
      return { success: true };
    }),
});
