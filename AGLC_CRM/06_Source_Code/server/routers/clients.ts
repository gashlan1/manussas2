import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      isVip: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getClients(input);
    }),

  create: protectedProcedure
    .input(z.object({
      nameEn: z.string().min(1),
      nameAr: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      nationality: z.string().optional(),
      isVip: z.boolean().default(false),
      convertedFromPcId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      const refNum = `CL-${new Date().getFullYear()}-${timestamp}`;

      const id = await db.createClient({
        ...input,
        referenceNumber: refNum,
        status: "active",
      });

      await db.logActivity({
        userId: ctx.user.id,
        entityType: "client",
        entityId: id,
        action: "created",
        description: `Created client ${refNum}`,
      });

      return { id, referenceNumber: refNum };
    }),
});
