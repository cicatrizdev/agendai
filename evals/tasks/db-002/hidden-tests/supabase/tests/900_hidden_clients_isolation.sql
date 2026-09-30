-- Staff members must only read clients of their own tenant.
begin;
select plan(3);

set local role authenticated;

-- diogo, staff of Estúdio Alfama (Lisbon)
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is_empty(
  $$ select 1 from public.clients where tenant_id = 'b0000000-0000-0000-0000-000000000001' $$,
  'Lisbon staff cannot read São Paulo clients'
);
select isnt_empty(
  $$ select 1 from public.clients where tenant_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'Lisbon staff reads clients of their own tenant'
);

-- bruno, staff of Salão Bela Vista (São Paulo)
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is_empty(
  $$ select 1 from public.clients where tenant_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'São Paulo staff cannot read Lisbon clients'
);

select * from finish();
rollback;
