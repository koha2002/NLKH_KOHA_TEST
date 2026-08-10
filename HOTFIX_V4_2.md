# NLKH_KOHA V4.2 — Software download: Link hoặc R2

Hotfix này thay đổi riêng luồng **Kho phần mềm**:

- Metadata phần mềm: Supabase.
- Icon/cover nhỏ: Cloudflare R2.
- File cài đặt/file tải: người quản trị chọn một trong hai:
  - **Liên kết ngoài**: Google Drive, OneDrive, MediaFire, website hãng, CDN khác…
  - **Cloudflare R2**: upload trực tiếp.
- Không lưu file cài đặt trong source Git.
- Khi đổi từ R2 sang Link, `download_media_id` được gỡ khỏi bản ghi phần mềm (asset R2 vẫn nằm trong thư viện cho tới khi quản trị tự xóa).
- Khi đổi từ Link sang R2, `download_url` được đặt `NULL`.
- Với `authenticated` + Link ngoài: website yêu cầu đăng nhập trước khi mở link, nhưng bản thân URL bên ngoài vẫn do dịch vụ lưu trữ đó kiểm soát.

## Áp dụng

Copy toàn bộ nội dung ZIP vào root repo `NLKH_KOHA_TEST`, ghi đè file cũ.

Sau đó:

```powershell
npx.cmd supabase@latest db push --dry-run
```

Phải thấy migration:

`202608100004_software_link_or_r2.sql`

Nếu đúng:

```powershell
npx.cmd supabase@latest db push
```

Sau đó build/test lại frontend + admin.
