-- NLKH STATIC V4 - Admin UX, R2 asset IDs, inline tools, comments, simplified permissions.
-- Chạy sau 202608100001_static_split.sql.

alter table public.media_assets add column if not exists asset_no bigserial;
alter table public.media_assets add column if not exists sha256 text;
alter table public.media_assets add column if not exists status text not null default 'ready';
alter table public.media_assets add column if not exists usage_note text not null default '';
alter table public.media_assets add column if not exists uploaded_from text not null default 'admin';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'media_assets_status_check') then
    alter table public.media_assets
      add constraint media_assets_status_check check (status in ('pending','ready','failed'));
  end if;
end $$;

create unique index if not exists media_assets_asset_no_uq on public.media_assets(asset_no);
drop index if exists public.media_assets_sha256_ready_uq;
create unique index if not exists media_assets_sha256_visibility_ready_uq
  on public.media_assets(sha256, visibility) where sha256 is not null and status = 'ready';

create or replace function public.r2_asset_code(n bigint)
returns text language sql immutable as $$
  select 'R2-' || lpad(n::text, 6, '0');
$$;

alter table public.site_settings add column if not exists og_media_id uuid references public.media_assets(id) on delete set null;
alter table public.site_settings add column if not exists favicon_url text;
alter table public.site_settings add column if not exists favicon_media_id uuid references public.media_assets(id) on delete set null;

alter table public.navigation_items add column if not exists icon_media_id uuid references public.media_assets(id) on delete set null;
alter table public.social_links add column if not exists icon_media_id uuid references public.media_assets(id) on delete set null;
alter table public.seo_entries add column if not exists og_media_id uuid references public.media_assets(id) on delete set null;
alter table public.tools add column if not exists icon_media_id uuid references public.media_assets(id) on delete set null;
alter table public.tools add column if not exists inline_html text;
alter table public.tools add column if not exists admin_note text not null default '';

update public.tools set accent = case lower(accent)
  when 'blue' then '#2563eb'
  when 'cyan' then '#06b6d4'
  when 'orange' then '#f97316'
  when 'violet' then '#8b5cf6'
  else accent end
where lower(accent) in ('blue','cyan','orange','violet');

alter table public.profiles add column if not exists avatar_media_id uuid references public.media_assets(id) on delete set null;
alter table public.news_articles add column if not exists cover_media_id uuid references public.media_assets(id) on delete set null;
alter table public.news_articles add column if not exists allow_comments boolean not null default false;
alter table public.software_items add column if not exists icon_media_id uuid references public.media_assets(id) on delete set null;
alter table public.software_items add column if not exists cover_media_id uuid references public.media_assets(id) on delete set null;
alter table public.software_items add column if not exists download_access text not null default 'public';
alter table public.software_items add column if not exists download_source text not null default 'link';
alter table public.software_items add column if not exists download_media_id uuid references public.media_assets(id) on delete set null;
alter table public.cv_profiles add column if not exists photo_media_id uuid references public.media_assets(id) on delete set null;
alter table public.cv_profiles add column if not exists pdf_media_id uuid references public.media_assets(id) on delete set null;
alter table public.cv_profiles add column if not exists pdf_access text not null default 'public';
alter table public.cv_sections add column if not exists organization_en text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cv_profiles_pdf_access_check') then
    alter table public.cv_profiles
      add constraint cv_profiles_pdf_access_check check (pdf_access in ('public','authenticated','hidden'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'software_items_download_access_check') then
    alter table public.software_items
      add constraint software_items_download_access_check check (download_access in ('public','authenticated'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'software_items_download_source_check') then
    alter table public.software_items
      add constraint software_items_download_source_check check (download_source in ('link','r2'));
  end if;
end $$;

alter table public.data_items add column if not exists storage_mode text not null default 'link';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'data_items_storage_mode_check') then
    alter table public.data_items
      add constraint data_items_storage_mode_check check (storage_mode in ('link','r2'));
  end if;
end $$;

alter table public.user_data_access add column if not exists permission_level text not null default 'read';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_data_access_permission_level_check') then
    alter table public.user_data_access
      add constraint user_data_access_permission_level_check check (permission_level in ('read','add','full'));
  end if;
end $$;

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  email text,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  r2_object_key text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

alter table public.news_comments enable row level security;
drop policy if exists comments_public_read on public.news_comments;
create policy comments_public_read on public.news_comments
  for select using (status = 'approved' or public.has_permission('news.manage'));
drop policy if exists comments_manage on public.news_comments;
create policy comments_manage on public.news_comments
  for all to authenticated
  using (public.has_permission('news.manage'))
  with check (public.has_permission('news.manage'));

with ranked as (select id,row_number() over(order by sort_order,id)::int n from public.navigation_items)
update public.navigation_items x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(order by sort_order,id)::int n from public.social_links)
update public.social_links x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(order by sort_order,id)::int n from public.tools)
update public.tools x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(order by sort_order,id)::int n from public.software_categories)
update public.software_categories x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(partition by category_id order by sort_order,id)::int n from public.software_items)
update public.software_items x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(order by sort_order,id)::int n from public.data_collections)
update public.data_collections x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(partition by collection_id order by sort_order,id)::int n from public.data_items)
update public.data_items x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(partition by profile_id order by sort_order,id)::int n from public.cv_sections)
update public.cv_sections x set sort_order=ranked.n from ranked where x.id=ranked.id;

