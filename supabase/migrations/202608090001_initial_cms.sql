-- NLKH Portal CMS - schema khởi tạo
-- Chạy trong Supabase SQL Editor hoặc bằng Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.roles (
  id text primary key,
  name text not null,
  permissions text[] not null default '{}',
  description text not null default '',
  created_at timestamptz not null default now()
);

insert into public.roles (id, name, permissions, description) values
  ('owner', 'Chủ sở hữu', array['*'], 'Toàn quyền hệ thống'),
  ('admin', 'Quản trị viên', array['site.manage','content.manage','news.manage','tools.manage','software.manage','data.manage','media.manage','seo.manage','users.manage','api.manage'], 'Quản trị gần như toàn bộ website'),
  ('editor', 'Biên tập viên', array['content.manage','news.manage','media.manage','seo.manage'], 'Biên tập nội dung và SEO'),
  ('news_editor', 'Biên tập tin tức', array['news.manage','media.manage'], 'Viết và xuất bản tin tức'),
  ('software_manager', 'Quản lý phần mềm', array['software.manage','media.manage'], 'Quản lý kho phần mềm'),
  ('data_manager', 'Quản lý dữ liệu', array['data.manage','media.manage'], 'Quản lý nhóm và tài liệu'),
  ('member', 'Thành viên', array[]::text[], 'Tài khoản người dùng thông thường')
on conflict (id) do update set
  name = excluded.name,
  permissions = excluded.permissions,
  description = excluded.description;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  role_id text not null default 'member' references public.roles(id),
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role_id from public.profiles where id = auth.uid();
$$;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and p.status = 'active'
      and ('*' = any(r.permissions) or permission_name = any(r.permissions))
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role_id, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    case when lower(coalesce(new.email, '')) = 'khanhhoa2002.hh@gmail.com' then 'owner' else 'member' end,
    case when lower(coalesce(new.email, '')) = 'khanhhoa2002.hh@gmail.com' then 'active' else 'pending' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'Nguyễn Lê Khánh Hòa',
  site_url text not null default 'https://nguyenlekhanhhoa.com',
  default_title_vi text not null default 'Nguyễn Lê Khánh Hòa | Kỹ sư điện',
  default_title_en text not null default 'Nguyen Le Khanh Hoa | Electrical Engineer',
  title_template text not null default '%s | Nguyễn Lê Khánh Hòa',
  description_vi text not null default '',
  description_en text not null default '',
  default_og_image text,
  contact_email text not null default 'khanhhoa2002.hh@gmail.com',
  footer_intro_vi text not null default '',
  footer_intro_en text not null default '',
  copyright_text text not null default '© 2025 Nguyễn Lê Khánh Hòa',
  news_enabled boolean not null default true,
  registration_enabled boolean not null default true,
  maintenance_mode boolean not null default false,
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (
  site_name, site_url, description_vi, description_en, footer_intro_vi, footer_intro_en
)
select
  'Nguyễn Lê Khánh Hòa',
  'https://nguyenlekhanhhoa.com',
  'Website cá nhân của Nguyễn Lê Khánh Hòa - kỹ sư điện, sản phẩm số và công cụ làm việc.',
  'The personal website of Nguyen Le Khanh Hoa - electrical engineer and digital product builder.',
  'Kỹ sư điện, người xây dựng các công cụ số phục vụ công việc và học tập.',
  'Electrical engineer building practical digital tools for work and learning.'
where not exists (select 1 from public.site_settings);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label_vi text not null,
  label_en text not null,
  href text not null,
  location text not null default 'header' check (location in ('header','footer','both')),
  parent_id uuid references public.navigation_items(id) on delete set null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  requires_auth boolean not null default false,
  allowed_roles text[] not null default '{}',
  open_new_tab boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.navigation_items (label_vi, label_en, href, location, sort_order)
