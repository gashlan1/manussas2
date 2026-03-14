import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(authenticated = true): TrpcContext {
  const user: AuthenticatedUser | null = authenticated
    ? {
        id: 1,
        openId: "test-user-001",
        email: "mgashlan@aglc.com.sa",
        name: "Mohamed Gashlan",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

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

describe("CRM Authentication", () => {
  it("returns authenticated user via auth.me", async () => {
    const ctx = createMockContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.name).toBe("Mohamed Gashlan");
    expect(result?.email).toBe("mgashlan@aglc.com.sa");
    expect(result?.role).toBe("admin");
  });

  it("returns null for unauthenticated user via auth.me", async () => {
    const ctx = createMockContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("logout clears session and returns success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      ...createMockContext(true),
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});

describe("CRM Router Structure", () => {
  it("has auth router with me and logout procedures", () => {
    expect(appRouter._def.procedures).toBeDefined();
    // Verify the router has the expected structure
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("auth.me");
    expect(procedures).toContain("auth.logout");
  });

  it("has system router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    const systemProcedures = procedures.filter(p => p.startsWith("system."));
    expect(systemProcedures.length).toBeGreaterThan(0);
  });
});
