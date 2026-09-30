-- Bookings accept the "no_show" status, and only owners may set it.
begin;
select plan(3);

create temporary table target on commit drop as
  select id from public.bookings
  where tenant_id = 'b0000000-0000-0000-0000-000000000001' and status = 'confirmed'
  order by starts_at limit 1;
grant select on target to authenticated;

set local role authenticated;

-- bruno, staff of Salão Bela Vista
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select throws_ok(
  $$ update public.bookings set status = 'no_show' where id = (select id from target) $$,
  '42501',
  null,
  'staff cannot mark a no-show'
);

-- ana, owner of Salão Bela Vista
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok(
  $$ update public.bookings set status = 'no_show' where id = (select id from target) $$,
  'owner can mark a no-show'
);

reset role;
select is(
  (select status from public.bookings where id = (select id from target)),
  'no_show',
  'the booking is stored as no_show'
);

select * from finish();
rollback;
