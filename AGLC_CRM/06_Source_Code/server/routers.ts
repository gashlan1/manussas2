import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { pipelineRouter } from "./routers/pipeline";
import { proposalsRouter } from "./routers/proposals";
import { billingRouter } from "./routers/billing";
import { casesRouter } from "./routers/cases";
import { tasksRouter } from "./routers/tasks";
import { clientsRouter } from "./routers/clients";
import { teamRouter } from "./routers/team";
import { notificationsRouter } from "./routers/notifications";
import { dashboardRouter } from "./routers/dashboard";
import { companiesRouter } from "./routers/companies";
import { auditRouter } from "./routers/audit";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  pipeline: pipelineRouter,
  proposals: proposalsRouter,
  billing: billingRouter,
  cases: casesRouter,
  tasks: tasksRouter,
  clients: clientsRouter,
  team: teamRouter,
  notifications: notificationsRouter,
  dashboard: dashboardRouter,
  companies: companiesRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
