# Deploy A–Z — NLKH_KOHA Admin V4

## Kiến trúc sau nâng cấp

```text
nguyenlekhanhhoa.com
  -> Render Static Site
  -> Next.js static export từ root repo

admin.nguyenlekhanhhoa.com
  -> Render Static Site
  -> Vite/React trong admin/

Supabase
  -> Auth + Postgres + RLS + Edge Functions

Cloudflare R2
  -> ảnh / favicon / OG / CV / data / media / comment archive
```

Repo gốc `NLKH_KOHA` hiện đã là static Next export. Bản V4 **không chuyển frontend sang Web Service** và không làm frontend ngủ đông; chỉ bổ sung Supabase/R2 và tách Admin thành Static Site riêng.

---

## 0. Máy Windows mới: cài công cụ cần thiết

Mở PowerShell và cài Git + Node.js LTS:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
```

Đóng PowerShell, mở lại rồi kiểm tra:

```powershell
git --version
node --version
npm.cmd --version
npx.cmd supabase@latest --version
```

Bản hướng dẫn dùng `npx.cmd supabase@latest ...` nên không cần cài Supabase CLI global. Nếu máy đã có Git/Node thì bỏ qua phần cài tương ứng.

---

## 1. Tạo branch test, không đụng production ngay

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force D:\NEW_CODE
Set-Location D:\NEW_CODE

git clone https://github.com/koha2002/NLKH_KOHA.git
Set-Location .\NLKH_KOHA

git checkout -b admin-v4
```

Giải nén `NLKH_KOHA_ADMIN_V4_OVERLAY.zip`.

Copy **toàn bộ nội dung bên trong ZIP** vào root:

```text
D:\NEW_CODE\NLKH_KOHA\
```

Chọn Merge/Replace.

Đây là overlay nên những file gốc không nằm trong ZIP vẫn giữ nguyên.

---

## 2. Cài dependency và build local

Root frontend:

```powershell
Set-Location D:\NEW_CODE\NLKH_KOHA
npm.cmd install
npm.cmd run build
```

Admin:

```powershell
Set-Location D:\NEW_CODE\NLKH_KOHA\admin
npm.cmd install
npm.cmd run build
```

Nếu cả hai build thành công mới tiếp tục.

---

## 3. Tạo Supabase project

Tạo project Supabase mới nếu bạn chưa có project database cho Admin V4.

Lấy:

```text
Project URL
Publishable key (sb_publishable_...)
```

Browser chỉ dùng **publishable key**. Không đưa secret/service key vào `NEXT_PUBLIC_*` hoặc `VITE_*`.

---

## 4. Chạy migrations

Supabase Dashboard -> SQL Editor.

Nếu project mới hoàn toàn, chạy theo đúng thứ tự file trong:

```text
supabase/migrations/
```

Thứ tự hiện có:

```text
202608090001_initial_cms.sql
202608090002_content_pages_access.sql
202608100001_static_split.sql
202608100002_admin_ux_v4.sql
```

Nếu project cũ đã chạy ba file đầu thì chỉ chạy migration mới chưa chạy. Không chạy lại bừa migration đã áp dụng trên production.

Sau khi chạy, kiểm tra có bảng:

```text
profiles
roles
site_settings
navigation_items
seo_entries
tools
news_articles
news_comments
software_items
data_items
user_data_access
media_assets
api_integrations
scheduled_api_jobs
cv_profiles
cv_sections
```

---

## 5. Tạo tài khoản Owner

Đăng ký bằng email Owner đã cấu hình trong migration/project.

Kiểm tra `profiles`:

```text
role_id = owner
status = active
```

Role `owner` cần permission `*`.

Nếu user đã tồn tại từ trước, sửa profile chứ không tạo Auth user trùng email.

---

## 6. Supabase Auth URL

Supabase -> Authentication -> URL Configuration.

Production Site URL:

```text
https://nguyenlekhanhhoa.com
```

Redirect allow list:

```text
http://localhost:3000/auth/callback/
http://localhost:5174/auth/callback
https://<frontend-test>.onrender.com/auth/callback/
https://<admin-test>.onrender.com/auth/callback
https://nguyenlekhanhhoa.com/auth/callback/
https://admin.nguyenlekhanhhoa.com/auth/callback
```

URL dùng trong `redirectTo/emailRedirectTo` phải nằm trong allow list.

### Email rate limit

Supabase built-in email provider có hạn mức rất thấp. Trước khi mở đăng ký thật:

