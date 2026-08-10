# V4.7 — Favicon + cuộn Admin độc lập

## Sửa

1. Khôi phục favicon của website cũ thành `public/favicon.png`.
2. `lib/admin-seo.ts` dùng `/favicon.png` khi `site.favicon_url` chưa có URL public.
3. Admin desktop có **2 vùng cuộn độc lập**:
   - menu/sidebar trái cuộn riêng;
   - nội dung bên phải cuộn riêng;
   - footer sidebar (Xuất bản / Đăng xuất) luôn ở cuối sidebar;
   - header Admin sticky trong vùng nội dung.
4. Mobile vẫn dùng cuộn trang bình thường.

## Áp dụng

Giải nén hotfix. Mở PowerShell tại root repo `NLKH_KOHA_TEST`, rồi chạy script từ thư mục hotfix, ví dụ:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\Downloads\NLKH_KOHA_V4_7_FAVICON_ADMIN_SCROLL_FIX\APPLY_V4_7.ps1"
```

Hoặc copy thư mục hotfix vào root repo rồi chạy:

```powershell
.\NLKH_KOHA_V4_7_FAVICON_ADMIN_SCROLL_FIX\APPLY_V4_7.ps1
```

Sau đó:

```powershell
npm.cmd run build
cd admin
npm.cmd run build
cd ..
```

Commit/push branch `admin-v4` để Render deploy.

## Kiểm tra

- `https://nguyenlekhanhhoa.com/favicon.png` phải mở được icon.
- Chrome cache favicon khá lâu: sau deploy hãy đóng tab cũ, mở tab mới; nếu cần hard refresh.
- Admin: đặt chuột lên menu trái và lăn → chỉ menu trái cuộn. Đặt chuột vào nội dung phải và lăn → chỉ nội dung phải cuộn.
