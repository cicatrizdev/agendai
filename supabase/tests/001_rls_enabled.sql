begin;
select plan(2);

select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'every table in public has RLS enabled'
);

select is(
  (select count(*)::int from pg_tables where schemaname = 'ops' and not rowsecurity),
  0,
  'every table in ops has RLS enabled'
);

select * from finish();
rollback;
