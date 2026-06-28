import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";

export type AuthResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; reason: "not_configured" | "auth_error"; message: string };

export async function getCurrentSession(): Promise<AuthResult<Session | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, reason: "not_configured", message: "Supabase is not configured." };

  const { data, error } = await client.auth.getSession();
  if (error) return { ok: false, reason: "auth_error", message: error.message };
  return { ok: true, value: data.session };
}

export function listenForAuthChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const client = getSupabaseClient();
  if (!client) return { unsubscribe: () => undefined };
  const { data } = client.auth.onAuthStateChange(callback);
  return { unsubscribe: () => data.subscription.unsubscribe() };
}

export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, reason: "not_configured", message: "Supabase is not configured." };

  const { error } = await client.auth.signInWithOtp({ email });
  if (error) return { ok: false, reason: "auth_error", message: error.message };
  return { ok: true, value: undefined };
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult<Session | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, reason: "not_configured", message: "Supabase is not configured." };

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, reason: "auth_error", message: error.message };
  return { ok: true, value: data.session };
}

export async function signOut(): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, reason: "not_configured", message: "Supabase is not configured." };

  const { error } = await client.auth.signOut();
  if (error) return { ok: false, reason: "auth_error", message: error.message };
  return { ok: true, value: undefined };
}
