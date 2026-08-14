-- NLKH Google Drive backup.
-- Refresh token is encrypted by existing INTEGRATION_SECRETS_KEY before storage.

create table if not exists public.backup_settings(
  id text primary key default 'default' check(id='default'),
  destination_folder_url text not null default '',
  backup_mode text not null default 'database' check(backup_mode in('database','full')),
  enabled boolean not null default false,
  retention_days integer not null default 30 check(retention_days between 1 and 3650),
  refresh_token_ciphertext text,
  connected_email text,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.backup_settings(id)
values('default')
on conflict(id) do nothing;

create table if not exists public.backup_oauth_states(
  state text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  return_to text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.backup_runs(
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check(status in('running','completed','failed')),
  mode text not null default 'database' check(mode in('database','full')),
  drive_folder_id text,
  drive_r2_folder_id text,
  database_file_id text,
  manifest_file_id text,
  r2_cursor text,
  r2_uploaded integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.backup_run_items(
  run_id uuid not null references public.backup_runs(id) on delete cascade,
  object_key text not null,
  drive_file_id text not null,
  size_bytes bigint not null default 0,
  etag text,
  created_at timestamptz not null default now(),
  primary key(run_id,object_key)
);

alter table public.backup_settings enable row level security;
alter table public.backup_oauth_states enable row level security;
alter table public.backup_runs enable row level security;
alter table public.backup_run_items enable row level security;

drop policy if exists backup_settings_manage on public.backup_settings;
create policy backup_settings_manage on public.backup_settings
 for all to authenticated using(public.has_permission('api.manage')) with check(public.has_permission('api.manage'));

drop policy if exists backup_runs_manage on public.backup_runs;
create policy backup_runs_manage on public.backup_runs
 for all to authenticated using(public.has_permission('api.manage')) with check(public.has_permission('api.manage'));

drop policy if exists backup_run_items_manage on public.backup_run_items;
create policy backup_run_items_manage on public.backup_run_items
 for all to authenticated using(public.has_permission('api.manage')) with check(public.has_permission('api.manage'));

-- OAuth state is intentionally service-role only. No client policy.

alter table public.scheduled_api_jobs
  drop constraint if exists scheduled_api_jobs_handler_check;
alter table public.scheduled_api_jobs
  add constraint scheduled_api_jobs_handler_check
  check(handler in('integration','supabase_keepalive','website_backup')) not valid;
alter table public.scheduled_api_jobs
  validate constraint scheduled_api_jobs_handler_check;

insert into public.scheduled_api_jobs(name,handler,interval_minutes,enabled,next_run_at,request_payload)
select 'Google Drive website backup','website_backup',1440,false,now()+interval '1 day','{}'::jsonb
where not exists(select 1 from public.scheduled_api_jobs where handler='website_backup');