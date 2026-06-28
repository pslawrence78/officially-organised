import { describe, expect, it } from "vitest";
import { getSupabaseAvailability, getSupabaseConfig, isSupabaseConfigured } from "./supabaseConfig";

describe("Supabase configuration", () => {
  it("reports missing configuration without throwing", () => {
    const env = {};

    expect(isSupabaseConfigured(env)).toBe(false);
    expect(getSupabaseConfig(env)).toBeNull();
    expect(getSupabaseAvailability(env)).toMatchObject({
      configured: false,
      status: "missing",
      label: "Not configured",
      missing: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
    });
  });

  it("rejects invalid public configuration", () => {
    const env = {
      VITE_SUPABASE_URL: "http://example.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    };

    expect(getSupabaseConfig(env)).toBeNull();
    expect(getSupabaseAvailability(env).status).toBe("invalid");
  });

  it("accepts a Supabase URL and publishable key", () => {
    const env = {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    };

    expect(getSupabaseConfig(env)).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key",
    });
    expect(isSupabaseConfigured(env)).toBe(true);
  });
});
