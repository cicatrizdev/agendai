-- Control room access: dev@autofix.test is a developer (a...05), lead@autofix.test a tech lead (a...06).
begin;
select plan(6);

insert into ops.runs (id, task_id, family, mode) values
  ('90000000-0000-0000-0000-000000000001', 'db-001', 'db', 'local'),
  ('90000000-0000-0000-0000-000000000002', 'bug-001', 'bug', 'local');
insert into ops.approvals (id, run_id, action, risk_level) values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'apply_migration', 'high'),
  ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', 'open_pull_request', 'low');
insert into ops.events (run_id, seq, type) values ('90000000-0000-0000-0000-000000000002', 1, 'run_started');

select throws_ok(
  $$ update ops.events set type = 'tampered' $$,
  'P0001',
  'ops.events is append-only',
  'events cannot be changed, even by the service role'
);

set local role authenticated;

-- A product user is not an operator
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is_empty('select 1 from ops.runs', 'product users cannot read the control room');

-- Developer
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select is(
  (select count(*)::int from ops.runs),
  2,
  'operators can read runs'
);
select is_empty(
  $$ update ops.approvals set decision = 'approved', decided_by = 'a0000000-0000-0000-0000-000000000005', decided_at = now()
     where id = '91000000-0000-0000-0000-000000000001' returning 1 $$,
  'a developer cannot approve a high-risk action'
);
select isnt_empty(
  $$ update ops.approvals set decision = 'approved', decided_by = 'a0000000-0000-0000-0000-000000000005', decided_at = now()
     where id = '91000000-0000-0000-0000-000000000002' returning 1 $$,
  'a developer can approve a low-risk action'
);

-- Tech lead
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select isnt_empty(
  $$ update ops.approvals set decision = 'approved', decided_by = 'a0000000-0000-0000-0000-000000000006', decided_at = now()
     where id = '91000000-0000-0000-0000-000000000001' returning 1 $$,
  'a tech lead can approve a high-risk action'
);

select * from finish();
rollback;
