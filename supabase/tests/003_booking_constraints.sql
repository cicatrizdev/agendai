begin;
select plan(4);

insert into public.bookings (id, tenant_id, service_id, staff_member_id, client_id, starts_at, ends_at)
values ('f9999999-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
        'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003',
        'e0000000-0000-0000-0000-000000000007', '2030-01-07 10:00+00', '2030-01-07 11:00+00');

select throws_ok(
  $$ insert into public.bookings (tenant_id, service_id, staff_member_id, client_id, starts_at, ends_at)
     values ('b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004',
             'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000008',
             '2030-01-07 10:30+00', '2030-01-07 11:30+00') $$,
  '23P01',
  null,
  'overlapping confirmed bookings of the same staff member are rejected'
);

update public.bookings set status = 'cancelled' where id = 'f9999999-0000-0000-0000-000000000001';

select lives_ok(
  $$ insert into public.bookings (tenant_id, service_id, staff_member_id, client_id, starts_at, ends_at)
     values ('b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004',
             'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000008',
             '2030-01-07 10:30+00', '2030-01-07 11:30+00') $$,
  'cancelled bookings do not block the slot'
);

select throws_ok(
  $$ insert into public.bookings (tenant_id, service_id, staff_member_id, client_id, starts_at, ends_at)
     values ('b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
             'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000008',
             '2030-01-08 10:30+00', '2030-01-08 11:30+00') $$,
  '23503',
  null,
  'a booking cannot use a service from another tenant'
);

select throws_ok(
  $$ insert into public.bookings (tenant_id, service_id, staff_member_id, client_id, starts_at, ends_at)
     values ('b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004',
             'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000008',
             '2030-01-08 11:00+00', '2030-01-08 10:00+00') $$,
  '23514',
  null,
  'a booking must end after it starts'
);

select * from finish();
rollback;
