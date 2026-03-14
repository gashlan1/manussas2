import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async () => {
    return db.getDashboardStats();
  }),

  recentActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      return db.getActivityLog(undefined, undefined, input?.limit || 20);
    }),

  widgets: protectedProcedure.query(async () => {
    return db.getDashboardWidgets();
  }),
});