select * from (values
  ('Trang chủ','Home','/','both',10),
  ('Hồ sơ','Profile','/cv','both',20),
  ('Công cụ','Tools','/tools','both',30),
  ('Phần mềm','Software','/software','both',40),
  ('Dữ liệu','Data','/data','both',50),
  ('Tin tức','News','/news','both',60)
) as seed(label_vi,label_en,href,location,sort_order)
where not exists (select 1 from public.navigation_items);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null,
  url text not null,
  icon text,
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.social_links (platform,label,url,sort_order)
select * from (values
  ('email','Email','mailto:khanhhoa2002.hh@gmail.com',10),
  ('facebook','Facebook','https://www.facebook.com/koha2002/',20),
  ('youtube','YouTube','https://www.youtube.com/channel/UCH-j549S-5EHFTchh0deQmQ',30),
  ('instagram','Instagram','https://www.instagram.com/koha__2002/',40),
  ('linkedin','LinkedIn','https://www.linkedin.com/in/koha2002/',50),
  ('tiktok','TikTok','https://www.tiktok.com/@koha_2002',60)
) as seed(platform,label,url,sort_order)
where not exists (select 1 from public.social_links);

create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_vi text not null,
  title_en text not null default '',
  excerpt_vi text not null default '',
  excerpt_en text not null default '',
  content_vi text not null default '',
  content_en text not null default '',
  template text not null default 'standard',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  requires_auth boolean not null default false,
  allowed_roles text[] not null default '{}',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Các khối nội dung nhỏ (hero, thống kê, CTA...) có thể sửa từ Admin mà không đổi JSX.
create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  block_key text not null,
  label text not null default '',
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(page_key, block_key)
);

insert into public.content_blocks (page_key,block_key,label,content,sort_order)
values
  ('home','hero','Trang chủ / Hero','{"badge_vi":"KỸ SƯ ĐIỆN · PRODUCT BUILDER","badge_en":"ELECTRICAL ENGINEER · PRODUCT BUILDER","hello_vi":"Xin chào, tôi là","hello_en":"Hello, I am","name_vi":"Nguyễn Lê Khánh Hòa","name_en":"Nguyen Le Khanh Hoa","primary_label_vi":"Xem hồ sơ năng lực","primary_label_en":"View profile","primary_href":"/cv","secondary_label_vi":"Khám phá công cụ","secondary_label_en":"Explore tools","secondary_href":"#workspace"}'::jsonb,10),
  ('home','facts','Trang chủ / Thông tin nhanh','{"education_period":"2020—2025","education_vi":"Kỹ sư hệ thống điện","education_en":"Power systems engineer","education_sub_vi":"Đại học Điện lực · Tốt nghiệp loại Giỏi","education_sub_en":"Electric Power University · Honors","experience_period":"04+ YEARS","experience_vi":"Kinh nghiệm thực tế","experience_en":"Practical experience","experience_sub_vi":"Thí nghiệm điện · Thiết kế · Chuẩn bị dự án","experience_sub_en":"Electrical testing · Design · Project preparation"}'::jsonb,20),
  ('home','capabilities','Trang chủ / Năng lực','{}'::jsonb,30),
  ('home','workspace','Trang chủ / Không gian làm việc','{}'::jsonb,40)
on conflict (page_key,block_key) do nothing;

