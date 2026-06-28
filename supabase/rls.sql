-- Row-level security policies for Officially Organised sync foundation.
-- Authenticated users can only access households where they are members.

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.sync_entities enable row level security;
alter table public.sync_audit enable row level security;

create or replace function public.is_household_member(target_household_id uuid)
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

create or replace function public.has_household_role(target_household_id uuid, allowed_roles text[])
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
      and role = any(allowed_roles)
  );
$$;

-- Household members can read household metadata.
drop policy if exists "members can select households" on public.households;
create policy "members can select households"
on public.households
for select
to authenticated
using (public.is_household_member(id));

-- Owners can update household metadata.
drop policy if exists "owners can update households" on public.households;
create policy "owners can update households"
on public.households
for update
to authenticated
using (public.has_household_role(id, array['owner']))
with check (public.has_household_role(id, array['owner']));

-- Authenticated users may create their first owned household for manual setup.
drop policy if exists "users can create owned households" on public.households;
create policy "users can create owned households"
on public.households
for insert
to authenticated
with check (owner_user_id = auth.uid());

-- Members can read the membership list for households they belong to.
drop policy if exists "members can select household members" on public.household_members;
create policy "members can select household members"
on public.household_members
for select
to authenticated
using (public.is_household_member(household_id));

-- Owners can manage household membership.
drop policy if exists "owners can insert household members" on public.household_members;
create policy "owners can insert household members"
on public.household_members
for insert
to authenticated
with check (public.has_household_role(household_id, array['owner']));

drop policy if exists "owners can update household members" on public.household_members;
create policy "owners can update household members"
on public.household_members
for update
to authenticated
using (public.has_household_role(household_id, array['owner']))
with check (public.has_household_role(household_id, array['owner']));

drop policy if exists "owners can delete household members" on public.household_members;
create policy "owners can delete household members"
on public.household_members
for delete
to authenticated
using (public.has_household_role(household_id, array['owner']));

-- Members can read sync envelopes for their household.
drop policy if exists "members can select sync entities" on public.sync_entities;
create policy "members can select sync entities"
on public.sync_entities
for select
to authenticated
using (public.is_household_member(household_id));

-- Adults and owners can write sync envelopes for their household.
drop policy if exists "adults can insert sync entities" on public.sync_entities;
create policy "adults can insert sync entities"
on public.sync_entities
for insert
to authenticated
with check (public.has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "adults can update sync entities" on public.sync_entities;
create policy "adults can update sync entities"
on public.sync_entities
for update
to authenticated
using (public.has_household_role(household_id, array['owner', 'adult']))
with check (public.has_household_role(household_id, array['owner', 'adult']));

-- Members can read and write audit rows only inside their household.
drop policy if exists "members can select sync audit" on public.sync_audit;
create policy "members can select sync audit"
on public.sync_audit
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "members can insert sync audit" on public.sync_audit;
create policy "members can insert sync audit"
on public.sync_audit
for insert
to authenticated
with check (
  public.is_household_member(household_id)
  and actor_user_id = auth.uid()
);
