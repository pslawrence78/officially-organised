import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";
import type { RemoteSyncEntity } from "./syncTypes";

export interface RemoteHouseholdLink {
  householdId: string;
}

export async function listRemoteSyncEntities(householdId: string): Promise<RemoteSyncEntity[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("sync_entities").select("*").eq("household_id", householdId);
  if (error) throw new Error(error.message);
  return (data ?? []) as RemoteSyncEntity[];
}

export async function upsertRemoteSyncEntity(entity: RemoteSyncEntity) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("sync_entities").upsert(entity);
  if (error) throw new Error(error.message);
}

export async function createRemoteHousehold(user: User, name: string): Promise<RemoteHouseholdLink> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("households").insert({ name, owner_user_id: user.id }).select("id").single();
  if (error) throw new Error(error.message);
  const householdId = String(data.id);
  const membership = await client.from("household_members").insert({
    household_id: householdId,
    user_id: user.id,
    role: "owner",
    display_name: user.email ?? "Owner",
  });
  if (membership.error) throw new Error(membership.error.message);
  return { householdId };
}

export async function listLinkedHouseholdsForUser(userId: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => String(item.household_id));
}