create table if not exists public.seo_entries (
  id uuid primary key default gen_random_uuid(),
  route text unique not null,
  title_vi text not null default '',
  title_en text not null default '',
  description_vi text not null default '',
  description_en text not null default '',
  canonical_path text,
  og_image text,
  og_type text not null default 'website',
  indexable boolean not null default true,
  follow_links boolean not null default true,
  schema_type text not null default 'WebPage',
  structured_data jsonb not null default '{}'::jsonb,
  change_frequency text not null default 'weekly',
  priority numeric(2,1) not null default 0.7,
  updated_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  code text not null,
  route text unique not null,
  title_vi text not null,
  title_en text not null,
  description_vi text not null default '',
  description_en text not null default '',
  icon text,
  accent text not null default 'blue',
  status text not null default 'ready',
  visible boolean not null default true,
  show_home boolean not null default true,
  show_orbit boolean not null default true,
  orbit_ring integer not null default 1,
  orbit_angle integer not null default 0,
  sort_order integer not null default 0,
  requires_auth boolean not null default false,
  allowed_roles text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.orbit_rings (
  id text primary key,
  size integer not null check (size between 20 and 120),
  duration integer not null check (duration between 5 and 180),
  reverse boolean not null default false,
  dashed boolean not null default false,
  dot_angle integer,
  dot_tone text not null default 'blue',
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.orbit_rings (id,size,duration,reverse,dashed,dot_angle,dot_tone,sort_order)
values
  ('ring-1',98,42,false,true,166,'blue',10),
  ('ring-2',82,34,true,false,22,'orange',20),
  ('ring-3',66,28,false,false,205,'cyan',30),
  ('ring-4',51,22,true,true,318,'violet',40),
  ('ring-5',39,17,false,false,null,'blue',50)
on conflict (id) do nothing;

insert into public.tools (slug,code,route,title_vi,title_en,description_vi,description_en,icon,accent,orbit_ring,orbit_angle,sort_order)
select * from (values
  ('quiz','QUIZ','/tools/quiz','Ôn thi & tạo đề','Quiz & exam practice','Tạo, nhập, chỉnh sửa và luyện đề ngay trên trình duyệt.','Create, import, edit and practise quizzes in the browser.','quiz','cyan',1,222,10),
  ('pdf','PDF','/tools/pdf','PDF Studio','PDF Studio','Xử lý PDF cục bộ, ưu tiên riêng tư.','Local-first PDF processing.','pdf','blue',2,326,20),
  ('comtrade','CFG','/tools/comtrade','COMTRADE','COMTRADE','Đọc CFG/DAT và biểu diễn kênh analog, digital.','Read CFG/DAT and plot analog and digital channels.','comtrade','violet',3,198,30)
) as seed(slug,code,route,title_vi,title_en,description_vi,description_en,icon,accent,orbit_ring,orbit_angle,sort_order)
where not exists (select 1 from public.tools);

create table if not exists public.news_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_vi text not null,
  name_en text not null default '',
  description_vi text not null default '',
  description_en text not null default '',
  color text not null default 'blue',
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid references public.news_categories(id) on delete set null,
  title_vi text not null,
  title_en text not null default '',
  subtitle_vi text not null default '',
  subtitle_en text not null default '',
  excerpt_vi text not null default '',
  excerpt_en text not null default '',
  content_vi text not null default '',
  content_en text not null default '',
  cover_image text,
  cover_alt_vi text not null default '',
  cover_alt_en text not null default '',
  author_name text not null,
  translator_name text,
  editor_name text,
  source_name text,
  source_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','review','scheduled','published','archived')),
  featured boolean not null default false,
  allow_comments boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.software_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_vi text not null,
  name_en text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.software_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category_id uuid references public.software_categories(id) on delete set null,
  description_vi text not null default '',
  description_en text not null default '',
  icon_url text,
  cover_url text,
  download_url text not null,
  price_label_vi text not null default 'Miễn phí',
  price_label_en text not null default 'Free',
  version text,
  compatibility text,
  visible boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.data_collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_vi text not null,
  name_en text not null default '',
  description_vi text not null default '',
  description_en text not null default '',
  icon text,
  visibility text not null default 'private' check (visibility in ('public','authenticated','private')),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.data_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.data_collections(id) on delete cascade,
  title_vi text not null,
  title_en text not null default '',
  description_vi text not null default '',
  description_en text not null default '',
  item_type text not null default 'link' check (item_type in ('link','r2_file','quiz_json','document','video')),
  external_url text,
  object_key text,
  media_id uuid,
  visibility text not null default 'private' check (visibility in ('public','authenticated','private')),
  sort_order integer not null default 0,
  visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_data_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.data_items(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.cv_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_vi text not null default '',
  role_en text not null default '',
  headline_vi text not null default '',
  headline_en text not null default '',
  summary_vi text not null default '',
  summary_en text not null default '',
  birth_date text,
  address_vi text not null default '',
  address_en text not null default '',
  phone text,
  email text,
  photo_url text,
  pdf_url text,
  theme jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.cv_sections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.cv_profiles(id) on delete cascade,
  section_type text not null check (section_type in ('experience','education','certificate','skill','project','language','custom')),
  title_vi text not null,
  title_en text not null default '',
  subtitle_vi text not null default '',
  subtitle_en text not null default '',
  period text not null default '',
  description_vi text not null default '',
  description_en text not null default '',
  organization text not null default '',
  url text,
  sort_order integer not null default 0,
  visible boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  object_key text unique not null,
  public_url text,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  title text not null default '',
  alt_vi text not null default '',
  alt_en text not null default '',
  folder text not null default 'uploads',
  visibility text not null default 'public' check (visibility in ('public','authenticated','private')),
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.data_items
  drop constraint if exists data_items_media_id_fkey;
alter table public.data_items
  add constraint data_items_media_id_fkey foreign key (media_id) references public.media_assets(id) on delete set null;

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text unique not null,
  target_url text not null,
  status_code integer not null default 301 check (status_code in (301,302,307,308)),
  active boolean not null default true,
  preserve_query boolean not null default true,
  note text not null default '',
  hit_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.api_integrations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  base_url text not null,
  allowed_host text not null,
  endpoint_template text not null default '/',
  method text not null default 'POST' check (method in ('GET','POST','PUT','PATCH','DELETE')),
  headers_template jsonb not null default '{"Authorization":"Bearer {{API_KEY}}","Content-Type":"application/json"}'::jsonb,
  query_template jsonb not null default '{}'::jsonb,
  body_template jsonb not null default '{}'::jsonb,
  key_placeholder text not null default '{{API_KEY}}',
  -- Giá trị API được mã hóa AES-256-GCM ở server Render; không bao giờ trả ra client.
  secret_ciphertext text,
  secret_updated_at timestamptz,
  scope text not null default 'authenticated' check (scope in ('public','authenticated','admin')),
  timeout_ms integer not null default 30000,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

-- An toàn khi chạy lại migration sau một lần cài đặt bị dừng giữa chừng.
alter table public.api_integrations add column if not exists secret_ciphertext text;
alter table public.api_integrations add column if not exists secret_updated_at timestamptz;

create table if not exists public.scheduled_api_jobs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.api_integrations(id) on delete cascade,
  name text not null,
  handler text not null default 'integration' check (handler in ('integration','supabase_keepalive')),
  endpoint_path text not null default '',
  request_payload jsonb not null default '{}'::jsonb,
  interval_minutes integer not null default 1440 check (interval_minutes between 15 and 525600),
  enabled boolean not null default true,
  next_run_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_status text,
  last_message text,
  updated_at timestamptz not null default now()
);

insert into public.scheduled_api_jobs (name,handler,interval_minutes,enabled,next_run_at)
select 'Giữ Supabase hoạt động mỗi ngày','supabase_keepalive',1440,true,now()
where not exists (select 1 from public.scheduled_api_jobs where handler = 'supabase_keepalive');

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists news_articles_status_published_idx on public.news_articles(status, published_at desc);
create index if not exists software_items_category_idx on public.software_items(category_id, sort_order);
create index if not exists data_items_collection_idx on public.data_items(collection_id, sort_order);
create index if not exists scheduled_jobs_due_idx on public.scheduled_api_jobs(enabled, next_run_at);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','site_settings','navigation_items','social_links','content_pages','seo_entries','tools',
    'content_blocks','orbit_rings',
    'news_categories','news_articles','software_categories','software_items','data_collections','data_items',
    'cv_profiles','cv_sections','media_assets','redirects','api_integrations','scheduled_api_jobs'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

-- API secret được mã hóa AES-256-GCM tại Render bằng INTEGRATION_SECRETS_KEY.
-- Không dùng extension vault để migration hoạt động trên mọi project Supabase Cloud.
drop function if exists public.service_store_api_secret(uuid,text);
drop function if exists public.service_get_api_secret(uuid);

-- RLS
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.navigation_items enable row level security;
alter table public.social_links enable row level security;
alter table public.content_pages enable row level security;
alter table public.content_blocks enable row level security;
alter table public.seo_entries enable row level security;
alter table public.tools enable row level security;
alter table public.orbit_rings enable row level security;
alter table public.news_categories enable row level security;
alter table public.news_articles enable row level security;
alter table public.software_categories enable row level security;
alter table public.software_items enable row level security;
alter table public.data_collections enable row level security;
alter table public.data_items enable row level security;
alter table public.user_data_access enable row level security;
alter table public.cv_profiles enable row level security;
alter table public.cv_sections enable row level security;
alter table public.media_assets enable row level security;
alter table public.redirects enable row level security;
alter table public.api_integrations enable row level security;
alter table public.scheduled_api_jobs enable row level security;
alter table public.audit_logs enable row level security;

create policy roles_read on public.roles for select to authenticated using (true);
create policy roles_manage on public.roles for all to authenticated using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.has_permission('users.manage'));
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_manage on public.profiles for all to authenticated using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));

