-- Agendaí: multi-tenant scheduling for small businesses.

create extension if not exists btree_gist with schema extensions;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  primary key (user_id, tenant_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  unique (id, tenant_id)
);

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  display_name text not null,
  active boolean not null default true,
  unique (id, tenant_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  unique (id, tenant_id)
);

-- Opening hours in the tenant's local time.
create table public.business_hours (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  primary key (tenant_id, weekday),
  check (opens_at < closes_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  service_id uuid not null,
  staff_member_id uuid not null,
  client_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Composite keys guarantee that every reference belongs to the same tenant.
  foreign key (service_id, tenant_id) references public.services (id, tenant_id),
  foreign key (staff_member_id, tenant_id) references public.staff_members (id, tenant_id),
  foreign key (client_id, tenant_id) references public.clients (id, tenant_id),
  -- Half-open ranges: ending at 10:00 and starting at 10:00 is not a conflict.
  constraint bookings_no_overlap exclude using gist (
    staff_member_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmed')
);

create index bookings_tenant_starts_at_id_idx on public.bookings (tenant_id, starts_at, id);
create index memberships_tenant_id_idx on public.memberships (tenant_id);
