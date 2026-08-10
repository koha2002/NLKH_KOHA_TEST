# Validation — Admin V4 Overlay

Đã kiểm tra trong môi trường tạo artifact:

- `node --check` cho toàn bộ file `.js/.mjs`: đạt.
- TypeScript `transpileModule` cho toàn bộ `.ts/.tsx/.jsx` trong overlay: 69 file, 0 lỗi cú pháp.
- Parse toàn bộ JSON: đạt.
- Parse `render.yaml` và GitHub Actions YAML: đạt.
- Đã loại file thử/temporary khỏi gói.

## Vì sao chưa ghi “full build đã chạy thành công”?

Overlay này cần được chép lên **full clone** của `koha2002/NLKH_KOHA` để có toàn bộ CSS/assets/tool source gốc. Ngoài ra registry npm trong sandbox tạo artifact trả 404 cho `@supabase/supabase-js`, nên không thể cài dependency để chạy build hoàn chỉnh ngay tại đây.

Trước khi deploy, bắt buộc chạy trên máy/local hoặc CI của bạn:

```powershell
# Root
npm.cmd install
npm.cmd run build

# Admin
Set-Location admin
npm.cmd install
npm.cmd run build
```

Chỉ push/deploy khi hai build trên thành công. Hướng dẫn đầy đủ nằm trong `DEPLOY_ADMIN_V4_A_Z.md`.
