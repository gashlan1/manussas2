import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@aglc.com",
    name: "Test Admin",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Dashboard Router", () => {
  it("returns dashboard stats with correct shape", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();

    expect(stats).toHaveProperty("totalCases");
    expect(stats).toHaveProperty("activeCases");
    expect(stats).toHaveProperty("totalClients");
    expect(stats).toHaveProperty("totalProposals");
    expect(stats).toHaveProperty("totalInvoiced");
    expect(stats).toHaveProperty("totalPaid");
    expect(stats).toHaveProperty("pipelineValue");
    expect(stats).toHaveProperty("pendingTasks");
    expect(typeof stats.totalCases).toBe("number");
    expect(typeof stats.activeCases).toBe("number");
  });

  it("returns recent activity list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const activity = await caller.dashboard.recentActivity({ limit: 5 });

    expect(Array.isArray(activity)).toBe(true);
  });
});

describe("Pipeline Router", () => {
  it("returns pipeline list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pipeline = await caller.pipeline.list();

    expect(Array.isArray(pipeline)).toBe(true);
  });

  it("creates a prospective client", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pipeline.create({
      contactName: "Test Client",
      contactEmail: "client@test.com",
      contactPhone: "+966500000000",
      serviceInterest: "corporate",
      estimatedValue: 50000,
      source: "referral",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("updates pipeline stage", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create first
    const { id } = await caller.pipeline.create({
      contactName: "Stage Test Client",
      contactEmail: "stage@test.com",
      serviceInterest: "litigation",
      estimatedValue: 30000,
      source: "website",
    });

    // Update stage
    const result = await caller.pipeline.updateStage({
      id,
      stage: "qualification",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("Cases Router", () => {
  it("returns cases list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const cases = await caller.cases.list();

    expect(Array.isArray(cases)).toBe(true);
  });

  it("creates a case", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cases.create({
      title: "Test Case",
      titleAr: "قضية تجريبية",
      caseType: "corporate",
      priority: "medium",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("Fee Proposals Router", () => {
  it("returns proposals list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const proposals = await caller.proposals.list();

    expect(Array.isArray(proposals)).toBe(true);
  });

  it("creates a fee proposal", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.proposals.create({
      category: "fixed_fee",
      titleEn: "Test Proposal",
      proposalData: { scope: "test" },
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("Billing Router", () => {
  it("returns invoices list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const invoices = await caller.billing.invoices.list();

    expect(Array.isArray(invoices)).toBe(true);
  });

  it("returns timesheets list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const timesheets = await caller.billing.timesheets.list();

    expect(Array.isArray(timesheets)).toBe(true);
  });
});

describe("Tasks Router", () => {
  it("returns tasks list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const tasks = await caller.tasks.list();

    expect(Array.isArray(tasks)).toBe(true);
  });

  it("creates a task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.create({
      title: "Test Task",
      priority: "medium",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("Clients Router", () => {
  it("returns clients list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const clients = await caller.clients.list();

    expect(Array.isArray(clients)).toBe(true);
  });

  it("creates a client", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.create({
      nameEn: "Test Client Corp",
      nameAr: "شركة عميل تجريبي",
      email: "corp@test.com",
      phone: "+966500000001",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("Team Router", () => {
  it("returns team members list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const team = await caller.team.list();

    expect(Array.isArray(team)).toBe(true);
  });
});

describe("Notifications Router", () => {
  it("returns notifications list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const notifications = await caller.notifications.list();

    expect(Array.isArray(notifications)).toBe(true);
  });

  it("creates a notification", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.create({
      recipientId: 1,
      templateCode: "test",
      titleEn: "Test Notification",
      bodyEn: "This is a test notification",
      channel: "in_app",
      priority: "normal",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("Companies Router", () => {
  it("returns companies list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const companies = await caller.companies.list();

    expect(Array.isArray(companies)).toBe(true);
  });

  it("creates a company (admin only)", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const uniqueCode = `TST${Date.now()}`;
    const result = await caller.companies.create({
      code: uniqueCode,
      nameEn: "Test Company",
      companyType: "law_firm",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});
