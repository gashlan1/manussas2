import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const billingRouter = router({
  timesheets: router({
    list: protectedProcedure
      .input(z.object({
        userId: z.number().optional(),
        caseId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getTimesheetEntries(input);
      }),

    create: protectedProcedure
      .input(z.object({
        caseId: z.number().optional(),
        taskId: z.number().optional(),
        clientId: z.number(),
        date: z.string(),
        durationMinutes: z.number().min(15),
        description: z.string().min(1),
        role: z.string(),
        ratePerHour: z.number(),
        isBillable: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const billableAmount = Math.round((input.durationMinutes / 60) * input.ratePerHour);
        const id = await db.createTimesheetEntry({
          ...input,
          date: new Date(input.date),
          userId: ctx.user.id,
          billableAmount,
          status: "draft",
        });
        return { id };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "submitted", "approved", "rejected", "billed"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const updateData: any = { status: input.status };
        if (input.status === "approved") {
          updateData.approvedBy = ctx.user.id;
          updateData.approvedAt = new Date();
        }
        await db.updateTimesheetEntry(input.id, updateData);
        return { success: true };
      }),
  }),

  invoices: router({
    list: protectedProcedure
      .input(z.object({
        clientId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getInvoices(input);
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        proposalId: z.number().optional(),
        subtotalSar: z.number(),
        vatPercent: z.number().default(15),
        lineItems: z.any().optional(),
        notes: z.string().optional(),
        dueDate: z.string().optional(),
        billingPeriodStart: z.string().optional(),
        billingPeriodEnd: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const vatAmount = Math.round(input.subtotalSar * (input.vatPercent / 100));
        const totalSar = input.subtotalSar + vatAmount;
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const refNum = `INV-${new Date().getFullYear()}-${timestamp}`;

        const id = await db.createInvoice({
          referenceNumber: refNum,
          clientId: input.clientId,
          proposalId: input.proposalId,
          subtotalSar: input.subtotalSar,
          vatPercent: input.vatPercent,
          vatAmount,
          totalSar,
          balanceDue: totalSar,
          status: "draft",
          lineItems: input.lineItems,
          notes: input.notes,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          billingPeriodStart: input.billingPeriodStart ? new Date(input.billingPeriodStart) : undefined,
          billingPeriodEnd: input.billingPeriodEnd ? new Date(input.billingPeriodEnd) : undefined,
          createdBy: ctx.user.id,
        });

        await db.logActivity({
          userId: ctx.user.id,
          entityType: "invoice",
          entityId: id,
          action: "created",
          description: `Created invoice ${refNum}`,
        });

        return { id, referenceNumber: refNum };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "paid", "partial", "overdue", "void"]),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { status: input.status };
        if (input.status === "sent") updateData.issuedAt = new Date();
        if (input.status === "paid") updateData.paidAt = new Date();
        await db.updateInvoice(input.id, updateData);
        return { success: true };
      }),

    recordPayment: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        amountSar: z.number(),
        paymentMethod: z.string().optional(),
        paymentReference: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createPayment({
          ...input,
          receivedAt: new Date(),
          recordedBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  retainers: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getRetainerTracking(input?.clientId);
      }),
  }),
});