create policy site_public_read on public.site_settings for select using (true);
create policy site_manage on public.site_settings for all to authenticated using (public.has_permission('site.manage')) with check (public.has_permission('site.manage'));
create policy nav_public_read on public.navigation_items for select using (visible or public.has_permission('site.manage'));
create policy nav_manage on public.navigation_items for all to authenticated using (public.has_permission('site.manage')) with check (public.has_permission('site.manage'));
create policy social_public_read on public.social_links for select using (visible or public.has_permission('site.manage'));
create policy social_manage on public.social_links for all to authenticated using (public.has_permission('site.manage')) with check (public.has_permission('site.manage'));

create policy pages_public_read on public.content_pages for select using (
  (status = 'published' and coalesce(published_at, now()) <= now() and not requires_auth)
  or public.has_permission('content.manage')
);
create policy pages_manage on public.content_pages for all to authenticated using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));
create policy blocks_public_read on public.content_blocks for select using (visible or public.has_permission('content.manage'));
create policy blocks_manage on public.content_blocks for all to authenticated using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));
create policy seo_public_read on public.seo_entries for select using (true);
create policy seo_manage on public.seo_entries for all to authenticated using (public.has_permission('seo.manage')) with check (public.has_permission('seo.manage'));
create policy tools_public_read on public.tools for select using (visible or public.has_permission('tools.manage'));
create policy tools_manage on public.tools for all to authenticated using (public.has_permission('tools.manage')) with check (public.has_permission('tools.manage'));
create policy orbit_public_read on public.orbit_rings for select using (visible or public.has_permission('tools.manage'));
create policy orbit_manage on public.orbit_rings for all to authenticated using (public.has_permission('tools.manage')) with check (public.has_permission('tools.manage'));

