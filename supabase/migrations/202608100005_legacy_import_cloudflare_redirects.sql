-- NLKH V4.6: nhập dữ liệu legacy + redirect đa miền đồng bộ Cloudflare.

alter table public.redirects
  add column if not exists source_host text not null default 'nguyenlekhanhhoa.com',
  add column if not exists include_subdomains boolean not null default false,
  add column if not exists subpath_matching boolean not null default false,
  add column if not exists preserve_path_suffix boolean not null default false,
  add column if not exists cloudflare_synced_at timestamptz,
  add column if not exists cloudflare_error text;

update public.redirects
set source_host='nguyenlekhanhhoa.com'
where source_host is null or btrim(source_host)='';

alter table public.redirects drop constraint if exists redirects_source_path_key;
drop index if exists redirects_source_path_key;
create unique index if not exists redirects_source_host_path_uq
  on public.redirects (lower(source_host), source_path);

-- Chuẩn hóa path để Admin/Cloudflare dùng ổn định.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='redirects_source_path_check') then
    alter table public.redirects add constraint redirects_source_path_check
      check (left(source_path,1)='/' and position('..' in source_path)=0);
  end if;
end $$;

-- Nhật ký nhập dữ liệu cũ để biết lần nào đã chạy, không chứa mật khẩu legacy.
create table if not exists public.legacy_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_repo text not null default 'koha2002/NLKH_KOHA',
  status text not null default 'completed' check (status in ('completed','partial','failed')),
  report jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.legacy_import_runs enable row level security;
drop policy if exists legacy_import_runs_read on public.legacy_import_runs;
drop policy if exists legacy_import_runs_manage on public.legacy_import_runs;
create policy legacy_import_runs_read on public.legacy_import_runs for select to authenticated
  using (public.has_permission('site.manage'));
create policy legacy_import_runs_manage on public.legacy_import_runs for all to authenticated
  using (public.has_permission('site.manage')) with check (public.has_permission('site.manage'));
