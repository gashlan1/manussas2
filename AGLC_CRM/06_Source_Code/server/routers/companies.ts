import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const companiesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getCompanies();
  }),

  create: protectedProcedure
    .input(z.object({
      code: z.string().min(2).max(32),
      nameEn: z.string().min(1),
      nameAr: z.string().optional(),
      companyType: z.string(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      enabledModules: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Only admins can create companies");
      const id = await db.createCompany({
        ...input,
        enabledModules: input.enabledModules || [],
        isActive: true,
      });
      return { id };
    }),
});
