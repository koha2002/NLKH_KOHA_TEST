# V4.7.1 — Favicon + Admin Brand Fix

- Thêm favicon riêng cho Admin (`admin/public/favicon.png`).
- Giữ favicon frontend ở `public/favicon.png`.
- Cắt bớt vùng trong suốt của favicon để biểu tượng nhìn đầy hơn trong tab trình duyệt.
- Thêm cache-busting `?v=471` cho favicon Admin.
- Tăng chữ thương hiệu `NLKH / ADMIN` ở sidebar Admin.
- Không thay đổi database, Supabase hay R2.

## Cài đặt

Giải nén thư mục này vào root repo, rồi chạy:

```powershell
powershell -ExecutionPolicy Bypass -File ".\NLKH_KOHA_V4_7_1_FAVICON_BRAND_FIX\APPLY_V4_7_1.ps1"
npm.cmd run build
cd admin
npm.cmd run build
cd ..
```

Sau khi push/deploy, đóng tab cũ và mở tab mới hoặc Ctrl+F5 vì Chrome cache favicon rất lâu.
