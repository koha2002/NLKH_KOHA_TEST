# CHANGELOG

Gộp từ các file HOTFIX cũ. Lịch sử đầy đủ vẫn nằm trong Git.

---

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


---

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


---

# NLKH KOHA V4.3 — Password recovery + change password

Copy the contents of this overlay into the repository root after V4.2.

## Added
- Login: "Quên mật khẩu?" flow using Supabase `resetPasswordForEmail()`.
- New public route: `/account/reset-password`.
- Account page: password change form for authenticated users.
- Password change verifies the current password by signing in again, then calls `updateUser({ password })`.

## Supabase redirect URL
Add these to Authentication -> URL Configuration -> Redirect URLs:
- `http://localhost:3000/account/reset-password`
- `https://nguyenlekhanhhoa.com/account/reset-password`

Keep the existing callback URLs as well.

No database migration is required for this hotfix.


---

# HOTFIX V4.4 — Frontend VI/EN + Admin Save Toast + Publish UX

## Sửa gì
- Đồng bộ VI/EN cho các phần frontend V4 đã bị hardcode tiếng Việt: Header/account menu, Login/Register/Forgot password, Account/Change password, Reset password, Auth callback, News list/article/comments, CMS content access states, Data workspace, Software errors, CV PDF errors, dynamic tool access state.
- Giữ ngôn ngữ theo `LanguageProvider`/localStorage hiện có.
- Login tôn trọng `?next=/...` sau khi đăng nhập.
- Admin: sau khi bấm Lưu trong TableManager có toast nổi `Đã lưu thay đổi thành công`.
- Data permission và API secret cũng có toast save.
- Nút `Xuất bản frontend` có trạng thái đang chạy, confirm giải thích khi nào cần bấm, toast thành công/lỗi rõ hơn.
- Vite Admin cố định `localhost:5174` + `strictPort:true`, tránh tự nhảy 5175 làm lệch CORS.

## Vì sao nút Xuất bản trước đó báo Failed to fetch
Ảnh kiểm tra cho thấy Admin đang chạy ở `http://localhost:5175`, trong khi cấu hình ALLOWED_ORIGINS trước đó dùng `http://localhost:5174`. Browser chặn request Edge Function khi CORS origin không khớp. V4.4 cố định port 5174.

## Khi nào cần Xuất bản frontend
CẦN sau khi lưu: Cấu hình chung, Menu/Footer, Tool, CV, Tin tức, SEO, Redirect, hoặc tạo/đổi route Trang nội dung.
THƯỜNG KHÔNG CẦN: Software, Data, tài khoản/quyền, thư viện R2 riêng lẻ, vì các phần này đọc runtime. Nếu ảnh R2 được gán vào một mục build-time (menu/CV/news/tool/site), hãy Publish sau khi lưu mục đó.

## Render Deploy Hook
Nút Publish chỉ hoạt động khi frontend Static Site trên Render đã tồn tại và Supabase Edge Function secret có `RENDER_FRONTEND_DEPLOY_HOOK`.


---

# V4.4.1 CV build fix

Fixes the TypeScript narrowing regression in `app/cv/page.tsx` introduced by V4.4.

Copy this overlay onto the repository root, then rebuild.


---

# HOTFIX V4.5 — UUID empty value on Admin save

Fixes `invalid input syntax for type uuid: ""` when saving forms that contain optional R2/media or relation fields with no selection.

Cause: browser form values use an empty string for an unselected field, while PostgreSQL UUID/FK columns require `NULL`.

Changed file:
- `admin/src/components/TableManager.jsx`

No database migration is required.


---

# HOTFIX V4.6 — Nhập dữ liệu NLKH_KOHA + Redirect 3 miền qua Cloudflare

## Mục tiêu

1. Không nhập tay từng phần mềm/dữ liệu cũ.
2. Metadata chuyển sang Supabase; ảnh/PDF nhỏ chuyển sang Cloudflare R2.
3. Installer/phần mềm lớn đang là Google Drive/OneDrive/link ngoài: giữ **Link**, không tải về R2.
4. Code chạy vẫn ở Git/source.
5. Admin quản lý redirect giữa:
   - `koha.io.vn`
   - `nguyenlekhanhhoa.com`
   - `nguyenlekhanhhoa.name.vn`
   và đồng bộ Cloudflare Bulk Redirects bằng một nút.

## Những gì importer lấy từ repo cũ

- `public/content/software.json` → `software_categories` + `software_items`.
- `public/software-icons/*` được tham chiếu → R2 + `media_assets`.
- `public/content/cv/profile.json` → `cv_profiles` + `cv_sections`.
- `public/profile.jpg`, CV PDF → R2.
- `public/content/access/resources.json` → `data_collections` + `data_items` dạng Link.
- favicon/logo/cv-preview nhỏ → thư viện R2.

### Cố tình KHÔNG nhập

- `public/content/access/accounts.json` password: web cũ để plaintext, không đưa sang hệ mới. Tạo/cấp quyền bằng Supabase Auth.
- `public/tool-modules/**`: đây là code Quiz/PDF/COMTRADE (HTML/CSS/JS/vendor), phải ở Git để build/chạy frontend.
- `app/`, `components/`, `lib/`, `styles/`, scripts build, Supabase functions/migrations: code, không phải R2.

