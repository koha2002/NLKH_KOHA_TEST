-- V4.2: file cài đặt có thể dùng link ngoài hoặc Cloudflare R2.
-- Metadata vẫn ở Supabase; source frontend không chứa file cài đặt.
alter table public.software_items alter column download_source set default 'link';

-- Nếu dữ liệu cũ đã có URL tải nhưng chưa có media R2, nhận diện lại là link.
update public.software_items
set download_source = 'link'
where download_media_id is null
  and nullif(btrim(download_url), '') is not null;

-- Bảo vệ dữ liệu mới/cập nhật: phải có đúng đích tải tương ứng.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'software_items_download_target_check'
      and conrelid = 'public.software_items'::regclass
  ) then
    alter table public.software_items drop constraint software_items_download_target_check;
  end if;

  alter table public.software_items
    add constraint software_items_download_target_check
    check (
      (download_source = 'link' and nullif(btrim(download_url), '') is not null)
      or
      (download_source = 'r2' and download_media_id is not null)
    ) not valid;
end $$;