do $$
declare p uuid;
begin
  select id into p from public.cv_profiles order by updated_at desc limit 1;
  if p is null then
    insert into public.cv_profiles(
      name,role_vi,role_en,headline_vi,headline_en,summary_vi,summary_en,birth_date,
      address_vi,address_en,phone,email,photo_url,pdf_url,theme,published
    ) values (
      'Nguyễn Lê Khánh Hòa','Kỹ sư điện','Electrical Engineer',
      'Kỹ sư điện với trải nghiệm từ hiện trường đến thiết kế.',
      'An electrical engineer experienced from field testing to design.',
      'Tốt nghiệp loại Giỏi chuyên ngành Tự động hóa Hệ thống điện, có kinh nghiệm thí nghiệm thiết bị, thiết kế tủ điều khiển - bảo vệ và chuẩn bị dự án.',
      'Graduated with distinction in Power System Automation, with experience in equipment testing, protection and control panel design, and project preparation.',
      '15/05/2002','Thanh Xuân, Hà Nội','Thanh Xuan, Hanoi','0343 434 584',
      'khanhhoa2002.hh@gmail.com','/profile.jpg','/content/cv/current.pdf',
      '{"layout":"source-default","accent":"blue","show_photo":true}'::jsonb,true
    ) returning id into p;

    insert into public.cv_sections(profile_id,section_type,title_vi,title_en,subtitle_vi,subtitle_en,period,description_vi,description_en,organization,organization_en,sort_order,visible,data)
    values
      (p,'education','Tự động hóa Hệ thống điện','Power System Automation','Hệ kỹ sư · Tốt nghiệp loại Giỏi','Engineering degree · Graduated with distinction','2020—2025','','','Trường Đại học Điện lực','Electric Power University',1,true,'{}'),
      (p,'certificate','Tiếng Anh B1 - Đại học Điện lực (2023)','B1 English - Electric Power University (2023)','','','','','','','',2,true,'{}'),
      (p,'certificate','ICDL 5 kỹ năng (2025)','ICDL 5 modules (2025)','','','','','','','',3,true,'{}'),
      (p,'certificate','Giấy phép lái xe hạng B2','B2 driving license','','','','','','','',4,true,'{}'),
      (p,'experience','Kỹ sư điện - Phòng chuẩn bị dự án','Electrical Engineer - Project Preparation','','','11/2025 - nay','Kiểm tra thông số thiết bị, hỗ trợ mua sắm và rà soát bảng đáp ứng yêu cầu kỹ thuật.','Equipment specification reviews, procurement support and technical compliance checks.','Công ty TNHH Công nghệ Việt','Viet Technology Co., Ltd.',5,true,'{}'),
      (p,'experience','Kỹ sư thiết kế','Design Engineer','','','06/2025 - 11/2025','Thiết kế tủ điều khiển - bảo vệ cho trạm biến áp từ 110 kV và kiểm thử tủ sau sản xuất.','Protection and control panel design for 110 kV substations and factory acceptance testing.','Công ty CP Entec Kỹ thuật Năng lượng','Entec Energy Engineering JSC',6,true,'{}'),
      (p,'experience','Kỹ sư thí nghiệm điện','Electrical Testing Engineer','','','05/2024 - 06/2025','Kiểm định thiết bị trạm biến áp, thí nghiệm định kỳ và hoàn thiện hồ sơ công trình.','Substation equipment testing, periodic inspections and project documentation.','Công ty TNHH MTV Đo lường Thí nghiệm điện miền Bắc','Northern Electrical Testing Co., Ltd.',7,true,'{}'),
      (p,'experience','Kỹ thuật viên · Quản lý từ xa','Technician · Remote Manager','','','06/2023 - 10/2025','Hỗ trợ kỹ thuật và quản lý hoạt động vận hành từ xa.','Technical support and remote operations management.','Hoàng Mai Mobile','Hoang Mai Mobile',8,true,'{}'),
      (p,'skill','AutoCAD','AutoCAD','','','','','','','',9,true,'{}'),
      (p,'skill','EPLAN','EPLAN','','','','','','','',10,true,'{}'),
      (p,'skill','Microsoft Excel','Microsoft Excel','','','','','','','',11,true,'{}'),
      (p,'skill','Microsoft Word','Microsoft Word','','','','','','','',12,true,'{}'),
      (p,'skill','Đọc tài liệu kỹ thuật','Technical documentation','','','','','','','',13,true,'{}'),
      (p,'skill','Tiếng Anh B1','B1 English','','','','','','','',14,true,'{}');
  end if;
