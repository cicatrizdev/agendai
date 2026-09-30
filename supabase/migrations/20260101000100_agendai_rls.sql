-- Row Level Security for the product schema.
-- Rule of thumb: users only see rows of tenants where they have a membership.

create function public.is_member(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = target_tenant and m.user_id = (select auth.uid())
  );
$$;

create function public.is_owner(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = target_tenant and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.services enable row level security;
alter table public.staff_members enable row level security;
alter table public.clients enable row level security;
alter table public.business_hours enable row level security;
alter table public.bookings enable row level security;

-- tenants
create policy tenants_select on public.tenants
  for select to authenticated using (public.is_member(id));

-- memberships: each user sees their own memberships
create policy memberships_select_own on public.memberships
  for select to authenticated using (user_id = (select auth.uid()));

-- services, staff_members, business_hours: members read, owners write
create policy services_select on public.services
  for select to authenticated using (public.is_member(tenant_id));
create policy services_owner_write on public.services
  for all to authenticated using (public.is_owner(tenant_id)) with check (public.is_owner(tenant_id));

create policy staff_members_select on public.staff_members
  for select to authenticated using (public.is_member(tenant_id));
create policy staff_members_owner_write on public.staff_members
  for all to authenticated using (public.is_owner(tenant_id)) with check (public.is_owner(tenant_id));

create policy business_hours_select on public.business_hours
  for select to authenticated using (public.is_member(tenant_id));
create policy business_hours_owner_write on public.business_hours
  for all to authenticated using (public.is_owner(tenant_id)) with check (public.is_owner(tenant_id));

-- clients: owners manage everything; staff can read and register clients
create policy clients_owner_all on public.clients
  for all to authenticated using (public.is_owner(tenant_id)) with check (public.is_owner(tenant_id));

create policy clients_staff_select on public.clients
  for select to authenticated using (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.tenant_id = clients.tenant_id
        and m.role = 'staff'
    )
  );

create policy clients_staff_insert on public.clients
  for insert to authenticated with check (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.tenant_id = clients.tenant_id
        and m.role = 'staff'
    )
  );

-- bookings: members read, create and update; only owners may mark a no-show; nobody deletes
create policy bookings_select on public.bookings
  for select to authenticated using (public.is_member(tenant_id));

create policy bookings_insert on public.bookings
  for insert to authenticated with check (public.is_member(tenant_id) and status = 'confirmed');

create policy bookings_update on public.bookings
  for update to authenticated
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id) and (status <> 'no_show' or public.is_owner(tenant_id)));

grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.is_owner(uuid) to authenticated;
