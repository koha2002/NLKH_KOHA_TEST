# NLKH_KOHA V4.1 Hotfix

Hotfix này sửa 3 vấn đề sau khi chạy local:

- Sửa chữ tiếng Việt bị mojibake bằng cách để `sync-admin-cms.mjs` tự đọc `.env.local` và sinh lại dữ liệu UTF-8 từ Supabase.
- Hiện nút **Đăng nhập** rõ ràng trên desktop thay cho nút tròn ký hiệu mơ hồ.
- Kho phần mềm không đọc `public/content/software.json` trong source nữa. Metadata đọc trực tiếp từ Supabase; icon/cover/file tải lấy từ Cloudflare R2 bằng media ID + signed URL. Admin Software được chuyển sang R2-only.

## Áp dụng

Giải nén và copy nội dung hotfix đè vào root repo `D:\NEW_CODE\NLKH_KOHA_TEST`.

Sau đó ở root repo chạy:

```powershell
Remove-Item .\public\content\software.json -Force -ErrorAction SilentlyContinue
node .\scripts\sync-admin-cms.mjs
npx.cmd supabase@latest db push --dry-run
```

Dry-run phải chỉ thấy migration `202608100003_software_r2_only.sql`. Nếu đúng:

```powershell
npx.cmd supabase@latest db push
```

Sau đó build lại:

```powershell
Remove-Item .\.next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\out -Recurse -Force -ErrorAction SilentlyContinue
npm.cmd run build

cd admin
npm.cmd run build
cd ..
```

Cuối cùng chạy local:

```powershell
npm.cmd run dev
```

Mở PowerShell khác:

```powershell
cd D:\NEW_CODE\NLKH_KOHA_TEST\admin
npm.cmd run dev
```

Frontend: `http://localhost:3000`
Admin: `http://localhost:5174`

Nếu bảng Software trong Admin chưa có mục nào thì `/software` ngoài frontend phải trống. Chỉ sau khi tạo software trong Admin, upload icon/file lên R2 và bật `Hiển thị`, frontend mới hiện mục đó.