```text
Authentication -> SMTP -> Custom SMTP
Authentication -> Rate Limits
```

Cấu hình SMTP riêng rồi chỉnh rate limit phù hợp. Không giải quyết rate limit bằng cách đưa service-role key vào frontend.

---

## 7. Cloudflare R2

Tạo hoặc dùng bucket hiện có, ví dụ:

```text
nlkh-media
```

Tạo R2 API credentials có quyền đọc/ghi object cho bucket này.

Bạn cần:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

### Public custom domain

Nếu muốn OG/favicon/avatar/public image có URL ổn định, gắn custom domain cho bucket, ví dụ:

```text
files.nguyenlekhanhhoa.com
```

Giá trị này dùng cho:

```text
R2_PUBLIC_BASE_URL=https://files.nguyenlekhanhhoa.com
```

Private download/upload vẫn dùng presigned URL S3 API ở Edge Function; không dùng custom domain cho presigned URL.

### CORS

R2 -> bucket -> Settings -> CORS.

Có file mẫu:

```text
R2_CORS.example.json
```

Trong lúc test có thể thêm origin test Render. Production tối thiểu phải có Admin origin cho `PUT` upload.

---

## 8. Edge Function Secrets

Supabase -> Edge Functions -> Secrets.

Các biến `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS` được hosted Supabase cung cấp mặc định. Không tự copy secret key vào frontend.

Tạo thêm:

```text
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5174,https://nguyenlekhanhhoa.com,https://admin.nguyenlekhanhhoa.com

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=nlkh-media
R2_PUBLIC_BASE_URL=https://files.nguyenlekhanhhoa.com

INTEGRATION_SECRETS_KEY=<chuỗi ngẫu nhiên >= 32 ký tự>
SCHEDULER_SECRET=<chuỗi ngẫu nhiên dài>
COMMENT_HASH_SALT=<chuỗi ngẫu nhiên riêng>
```

`INTEGRATION_SECRETS_KEY` dùng AES-GCM mã hóa API secret lưu trong DB.

`SCHEDULER_SECRET` chỉ là shared secret cloud. Có thể tạo trong Admin bằng nút Web Crypto. Máy tính tắt không làm nó mất hiệu lực.

---

## 9. Deploy Edge Functions

Cài Supabase CLI theo hướng dẫn chính thức hiện tại, sau đó từ root repo:

```powershell
npx.cmd supabase@latest login
npx.cmd supabase@latest link --project-ref YOUR_PROJECT_REF

npx.cmd supabase@latest functions deploy r2-file
npx.cmd supabase@latest functions deploy integration-secret
npx.cmd supabase@latest functions deploy integration-proxy
npx.cmd supabase@latest functions deploy schedule-runner
npx.cmd supabase@latest functions deploy render-deploy
npx.cmd supabase@latest functions deploy news-comment
```

`supabase/config.toml` đặt built-in `verify_jwt=false`; các function tự kiểm tra user/session/permission trong code để tương thích publishable/secret API key mới.

---

## 10. Env local root frontend

Tạo `.env.local` ở root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:5174
NLKH_CMS_SYNC_REQUIRED=false
```

Chạy:

```powershell
npm.cmd run dev
```

Frontend: `http://localhost:3000`.

---

## 11. Env local Admin

```powershell
Set-Location admin
Copy-Item .env.example .env
notepad .env
```

Điền:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
VITE_SITE_URL=http://localhost:3000
VITE_ADMIN_URL=http://localhost:5174
```

Chạy:

```powershell
npm.cmd run dev
```

Admin: `http://localhost:5174`.

---

## 12. Test Admin local

Kiểm tra trước khi push:

```text
Cấu hình chung: OG + favicon upload R2
Menu/Footer: parent dropdown + icon R2
Trang nội dung: required/optional/error đúng ô
SEO: tooltip + OG R2
Redirect
Tool: thêm tool + preview inline HTML
News: cover R2 + comment moderation
Software: icon/cover + nguồn Link/R2 + public/auth download
Data: Link/R2 + permission matrix
CV: một profile + section + photo/PDF
Users: avatar + permission checkbox
Media: R2 ID/preview/replace/delete/dedupe
API: secret + lịch chạy
PDF: Offline / Online
```

---

## 13. Push branch test

```powershell
Set-Location D:\NEW_CODE\NLKH_KOHA

git status
git add .
git commit -m "feat: admin v4 r2 cms permissions and pdf offline-online"
git push -u origin admin-v4
```

