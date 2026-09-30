-- public.waitlist: clients waiting for a slot, isolated by tenant.
begin;
select plan(9);

select has_table('public', 'waitlist', 'public.waitlist exists');
select has_column('public', 'waitlist', 'tenant_id', 'waitlist has tenant_id');
select has_column('public', 'waitlist', 'client_id', 'waitlist has client_id');
select has_column('public', 'waitlist', 'service_id', 'waitlist has service_id');
select has_column('public', 'waitlist', 'desired_date', 'waitlist has desired_date');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.waitlist'::regclass),
  'RLS is enabled on public.waitlist'
);

set local role authenticated;

-- ana, owner of Salão Bela Vista, adds a client to the waitlist
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok(
  $$ insert into public.waitlist (tenant_id, client_id, service_id, desired_date)
     values ('b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
             'd0000000-0000-0000-0000-000000000001', current_date + 3) $$,
  'a member adds a client to the waitlist of their tenant'
);

-- diogo, staff of Estúdio Alfama
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is_empty(
  $$ select 1 from public.waitlist where tenant_id = 'b0000000-0000-0000-0000-000000000001' $$,
  'members of another tenant cannot read the waitlist'
);
select throws_ok(
  $$ insert into public.waitlist (tenant_id, client_id, service_id, desired_date)
     values ('b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
             'd0000000-0000-0000-0000-000000000001', current_date + 3) $$,
  '42501',
  null,
  'members cannot write to the waitlist of another tenant'
);

select * from finish();
rollback;
