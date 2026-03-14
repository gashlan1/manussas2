import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const teamRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllUsers();
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      firmRole: z.string().optional(),
      themePreference: z.string().optional(),
      language: z.string().optional(),
      phone: z.string().optional(),
      title: z.string().optional(),
      department: z.string().optional(),
      hourlyRate: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      firmRole: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only admin can change roles
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      await db.updateUserProfile(input.userId, { firmRole: input.firmRole });
      return { success: true };
    }),

  roles: protectedProcedure.query(async () => {
    return db.getRoleDefinitions();
  }),
});
