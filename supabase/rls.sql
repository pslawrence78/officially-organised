-- Row-level security policies for Officially Organised sync foundation.
-- The app requires a signed-in Supabase Auth user for cloud sync. Do not grant
-- Officially Organised sync table access to anon.
--
-- Bootstrap path:
-- 1. User signs in through Supabase Auth.
-- 2. User inserts public.households with owner_user_id = auth.uid().
-- 3. User inserts their own public.household_members row with role = owner.
-- 4. User can then read/write public.sync_entities for that household through RLS.

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.households to authenticated;
grant select, insert, update, delete on table public.household_members to authenticated;
grant select, insert, update, delete on table public.sync_entities to authenticated;
grant select, insert on table public.sync_audit to authenticated;

revoke all on table public.households from anon;
revoke all on table public.household_members from anon;
revoke all on table public.sync_entities from anon;
revoke all on table public.sync_audit from anon;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.sync_entities enable row level security;
alter table public.sync_audit enable row level security;

drop policy if exists "members can select households" on public.households;
drop policy if exists "owners can update households" on public.households;
drop policy if exists "owners can delete households" on public.households;
drop policy if exists "users can create owned households" on public.households;
drop policy if exists "members can select household members" on public.household_members;
drop policy if exists "owners can insert household members" on public.household_members;
drop policy if exists "owners can update household members" on public.household_members;
drop policy if exists "owners can delete household members" on public.household_members;
drop policy if exists "members can select sync entities" on public.sync_entities;
drop policy if exists "adults can insert sync entities" on public.sync_entities;
drop policy if exists "adults can update sync entities" on public.sync_entities;
drop policy if exists "adults can delete sync entities" on public.sync_entities;
drop policy if exists "members can select sync audit" on public.sync_audit;
drop policy if exists "members can insert sync audit" on public.sync_audit;

drop function if exists public.is_household_member(uuid);
drop function if exists public.has_household_role(uuid, text[]);

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

-- SECURITY DEFINER helpers live outside the exposed public schema. They avoid
-- recursive RLS evaluation when policies need to check membership in
-- household_members, especially policies on household_members itself.
create or replace function private.oo_is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

create or replace function private.oo_is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.households
    where id = target_household_id
      and owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function private.oo_can_write_household(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.households
    where id = target_household_id
      and owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = auth.uid()
      and role in ('owner', 'adult')
  );
$$;

revoke all on function private.oo_is_household_member(uuid) from public;
revoke all on function private.oo_is_household_member(uuid) from anon;
revoke all on function private.oo_is_household_owner(uuid) from public;
revoke all on function private.oo_is_household_owner(uuid) from anon;
revoke all on function private.oo_can_write_household(uuid) from public;
revoke all on function private.oo_can_write_household(uuid) from anon;
grant execute on function private.oo_is_household_member(uuid) to authenticated;
grant execute on function private.oo_is_household_owner(uuid) to authenticated;
grant execute on function private.oo_can_write_household(uuid) to authenticated;

-- Households: users can create their own owned household, read it as owner or
-- member, and update/delete it only as owner.
create policy "users can create owned households"
on public.households
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy "members can select households"
on public.households
for select
to authenticated
using (owner_user_id = auth.uid() or private.oo_is_household_member(id));

create policy "owners can update households"
on public.households
for update
to authenticated
using (private.oo_is_household_owner(id))
with check (private.oo_is_household_owner(id));

create policy "owners can delete households"
on public.households
for delete
to authenticated
using (private.oo_is_household_owner(id));

-- Household members: policies avoid direct self-queries from the policy body.
-- The owner_user_id bootstrap lets a just-created household owner insert their
-- own owner membership row before membership exists.
create policy "members can select household members"
on public.household_members
for select
to authenticated
using (user_id = auth.uid() or private.oo_is_household_member(household_id));

create policy "owners can insert household members"
on public.household_members
for insert
to authenticated
with check (private.oo_is_household_owner(household_id));

create policy "owners can update household members"
on public.household_members
for update
to authenticated
using (private.oo_is_household_owner(household_id))
with check (private.oo_is_household_owner(household_id));

create policy "owners can delete household members"
on public.household_members
for delete
to authenticated
using (private.oo_is_household_owner(household_id));

-- Sync envelopes: members can read; owners and adults can write.
create policy "members can select sync entities"
on public.sync_entities
for select
to authenticated
using (private.oo_is_household_member(household_id));

create policy "adults can insert sync entities"
on public.sync_entities
for insert
to authenticated
with check (private.oo_can_write_household(household_id));

create policy "adults can update sync entities"
on public.sync_entities
for update
to authenticated
using (private.oo_can_write_household(household_id))
with check (private.oo_can_write_household(household_id));

create policy "adults can delete sync entities"
on public.sync_entities
for delete
to authenticated
using (private.oo_can_write_household(household_id));

-- Audit rows stay scoped to household members. If supplied, actor_user_id must
-- be the current authenticated user.
create policy "members can select sync audit"
on public.sync_audit
for select
to authenticated
using (private.oo_is_household_member(household_id));

create policy "members can insert sync audit"
on public.sync_audit
for insert
to authenticated
with check (
  private.oo_is_household_member(household_id)
  and (actor_user_id is null or actor_user_id = auth.uid())
);
