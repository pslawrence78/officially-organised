import { describe, expect, it } from "vitest";
import { getSupabaseAvailability, getSupabaseClient, isSupabaseAvailable, resetSupabaseClientForTests } from "./supabaseClient";

describe("Supabase client wrapper", () => {
  it("does not create a client when configuration is missing", () => {
    resetSupabaseClientForTests();
    const env = {};

    expect(getSupabaseClient(env)).toBeNull();
    expect(isSupabaseAvailable(env)).toBe(false);
    expect(getSupabaseAvailability(env)).toMatchObject({ configured: false, status: "missing" });
  });
});
