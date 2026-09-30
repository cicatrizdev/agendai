-- Isolation between the two seed tenants:
--   Salão Bela Vista (b...01): ana (owner, a...01), bruno (staff, a...02)
--   Estúdio Alfama   (b...02): carla (owner, a...03), diogo (staff, a...04)
begin;
select plan(14);

-- ana, owner of Bela Vista
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select results_eq(
  'select id from public.tenants',
  $$ values ('b0000000-0000-0000-0000-000000000001'::uuid) $$,
  'owner only sees their own tenant'
);
select is_empty(
  $$ select 1 from public.services where tenant_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'owner does not see services of another tenant'
);
select is_empty(
  $$ select 1 from public.bookings where tenant_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'owner does not see bookings of another tenant'
);
select is_empty(
  $$ select 1 from public.clients where tenant_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'owner does not see clients of another tenant'
);
select isnt_empty(
  $$ select 1 from public.clients where tenant_id = 'b0000000-0000-0000-0000-000000000001' $$,
  'owner sees clients of their tenant'
);
select throws_ok(
  $$ insert into public.services (tenant_id, name, duration_minutes, price_cents)
     values ('b0000000-0000-0000-0000-000000000002', 'Intruso', 30, 100) $$,
  '42501',
  null,
  'owner cannot create services in another tenant'
);
select lives_ok(
  $$ insert into public.services (tenant_id, name, duration_minutes, price_cents)
     values ('b0000000-0000-0000-0000-000000000001', 'Hidratação', 30, 5000) $$,
  'owner can create services in their tenant'
);

-- bruno, staff of Bela Vista
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.services (tenant_id, name, duration_minutes, price_cents)
     values ('b0000000-0000-0000-0000-000000000001', 'Sem permissão', 30, 100) $$,
  '42501',
  null,
  'staff cannot create services'
);
select lives_ok(
  $$ insert into public.clients (tenant_id, name) values ('b0000000-0000-0000-0000-000000000001', 'Cliente novo') $$,
  'staff can register a client in their tenant'
);
select throws_ok(
  $$ insert into public.clients (tenant_id, name) values ('b0000000-0000-0000-0000-000000000002', 'Cliente alheio') $$,
  '42501',
  null,
  'staff cannot register a client in another tenant'
);
select is_empty(
  $$ delete from public.clients where tenant_id = 'b0000000-0000-0000-0000-000000000001' returning 1 $$,
  'staff cannot delete clients'
);
select throws_ok(
  $$ insert into public.bookings (tenant_id, service_id, staff_member_id, client_id, starts_at, ends_at)
     values ('b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004',
             'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000007',
             '2030-01-07 10:00+00', '2030-01-07 11:00+00') $$,
  '42501',
  null,
  'staff cannot book in another tenant'
);
select is_empty(
  $$ select 1 from public.business_hours where tenant_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'staff does not see business hours of another tenant'
);

-- anonymous visitors see nothing
reset role;
set local role anon;
select is_empty('select 1 from public.bookings', 'anonymous users see no bookings');

select * from finish();
rollback;
