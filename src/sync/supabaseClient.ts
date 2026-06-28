import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EnvSource } from "./supabaseConfig";
import { getSupabaseAvailability as readSupabaseAvailability, getSupabaseConfig } from "./supabaseConfig";

let client: SupabaseClient | null = null;
let clientKey: string | null = null;

export function getSupabaseClient(env?: EnvSource): SupabaseClient | null {
  const config = getSupabaseConfig(env);
  if (!config) return null;

  const nextClientKey = `${config.url}:${config.publishableKey}`;
  if (!client || clientKey !== nextClientKey) {
    client = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    clientKey = nextClientKey;
  }

  return client;
}

export function isSupabaseAvailable(env?: EnvSource): boolean {
  return getSupabaseClient(env) !== null;
}

export function getSupabaseAvailability(env?: EnvSource) {
  return readSupabaseAvailability(env);
}

export function resetSupabaseClientForTests() {
  client = null;
  clientKey = null;
}
