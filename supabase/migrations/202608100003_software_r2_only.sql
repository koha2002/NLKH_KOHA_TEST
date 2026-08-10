-- V4.1: Kho phần mềm lấy metadata từ Supabase và toàn bộ icon/cover/file tải từ R2.
-- Không còn yêu cầu download_url khi dùng R2.
alter table public.software_items alter column download_url drop not null;
alter table public.software_items alter column download_source set default 'r2';

-- Bất kỳ bản ghi cũ nào chưa có file R2 sẽ tạm ẩn để frontend không hiển thị dữ liệu/source cũ.
update public.software_items
set visible = false
where download_media_id is null;