end $$;


-- Danh sách slug trang CMS để Static Export tạo route shell mà không làm lộ nội dung private.
create or replace function public.list_content_page_routes()
returns table(slug text)
language sql stable security definer set search_path=public as $$
  select cp.slug
  from public.content_pages cp
  where cp.status='published'
    and coalesce(cp.published_at, now()) <= now()
  order by cp.slug;
$$;
revoke all on function public.list_content_page_routes() from public;
grant execute on function public.list_content_page_routes() to anon, authenticated;

create or replace function public.get_my_data_permissions()
returns table(item_id uuid, permission_level text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select uda.item_id, uda.permission_level, uda.expires_at
  from public.user_data_access uda
  where uda.user_id = auth.uid()
    and (uda.expires_at is null or uda.expires_at > now());
$$;
revoke all on function public.get_my_data_permissions() from public;
grant execute on function public.get_my_data_permissions() to authenticated;

-- CV section chỉ public khi hồ sơ cha đang được hiển thị; Admin vẫn đọc/sửa được.
drop policy if exists cv_sections_public_read on public.cv_sections;
create policy cv_sections_public_read on public.cv_sections
  for select using (
    (visible and exists (
      select 1 from public.cv_profiles cp
      where cp.id = cv_sections.profile_id and cp.published = true
    ))
    or public.has_permission('content.manage')
  );

-- Chỉ có một CV được hiển thị công khai tại một thời điểm.
with newest as (
  select id from public.cv_profiles order by updated_at desc limit 1
)
update public.cv_profiles set published = false
where id not in (select id from newest) and published = true;
create unique index if not exists cv_one_published_uq on public.cv_profiles((published)) where published = true;

-- Quyền dữ liệu: read = xem; add = được tạo thêm trong cùng nhóm; full = sửa/xóa mục đã cấp.
drop policy if exists data_items_manage on public.data_items;
drop policy if exists data_items_admin_insert on public.data_items;
drop policy if exists data_items_update on public.data_items;
drop policy if exists data_items_delete on public.data_items;
create policy data_items_admin_insert on public.data_items for insert to authenticated
with check (public.has_permission('data.manage') or exists (
  select 1 from public.user_data_access uda
  join public.data_items existing on existing.id = uda.item_id
  where uda.user_id = auth.uid()
    and uda.permission_level in ('add','full')
    and existing.collection_id is not distinct from data_items.collection_id
    and (uda.expires_at is null or uda.expires_at > now())
));
create policy data_items_update on public.data_items for update to authenticated
using (public.has_permission('data.manage') or exists (
  select 1 from public.user_data_access uda
  where uda.user_id = auth.uid() and uda.item_id = data_items.id
    and uda.permission_level = 'full'
    and (uda.expires_at is null or uda.expires_at > now())
))
with check (public.has_permission('data.manage') or exists (
  select 1 from public.user_data_access uda
  where uda.user_id = auth.uid() and uda.item_id = data_items.id
    and uda.permission_level = 'full'
    and (uda.expires_at is null or uda.expires_at > now())
));
create policy data_items_delete on public.data_items for delete to authenticated
using (public.has_permission('data.manage') or exists (
  select 1 from public.user_data_access uda
  where uda.user_id = auth.uid() and uda.item_id = data_items.id
    and uda.permission_level = 'full'
    and (uda.expires_at is null or uda.expires_at > now())
));

create or replace function public.get_media_usage_summary()
returns table(media_id uuid, usage_count bigint, usage_labels text[])
language sql stable security definer set search_path=public as $$
  with refs as (
    select og_media_id media_id,'OG website' label from public.site_settings where og_media_id is not null
    union all select favicon_media_id,'Favicon' from public.site_settings where favicon_media_id is not null
    union all select icon_media_id,'Menu' from public.navigation_items where icon_media_id is not null
    union all select icon_media_id,'Social' from public.social_links where icon_media_id is not null
    union all select og_media_id,'SEO' from public.seo_entries where og_media_id is not null
    union all select icon_media_id,'Tool' from public.tools where icon_media_id is not null
    union all select avatar_media_id,'Avatar' from public.profiles where avatar_media_id is not null
    union all select cover_media_id,'Tin tức' from public.news_articles where cover_media_id is not null
    union all select icon_media_id,'Icon phần mềm' from public.software_items where icon_media_id is not null
    union all select cover_media_id,'Cover phần mềm' from public.software_items where cover_media_id is not null
    union all select download_media_id,'File tải phần mềm' from public.software_items where download_media_id is not null
    union all select photo_media_id,'Ảnh CV' from public.cv_profiles where photo_media_id is not null
    union all select pdf_media_id,'PDF CV' from public.cv_profiles where pdf_media_id is not null
    union all select media_id,'Dữ liệu' from public.data_items where media_id is not null
  )
  select refs.media_id,count(*)::bigint,array_agg(distinct refs.label order by refs.label)
  from refs
  where public.has_permission('media.manage')
  group by refs.media_id;
$$;
revoke all on function public.get_media_usage_summary() from public;
grant execute on function public.get_media_usage_summary() to authenticated;

-- Không để email bình luận lộ qua API public. Public chỉ đọc view đã lọc cột/trạng thái.
revoke select, insert, update, delete on public.news_comments from anon, authenticated;
create or replace view public.approved_news_comments with (security_barrier=true) as
select id, article_id, display_name, body, created_at
from public.news_comments
where status = 'approved' and r2_object_key is not null;
grant select on public.approved_news_comments to anon, authenticated;

with ranked as (select id,row_number() over(order by sort_order,id)::int n from public.orbit_rings)
update public.orbit_rings x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(order by sort_order,id)::int n from public.news_categories)
update public.news_categories x set sort_order=ranked.n from ranked where x.id=ranked.id;
with ranked as (select id,row_number() over(partition by page_key order by sort_order,id)::int n from public.content_blocks)
update public.content_blocks x set sort_order=ranked.n from ranked where x.id=ranked.id;
alter table public.navigation_items add column if not exists icon_url text;