create policy news_categories_public_read on public.news_categories for select using (visible or public.has_permission('news.manage'));
create policy news_categories_manage on public.news_categories for all to authenticated using (public.has_permission('news.manage')) with check (public.has_permission('news.manage'));
create policy news_public_read on public.news_articles for select using (
  (status = 'published' and coalesce(published_at, now()) <= now()) or public.has_permission('news.manage')
);
create policy news_manage on public.news_articles for all to authenticated using (public.has_permission('news.manage')) with check (public.has_permission('news.manage'));

create policy software_categories_public_read on public.software_categories for select using (visible or public.has_permission('software.manage'));
create policy software_categories_manage on public.software_categories for all to authenticated using (public.has_permission('software.manage')) with check (public.has_permission('software.manage'));
create policy software_public_read on public.software_items for select using (visible or public.has_permission('software.manage'));
create policy software_manage on public.software_items for all to authenticated using (public.has_permission('software.manage')) with check (public.has_permission('software.manage'));

create policy data_collections_read on public.data_collections for select using (
  (visible and visibility = 'public')
  or (visible and visibility = 'authenticated' and auth.uid() is not null)
  or exists (
    select 1
    from public.data_items di
    join public.user_data_access uda on uda.item_id = di.id
    where di.collection_id = data_collections.id
      and di.visible
      and uda.user_id = auth.uid()
      and (uda.expires_at is null or uda.expires_at > now())
  )
  or public.has_permission('data.manage')
);
create policy data_collections_manage on public.data_collections for all to authenticated using (public.has_permission('data.manage')) with check (public.has_permission('data.manage'));
create policy data_items_read on public.data_items for select using (
  (visible and visibility = 'public')
  or (visible and visibility = 'authenticated' and auth.uid() is not null)
  or exists (select 1 from public.user_data_access uda where uda.item_id = data_items.id and uda.user_id = auth.uid() and (uda.expires_at is null or uda.expires_at > now()))
  or public.has_permission('data.manage')
);
create policy data_items_manage on public.data_items for all to authenticated using (public.has_permission('data.manage')) with check (public.has_permission('data.manage'));
create policy data_access_self_read on public.user_data_access for select to authenticated using (user_id = auth.uid() or public.has_permission('data.manage'));
create policy data_access_manage on public.user_data_access for all to authenticated using (public.has_permission('data.manage')) with check (public.has_permission('data.manage'));