## Cài đặt

Copy hotfix vào root `D:\NEW_CODE\NLKH_KOHA_TEST`.

### 1. Migration

```powershell
cd D:\NEW_CODE\NLKH_KOHA_TEST
npx.cmd supabase@latest db push --dry-run
```

Phải thấy:

```text
202608100005_legacy_import_cloudflare_redirects.sql
```

Sau đó:

```powershell
npx.cmd supabase@latest db push
```

### 2. Deploy 2 Edge Functions mới

```powershell
npx.cmd supabase@latest functions deploy legacy-import --use-docker
npx.cmd supabase@latest functions deploy cloudflare-redirect-sync --use-docker
```

### 3. Cloudflare API Token cho Redirect

Cloudflare → My Profile / API Tokens → Create Token → Custom Token.

Permissions ở cấp Account:

- `Account > Bulk URL Redirects > Edit`
- `Account > Account Filter Lists > Edit`

Scope: chỉ account đang chứa 3 domain.

Lấy **Account ID** của Cloudflare, rồi set Supabase secrets:

```powershell
npx.cmd supabase@latest secrets set `
  CLOUDFLARE_ACCOUNT_ID="ACCOUNT_ID_CUA_BAN" `
  CLOUDFLARE_API_TOKEN="TOKEN_CUA_BAN" `
  REDIRECT_ALLOWED_HOSTS="koha.io.vn,nguyenlekhanhhoa.com,nguyenlekhanhhoa.name.vn" `
  REDIRECT_DEFAULT_TARGET_HOST="nguyenlekhanhhoa.com" `
  CLOUDFLARE_REDIRECT_LIST_NAME="nlkh_admin_redirects"
```

Không đưa token Cloudflare vào `VITE_*`, `NEXT_PUBLIC_*`, `.env` public hoặc GitHub.

Sau khi set secrets không bắt buộc deploy lại chỉ vì secret, nhưng nếu function chưa deploy thì deploy theo bước 2.

### 4. Nhập dữ liệu cũ

Admin → **Nhập dữ liệu cũ**.

1. Bấm `Xem trước dữ liệu cũ`.
2. Kiểm tra số phần mềm/icon/CV/tài liệu.
3. Bấm `Nhập vào Supabase + R2`.

Importer có thể chạy lại: software/category dùng slug để cập nhật; media dùng SHA-256 để tái sử dụng ID nếu file trùng.

> CV khi import sẽ thay nội dung CV hiện tại bằng dữ liệu từ repo cũ. Nếu đã sửa CV mới, bỏ tick CV trước khi chạy.

### 5. Redirect cả miền cũ sang .com

Admin → Redirect:

- Miền nguồn: `koha.io.vn`
- Đường dẫn nguồn: `/`
- Chuyển tới: `https://nguyenlekhanhhoa.com/`
- Loại: `301`
- Kích hoạt: ON
- Bao gồm subdomain: ON nếu muốn `www`/subdomain phù hợp
- Khớp mọi path con: ON
- Giữ phần path phía sau: ON
- Giữ query string: ON

Lưu → bấm **Đồng bộ Cloudflare**.

Ví dụ sau sync:

- `https://koha.io.vn/` → `https://nguyenlekhanhhoa.com/`
- `https://koha.io.vn/tools/pdf?x=1` → `https://nguyenlekhanhhoa.com/tools/pdf?x=1`

Có thể tạo rule tương tự từ `nguyenlekhanhhoa.name.vn` sang `.com`, hoặc chuyển ngược giữa 3 miền nếu thực sự cần.

### 6. DNS bắt buộc

Hostname nguồn phải có DNS record được **Proxy qua Cloudflare (orange cloud)** thì Bulk Redirect mới bắt request tại Cloudflare Edge.

### 7. Build

```powershell
npm.cmd run build
cd admin
npm.cmd run build
cd ..
```

Sau đó commit/push branch đang deploy.

## Ghi chú CV/R2

V4.6 bổ sung `photoMediaId` trong dữ liệu CV và frontend xin signed URL từ `r2-file`, nên ảnh CV có thể nằm trong bucket R2 private. PDF CV đã dùng cơ chế này từ V4 trước.

Favicon/OG trong `<head>` cần URL public ở thời điểm build. V4.6 vẫn upload các asset thương hiệu nhỏ vào thư viện R2, nhưng chỉ tự gắn favicon nếu `R2_PUBLIC_BASE_URL` đã cấu hình. Không tự bật public cả bucket.


---

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


---

# V4.6.2 — CV legacy import fix

Sửa lỗi `23502 null value in column description_vi of relation cv_sections` khi import CV legacy.

Nguyên nhân: bulk insert nhiều loại CV section có tập key khác nhau; các cột text NOT NULL bị gửi thành NULL ở một số row. V4.6.2 chuẩn hóa mọi section thành đầy đủ các cột text với chuỗi rỗng thay vì NULL.

Không có migration database mới. Chỉ cần copy file, deploy lại `legacy-import`, rồi chạy lại riêng stage CV (bỏ tick Software/Data/Brand Media nếu đã import thành công).


---

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


---

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

