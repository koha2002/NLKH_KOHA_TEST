-- NLKH V2: catalog performance/access + visitor presence.

create table if not exists public.tool_categories(
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_vi text not null,
  name_en text not null default '',
  description_vi text not null default '',
  description_en text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tools
  add column if not exists category_id uuid references public.tool_categories(id) on delete set null;

create index if not exists tools_category_sort_idx
  on public.tools(category_id,sort_order);

alter table public.tool_categories enable row level security;
drop policy if exists tool_categories_public_read on public.tool_categories;
create policy tool_categories_public_read on public.tool_categories
  for select using(visible or public.has_permission('tools.manage'));
drop policy if exists tool_categories_manage on public.tool_categories;
create policy tool_categories_manage on public.tool_categories
  for all to authenticated
  using(public.has_permission('tools.manage'))
  with check(public.has_permission('tools.manage'));

alter table public.software_items
  add column if not exists download_allowed_roles text[] not null default '{}';

comment on column public.software_items.download_allowed_roles is
  'Empty = every ACTIVE authenticated account. Non-empty = only these role_id values.';

create table if not exists public.site_presence(
  visitor_id uuid primary key,
  user_id uuid references public.profiles(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  current_path text not null default '/',
  page_views bigint not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists site_presence_last_seen_idx
  on public.site_presence(last_seen_at desc);
create index if not exists site_presence_user_idx
  on public.site_presence(user_id,last_seen_at desc);

alter table public.site_presence enable row level security;
drop policy if exists site_presence_admin_manage on public.site_presence;
create policy site_presence_admin_manage on public.site_presence
  for all to authenticated
  using(public.has_permission('users.manage'))
  with check(public.has_permission('users.manage'));

create or replace function public.touch_site_presence(
  p_visitor_id uuid,
  p_path text
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid;
  v_path text;
begin
  if p_visitor_id is null then return; end if;
  v_path := left(coalesce(nullif(trim(p_path),''),'/'),300);

  select p.id into v_user
  from public.profiles p
  where p.id=auth.uid()
  limit 1;

  insert into public.site_presence(
    visitor_id,user_id,first_seen_at,last_seen_at,current_path,page_views,updated_at
  )
  values(
    p_visitor_id,v_user,now(),now(),v_path,1,now()
  )
  on conflict(visitor_id) do update set
    user_id=coalesce(excluded.user_id,public.site_presence.user_id),
    last_seen_at=now(),
    current_path=excluded.current_path,
    page_views=public.site_presence.page_views+1,
    updated_at=now();
end;
$$;

revoke all on function public.touch_site_presence(uuid,text) from public;
grant execute on function public.touch_site_presence(uuid,text) to anon,authenticated;