Giữ `main` nguyên để rollback.

---

## 14. Deploy TEST trên Render trước

Để không đụng website production, tạo thủ công hai Static Site test từ branch `admin-v4`.

### Frontend test

```text
Service type: Static Site
Repository: koha2002/NLKH_KOHA
Branch: admin-v4
Root Directory: để trống
Build Command: npm install && npm run build
Publish Directory: out
```

Environment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://<frontend-test>.onrender.com
NEXT_PUBLIC_ADMIN_URL=https://<admin-test>.onrender.com
NLKH_CMS_SYNC_REQUIRED=true
```

### Admin test

```text
Service type: Static Site
Repository: koha2002/NLKH_KOHA
Branch: admin-v4
Root Directory: admin
Build Command: npm install && npm run build
Publish Directory: dist
```

Environment:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SITE_URL=https://<frontend-test>.onrender.com
VITE_ADMIN_URL=https://<admin-test>.onrender.com
```

Admin cần SPA rewrite:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

`render.yaml` đã chứa cấu hình tương đương cho production/Blueprint.

---

## 15. Cập nhật allowed origins test

Trong khi test thêm URL test vào:

```text
Supabase Auth Redirect URLs
ALLOWED_ORIGINS
R2 CORS
```

Nếu thiếu, upload R2/Auth callback có thể fail dù code đúng.

---

## 16. Render Deploy Hook

Frontend test/prod -> Settings -> Deploy Hook.

Copy hook frontend, lưu trong Supabase Edge Function Secret:

```text
RENDER_FRONTEND_DEPLOY_HOOK=...
```

Đây là secret. Không đặt trong `NEXT_PUBLIC_*`, `VITE_*` hoặc commit GitHub.

Admin nút **Xuất bản frontend** gọi `render-deploy` Edge Function, Edge Function mới gọi Deploy Hook.

Khi sửa nội dung build-time như CV/SEO/Tool/News/Software/Menu, bấm Publish để static output build lại.

---

## 17. Scheduler

Workflow cloud nằm ở:

```text
.github/workflows/supabase-scheduler.yml
```

GitHub repo -> Settings -> Secrets and variables -> Actions:

```text
SUPABASE_SCHEDULE_RUNNER_URL=https://YOUR_PROJECT.supabase.co/functions/v1/schedule-runner
SCHEDULER_SECRET=<cùng giá trị đã lưu Supabase>
```

Workflow kiểm tra job định kỳ trên cloud. Máy tính cá nhân không liên quan.

Lưu ý GitHub scheduled workflow chạy trên default branch. Trước production hãy merge workflow vào `main`. Với repo public, GitHub có thể tự disable scheduled workflow nếu repo không có activity trong thời gian dài; nếu scheduler là nhiệm vụ quan trọng, kiểm tra tab Actions định kỳ hoặc chuyển trigger sang Supabase pg_cron/cron cloud riêng.

---

## 18. Test R2 kỹ

Trong Admin:

1. Upload một PNG vào OG.
2. Ghi lại ID, ví dụ `R2-000001`.
3. Logout/login lại -> ID + preview phải vẫn còn.
4. Upload lại đúng cùng file -> hệ thống phải báo dùng lại ID cũ.
5. Thay file giữ ID -> nơi dùng ID cập nhật file.
6. Chọn ID thư viện cũ -> không tăng object mới.
7. Xóa ID đang được dùng -> hệ thống phải chặn và chỉ nơi đang dùng.
8. Xóa bắt buộc -> references được gỡ/ẩn an toàn.

---

## 19. Test Data permission

Tạo user test, để `active`.

Trong Admin -> Dữ liệu & quyền:

- tích nhiều tài liệu;
- test `Chỉ đọc`;
- test `Thêm mới`;
- test `Full`.

Đăng nhập user ở frontend `/data/`:

- Read chỉ mở được;
- Add có thể tạo mục mới trong nhóm được cấp nhưng không sửa/xóa mục cũ;
- Full có nút Sửa/Xóa.

Khi user Full xóa mục, object R2 vật lý không tự xóa để tránh ảnh hưởng asset dùng chung; Admin Media quản lý xóa vật lý.

---

## 19.1. Test Software tải bằng R2

Trong Admin -> Phần mềm:

1. Chọn `Nguồn file tải = Cloudflare R2`.
2. Chọn `Quyền tải = Cần đăng nhập`.
3. Upload file ngay trong form và lưu.
4. Publish frontend.
5. Mở `/software` khi logout: nút yêu cầu đăng nhập.
6. Login rồi tải: frontend gọi Edge Function để lấy signed URL R2; file không cần nhúng URL private vào JSON public.

Với phần mềm tải công khai, có thể chọn R2 Public hoặc link ngoài.

---

## 20. Test News comment

Bật `Cho bình luận` ở một bài Published.

Người đọc gửi comment:

```text
status = pending
r2_object_key = null
```

Admin -> Tin tức -> Bình luận -> Duyệt:

```text
status = approved
r2_object_key = comments/<slug>/<comment-id>.json
```

Lúc này comment mới được view public và có archive JSON R2.

Từ chối = không hiển thị; nếu trước đó từng duyệt thì R2 archive bị gỡ.

---

## 20.1. Test quyền PDF CV

Trong Admin -> CV:

- `Hiển thị hồ sơ` chỉ bật/tắt trang CV.
- `Quyền tải file PDF CV = Công khai`: khách tải được.
- `Cần đăng nhập`: khách được chuyển tới Login, user đăng nhập mới nhận signed URL R2.
- `Ẩn nút tải PDF`: CV vẫn hiển thị nhưng không có nút tải.

---

## 21. Test PDF Online/Offline

Mở `/tools/pdf/`.

Trên đầu phải có:

```text
Offline | Online
```

Online phải vẫn chạy iLovePDF flow gốc trong `public/tool-modules/pdf/module.js`.

Offline test:

```text
Merge PDF
Split page range
Rotate PDF
Text watermark
Page number
Image -> PDF
Compress/resize/crop/rotate/convert/watermark image
```

Những chức năng không tương đương browser sẽ nhắc chuyển Online thay vì giả vờ xử lý.

---

## 22. Chuyển production

Chỉ khi test branch ổn:

```powershell
git checkout main
git pull --rebase origin main
git merge admin-v4
git push origin main
```

Frontend production Render hiện tại của `NLKH_KOHA` đã là Static Site. Cập nhật Environment của service production:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://nguyenlekhanhhoa.com
NEXT_PUBLIC_ADMIN_URL=https://admin.nguyenlekhanhhoa.com
NLKH_CMS_SYNC_REQUIRED=true
```

Tạo Admin production Static Site:

```text
Branch: main
Root Directory: admin
Build: npm install && npm run build
Publish: dist
```

---

## 23. Domain Admin + Cloudflare

Render Admin -> Custom Domains:

```text
admin.nguyenlekhanhhoa.com
```

Cloudflare DNS trỏ `admin` tới hostname `.onrender.com` Admin.

Trong lúc Render verify/cấp certificate, để Proxy status **DNS only**. Khi Render báo domain verified/certificate OK mới cân nhắc bật proxy.

Frontend `nguyenlekhanhhoa.com` giữ service static hiện tại.

---

## 24. Production env cuối

### Frontend Render

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=https://nguyenlekhanhhoa.com
NEXT_PUBLIC_ADMIN_URL=https://admin.nguyenlekhanhhoa.com
NLKH_CMS_SYNC_REQUIRED=true
```

### Admin Render

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
VITE_SITE_URL=https://nguyenlekhanhhoa.com
VITE_ADMIN_URL=https://admin.nguyenlekhanhhoa.com
```

### ALLOWED_ORIGINS

```text
https://nguyenlekhanhhoa.com,https://admin.nguyenlekhanhhoa.com
```

### R2 CORS

Giữ Admin production origin; thêm frontend origin nếu một flow browser thật sự cần request R2 cross-origin trực tiếp.

---

## 25. Backup/rollback

Không xóa branch `admin-v4` ngay sau merge.

Nếu production có lỗi nặng:

```powershell
git log --oneline
git revert <commit-v4>
git push origin main
```

Hoặc trong Render deploy lại commit production cũ.

Database migration cần rollback riêng; không xóa bảng/dữ liệu chỉ vì frontend rollback.

---

## 26. Redirect thật 301/308

Build tạo HTML fallback redirect, nhưng static HTML trả HTTP 200 trước khi browser chuyển.

Nếu đổi URL quan trọng cho SEO, sau khi tạo redirect trong Admin hãy tạo thêm rule tương ứng ở Cloudflare/Render để CDN trả HTTP 301/308 thật.
