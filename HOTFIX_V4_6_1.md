# V4.6.1 — Legacy import error/report fix

Sửa lỗi Admin chỉ hiện `[object Object]` khi Edge Function trả về lỗi dạng object.

## Thay đổi
- `admin/src/pages/LegacyImport.jsx`: hiển thị lỗi có message/details/hint/code, lưu report kể cả khi import partial.
- `supabase/functions/legacy-import/index.ts`:
  - serialize PostgREST/AWS errors thành thông báo đọc được;
  - import theo từng stage (software/CV/data/brand media), một stage lỗi không làm mất report của các stage còn lại;
  - software/data import theo từng item, item lỗi được ghi vào report thay vì dừng cả 25 mục;
  - upload R2 lỗi sẽ đánh dấu media `failed` thay vì để `pending` không rõ nguyên nhân;
  - có thể chạy lại an toàn: software/category dùng slug; media reuse theo SHA-256; data legacy dùng `legacy_id`.
  - CV tắt `published` của profile khác trước khi bật profile đang import, tránh lỗi unique published.

## Cài
Copy đè vào root repo, sau đó:

```powershell
cd D:\NEW_CODE\NLKH_KOHA_TEST\admin
npm.cmd run build
cd ..
npx.cmd supabase@latest functions deploy legacy-import --use-docker
git add -A
git commit -m "Fix legacy import errors and partial reporting"
git push origin admin-v4
```

Đợi Render Admin deploy xong, vào `/migration`, bấm Preview rồi Import lại. Nếu có lỗi, report phía dưới sẽ ghi chính xác stage/item nào lỗi.

Không có migration database mới.
