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
