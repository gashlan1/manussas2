import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      assignedTo: z.number().optional(),
      caseId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getTasks(input);
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      titleAr: z.string().optional(),
      caseId: z.number().optional(),
      assignedTo: z.number().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedMinutes: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createTask({
        ...input,
        createdBy: ctx.user.id,
        status: "pending",
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      status: z.enum(["pending", "in_progress", "blocked", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      assignedTo: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.status === "completed") updateData.completedAt = new Date();
      await db.updateTask(id, updateData);
      return { success: true };
    }),
});