create policy cv_public_read on public.cv_profiles for select using (published or public.has_permission('content.manage'));
create policy cv_manage on public.cv_profiles for all to authenticated using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));
create policy cv_sections_public_read on public.cv_sections for select using (visible or public.has_permission('content.manage'));
create policy cv_sections_manage on public.cv_sections for all to authenticated using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

create policy media_public_read on public.media_assets for select using (
  visibility = 'public'
  or (visibility = 'authenticated' and auth.uid() is not null)
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.data_items di
    join public.user_data_access uda on uda.item_id = di.id
    where di.media_id = media_assets.id
      and uda.user_id = auth.uid()
      and (uda.expires_at is null or uda.expires_at > now())
  )
  or public.has_permission('media.manage')
);
create policy media_manage on public.media_assets for all to authenticated using (public.has_permission('media.manage')) with check (public.has_permission('media.manage'));
create policy redirects_public_read on public.redirects for select using (active or public.has_permission('seo.manage'));
create policy redirects_manage on public.redirects for all to authenticated using (public.has_permission('seo.manage')) with check (public.has_permission('seo.manage'));

create policy integrations_manage on public.api_integrations for all to authenticated using (public.has_permission('api.manage')) with check (public.has_permission('api.manage'));
create policy jobs_manage on public.scheduled_api_jobs for all to authenticated using (public.has_permission('api.manage')) with check (public.has_permission('api.manage'));
create policy audit_read on public.audit_logs for select to authenticated using (public.has_permission('users.manage'));

-- Không cho profile tự nâng quyền hoặc tự active. Trigger này chạy sau policy.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.id and not public.has_permission('users.manage') then
    new.role_id = old.role_id;
    new.status = old.status;
    new.email = old.email;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles
for each row execute procedure public.protect_profile_privileges();

-- Routes SEO mặc định. Có thể sửa toàn bộ từ Admin.
insert into public.seo_entries (route,title_vi,title_en,description_vi,description_en,priority,change_frequency)
values
  ('/','Nguyễn Lê Khánh Hòa | Kỹ sư điện','Nguyen Le Khanh Hoa | Electrical Engineer','Hồ sơ, công cụ và sản phẩm số của Nguyễn Lê Khánh Hòa.','Profile, tools and digital products by Nguyen Le Khanh Hoa.',1.0,'weekly'),
  ('/cv','Hồ sơ năng lực','Professional profile','Học vấn, kinh nghiệm và kỹ năng chuyên môn.','Education, experience and professional skills.',0.9,'monthly'),
  ('/tools','Công cụ','Tools','Các công cụ chạy trực tiếp trên trình duyệt.','Browser-based tools.',0.9,'weekly'),
  ('/software','Kho phần mềm','Software library','Kho phần mềm có tìm kiếm và phân loại.','Searchable software library.',0.8,'weekly'),
  ('/data','Dữ liệu','Data','Tài liệu và liên kết được phân quyền.','Permission-based documents and links.',0.4,'weekly'),
  ('/news','Tin tức','News','Tin tức, bài viết và nội dung chuyên môn.','News, articles and professional content.',0.9,'daily')
on conflict (route) do nothing;
