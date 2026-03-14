import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return db.getUserNotifications(ctx.user.id, input?.limit);
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),

  create: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      templateCode: z.string(),
      titleEn: z.string(),
      titleAr: z.string().optional(),
      bodyEn: z.string(),
      bodyAr: z.string().optional(),
      channel: z.enum(["in_app", "email", "whatsapp"]).default("in_app"),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      relatedEntityType: z.string().optional(),
      relatedEntityId: z.number().optional(),
      actionUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createNotification({
        ...input,
        status: "sent",
        sentAt: new Date(),
      });
      return { success: true };
    }),
});
