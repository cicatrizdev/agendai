-- AutoFix Agent Ops: the agent's control room, separated from the product schema.
-- The harness writes with OPS_SUPABASE_SERVICE_KEY; operators read through the console with RLS.

create schema ops;
grant usage on schema ops to authenticated, service_role;

create table ops.operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('developer', 'tech_lead')),
  created_at timestamptz not null default now()
);

create table ops.runs (
  id uuid primary key default gen_random_uuid(),
  task_id text not null,
  family text not null,
  mode text not null check (mode in ('local', 'github', 'replay')),
  status text not null default 'running'
    check (status in ('running', 'awaiting_approval', 'succeeded', 'failed', 'escalated', 'cancelled')),
  model_config jsonb not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome jsonb
);

-- Append-only event log of every run.
create table ops.events (
  id bigserial primary key,
  run_id uuid not null references ops.runs (id) on delete cascade,
  seq integer not null,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (run_id, seq)
);

create table ops.task_states (
  task_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table ops.eval_runs (
  id uuid primary key default gen_random_uuid(),
  suite text not null,
  git_sha text not null,
  git_tag text,
  harness_config jsonb not null default '{}',
  is_baseline boolean not null default false,
  started_at timestamptz not null default now()
);

create table ops.trials (
  id uuid primary key default gen_random_uuid(),
  eval_run_id uuid not null references ops.eval_runs (id) on delete cascade,
  task_id text not null,
  trial_index integer not null,
  run_id uuid references ops.runs (id) on delete set null,
  passed boolean not null,
  score numeric not null check (score between 0 and 1),
  cost_usd numeric not null default 0,
  iterations integer not null default 0,
  tokens integer not null default 0,
  unique (eval_run_id, task_id, trial_index)
);

create table ops.grades (
  trial_id uuid not null references ops.trials (id) on delete cascade,
  grader text not null,
  passed boolean not null,
  score numeric not null check (score between 0 and 1),
  notes text,
  primary key (trial_id, grader)
);

create table ops.approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ops.runs (id) on delete cascade,
  action text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  requested_at timestamptz not null default now(),
  decided_by uuid references auth.users (id),
  decision text check (decision in ('approved', 'rejected')),
  decided_at timestamptz,
  check ((decision is null) = (decided_at is null))
);

create table ops.annotations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ops.runs (id) on delete cascade,
  note text not null,
  category text,
  author uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index events_run_id_seq_idx on ops.events (run_id, seq);
create index trials_eval_run_id_idx on ops.trials (eval_run_id);
create index approvals_pending_idx on ops.approvals (requested_at) where decision is null;

-- ops.events is append-only, even for the service role.
create function ops.forbid_event_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ops.events is append-only';
end;
$$;

create trigger events_append_only
  before update or delete on ops.events
  for each row execute function ops.forbid_event_changes();

-- Role of the current user in the control room, or null when not an operator.
create function ops.operator_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select o.role from ops.operators o where o.user_id = (select auth.uid());
$$;

-- High-risk actions (family "db") require a tech lead; the rest accept any operator.
create function ops.can_decide(risk text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when risk = 'high' then ops.operator_role() = 'tech_lead'
    else ops.operator_role() is not null
  end;
$$;

alter table ops.operators enable row level security;
alter table ops.runs enable row level security;
alter table ops.events enable row level security;
alter table ops.task_states enable row level security;
alter table ops.eval_runs enable row level security;
alter table ops.trials enable row level security;
alter table ops.grades enable row level security;
alter table ops.approvals enable row level security;
alter table ops.annotations enable row level security;

create policy operators_read on ops.operators for select to authenticated using (ops.operator_role() is not null);
create policy runs_read on ops.runs for select to authenticated using (ops.operator_role() is not null);
create policy events_read on ops.events for select to authenticated using (ops.operator_role() is not null);
create policy task_states_read on ops.task_states for select to authenticated using (ops.operator_role() is not null);
create policy eval_runs_read on ops.eval_runs for select to authenticated using (ops.operator_role() is not null);
create policy trials_read on ops.trials for select to authenticated using (ops.operator_role() is not null);
create policy grades_read on ops.grades for select to authenticated using (ops.operator_role() is not null);
create policy approvals_read on ops.approvals for select to authenticated using (ops.operator_role() is not null);
create policy annotations_read on ops.annotations for select to authenticated using (ops.operator_role() is not null);

create policy approvals_decide on ops.approvals
  for update to authenticated
  using (decision is null and ops.can_decide(risk_level))
  with check (ops.can_decide(risk_level) and decided_by = (select auth.uid()));

create policy annotations_write on ops.annotations
  for insert to authenticated
  with check (ops.operator_role() is not null and author = (select auth.uid()));

grant select on all tables in schema ops to authenticated;
grant update (decision, decided_by, decided_at) on ops.approvals to authenticated;
grant insert on ops.annotations to authenticated;
grant all on all tables in schema ops to service_role;
grant usage, select on all sequences in schema ops to service_role;
grant execute on function ops.operator_role() to authenticated;
grant execute on function ops.can_decide(text) to authenticated;

alter publication supabase_realtime add table ops.events, ops.approvals, ops.runs;
