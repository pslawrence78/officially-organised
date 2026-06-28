-- Officially Organised Tranche 8A sync foundation.
-- Run manually in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'adult', 'viewer')),
  display_name text,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.sync_entities (
  household_id uuid not null references public.households(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null,
  payload_hash text,
  schema_version text not null,
  client_updated_at timestamptz,
  server_updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  updated_by uuid references auth.users(id),
  primary key (household_id, entity_type, entity_id)
);

create table if not exists public.sync_audit (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists sync_entities_household_type_idx on public.sync_entities(household_id, entity_type);
create index if not exists sync_audit_household_created_idx on public.sync_audit(household_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

create or replace function public.set_sync_entity_server_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.server_updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists sync_entities_set_server_updated_at on public.sync_entities;
create trigger sync_entities_set_server_updated_at
before insert or update on public.sync_entities
for each row execute function public.set_sync_entity_server_updated_at();
