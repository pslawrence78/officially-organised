import type { User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createRemoteHousehold } from "./remoteSyncRepository";

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock("./supabaseClient", () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

describe("remoteSyncRepository", () => {
  it("creates households with owner_user_id mapped to the current Supabase user", async () => {
    const householdInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: { id: "household_remote_1" }, error: null })),
      })),
    }));
    const memberInsert = vi.fn(async () => ({ error: null }));
    const from = vi.fn((table: string) => {
      if (table === "households") return { insert: householdInsert };
      if (table === "household_members") return { insert: memberInsert };
      throw new Error(`Unexpected table ${table}`);
    });
    mocks.getSupabaseClient.mockReturnValue({ from });

    const user = { id: "user_1", email: "phil@example.com" } as User;
    const result = await createRemoteHousehold(user, "Lawrence household");

    expect(result).toEqual({ householdId: "household_remote_1" });
    expect(householdInsert).toHaveBeenCalledWith({ name: "Lawrence household", owner_user_id: "user_1" });
    expect(memberInsert).toHaveBeenCalledWith({
      household_id: "household_remote_1",
      user_id: "user_1",
      role: "owner",
      display_name: "phil@example.com",
    });
  });
});
