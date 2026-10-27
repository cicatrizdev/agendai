-- Agendaí seed: two tenants in different time zones, one owner and one staff each.
-- Every user's password is "agendai123".

-- Users --------------------------------------------------------------------
with seed_users (id, email) as (
  values
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'ana@belavista.test'),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'bruno@belavista.test'),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'carla@alfama.test'),
    ('a0000000-0000-0000-0000-000000000004'::uuid, 'diogo@alfama.test')
),
inserted as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
    extensions.crypt('agendai123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  from seed_users
  returning id, email
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from inserted;

-- Tenants and memberships --------------------------------------------------
insert into public.tenants (id, name, timezone) values
  ('b0000000-0000-0000-0000-000000000001', 'Salão Bela Vista', 'America/Sao_Paulo'),
  ('b0000000-0000-0000-0000-000000000002', 'Estúdio Alfama', 'Europe/Lisbon');

insert into public.memberships (user_id, tenant_id, role) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'owner'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'staff'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'owner'),
  ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'staff');

-- Catalog ------------------------------------------------------------------
insert into public.staff_members (id, tenant_id, display_name) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ana'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Bruno'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Carla'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Diogo');

insert into public.services (id, tenant_id, name, duration_minutes, price_cents) values
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Corte feminino', 60, 12000),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Escova', 45, 8000),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Manicure', 30, 4500),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Corte', 60, 3500),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Barba', 30, 1500),
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'Coloração', 90, 6000);

insert into public.clients (id, tenant_id, name, phone, email) values
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Beatriz Souza', '+55 11 91234-0001', 'beatriz@example.com'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Camila Rocha', '+55 11 91234-0002', null),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Daniel Lima', '+55 11 91234-0003', 'daniel@example.com'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Eduarda Alves', null, 'eduarda@example.com'),
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Felipe Costa', '+55 11 91234-0005', null),
  ('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Gabriela Nunes', '+55 11 91234-0006', null),
  ('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'Rita Fonseca', '+351 912 000 001', 'rita@example.pt'),
  ('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002', 'Tiago Matos', '+351 912 000 002', null),
  ('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000002', 'Inês Carvalho', null, 'ines@example.pt'),
  ('e0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'Nuno Pires', '+351 912 000 004', null),
  ('e0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'Marta Leal', '+351 912 000 005', null),
  ('e0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'João Serra', '+351 912 000 006', 'joao@example.pt');

-- São Paulo: Mon–Fri 09:00–18:00, Sat 09:00–13:00. Lisbon: Mon–Fri 10:00–19:00.
insert into public.business_hours (tenant_id, weekday, opens_at, closes_at)
select 'b0000000-0000-0000-0000-000000000001'::uuid, d, '09:00'::time, '18:00'::time from generate_series(1, 5) d
union all
select 'b0000000-0000-0000-0000-000000000001'::uuid, 6, '09:00'::time, '13:00'::time
union all
select 'b0000000-0000-0000-0000-000000000002'::uuid, d, '10:00'::time, '19:00'::time from generate_series(1, 5) d;

-- Bookings -----------------------------------------------------------------
-- From 5 days ago to 10 days ahead, four fixed local times per staff member.
-- Some are cancelled, so availability and pagination have something to chew on.
with staff as (
  select s.id as staff_member_id, s.tenant_id, t.timezone,
         row_number() over (partition by s.tenant_id order by s.id) as staff_index
  from public.staff_members s
  join public.tenants t on t.id = s.tenant_id
),
tenant_services as (
  select tenant_id, array_agg(id order by id) as ids, array_agg(duration_minutes order by id) as durations
  from public.services group by tenant_id
),
tenant_clients as (
  select tenant_id, array_agg(id order by id) as ids from public.clients group by tenant_id
),
candidates as (
  select
    staff.staff_member_id,
    staff.tenant_id,
    (current_date + day_offset) as local_date,
    slot.local_time,
    ts.ids[1 + (day_offset + slot.slot_index + staff.staff_index)::int % 3] as service_id,
    ts.durations[1 + (day_offset + slot.slot_index + staff.staff_index)::int % 3] as duration_minutes,
    tc.ids[1 + abs(day_offset * 4 + slot.slot_index + staff.staff_index::int) % 6] as client_id,
    staff.timezone,
    (day_offset + slot.slot_index + staff.staff_index) % 7 = 0 as is_cancelled
  from staff
  cross join generate_series(-5, 10) as day_offset
  cross join (values ('10:00'::time, 0), ('11:30'::time, 1), ('14:00'::time, 2), ('16:00'::time, 3)) as slot (local_time, slot_index)
  join tenant_services ts on ts.tenant_id = staff.tenant_id
  join tenant_clients tc on tc.tenant_id = staff.tenant_id
),
open_candidates as (
  select c.*
  from candidates c
  join public.business_hours bh
    on bh.tenant_id = c.tenant_id
   and bh.weekday = extract(dow from c.local_date)
   and c.local_time >= bh.opens_at
   and c.local_time + make_interval(mins => c.duration_minutes) <= bh.closes_at
)
insert into public.bookings (id, tenant_id, service_id, staff_member_id, client_id, starts_at, ends_at, status)
select
  ('f0000000-0000-0000-0000-' || lpad(row_number() over (order by local_date, local_time, staff_member_id)::text, 12, '0'))::uuid,
  tenant_id,
  service_id,
  staff_member_id,
  client_id,
  (local_date + local_time) at time zone timezone,
  (local_date + local_time + make_interval(mins => duration_minutes)) at time zone timezone,
  case when is_cancelled then 'cancelled' else 'confirmed' end
from open_candidates;