-- /data chứa dữ liệu phân quyền: mặc định không index cho đến khi Admin chủ động bật.
update public.seo_entries set indexable=false, follow_links=false where route='/data';

-- Khi người dùng có quyền Add/Full tự thêm tài liệu, tự cấp quyền cho mục vừa tạo.
-- Add -> mục mới ở mức Read (không thể sửa/xóa); Full -> giữ Full.
create or replace function public.grant_creator_access_to_new_data_item()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  lvl text;
begin
  if uid is null or public.has_permission('data.manage') then
    return new;
  end if;

  select case
    when exists (
      select 1 from public.user_data_access uda
      join public.data_items d on d.id=uda.item_id
      where uda.user_id=uid
        and uda.permission_level='full'
        and d.id<>new.id
        and d.collection_id is not distinct from new.collection_id
        and (uda.expires_at is null or uda.expires_at>now())
    ) then 'full'
    else 'read'
  end into lvl;

  insert into public.user_data_access(user_id,item_id,permission_level,granted_by)
  values(uid,new.id,lvl,uid)
  on conflict(user_id,item_id) do update set permission_level=excluded.permission_level;
  return new;
end;
$$;

drop trigger if exists trg_grant_creator_access_to_new_data_item on public.data_items;
create trigger trg_grant_creator_access_to_new_data_item
after insert on public.data_items
for each row execute function public.grant_creator_access_to_new_data_item();
