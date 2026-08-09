# Triển khai A–Z: máy mới → Supabase/R2 → GitHub → Render

Tài liệu này dành cho Windows/PowerShell và source NLKH_KOHA. Website này phải deploy dưới dạng Node Web Service, không phải Render Static Site.

## 0. Các dịch vụ

| Dịch vụ | Dùng cho | Có thể đổi tên miền sau? |
|---|---|---:|
| GitHub | Lưu source và chạy scheduler | Có |
| Render Web Service | Chạy Next.js server/API | Có |
| Supabase | Database, Auth, RLS, API Vault | Có |
| Cloudflare R2 | Ảnh, icon, PDF, JSON và tài liệu | Có |
| Cloudflare DNS | Tên miền, SSL/proxy | Có |

Database và tệp không gắn chết vào domain. Có thể làm trên miền test rồi trỏ sang miền chính.

## 1. Cài máy Windows mới

Mở PowerShell bằng tài khoản bình thường:

~~~powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
~~~

Đóng toàn bộ PowerShell rồi mở lại:

~~~powershell
git --version
node --version
npm.cmd --version
~~~

Node cần từ 22.13 trở lên.

Nếu npm báo npm.ps1 cannot be loaded vì Execution Policy, dùng npm.cmd và npx.cmd như tài liệu này. Không cần tắt bảo mật PowerShell.

## 2. Lấy đúng repository Git

~~~powershell
New-Item -ItemType Directory -Force D:\NEW_CODE
Set-Location D:\NEW_CODE
git clone https://github.com/koha2002/NLKH_KOHA.git
Set-Location D:\NEW_CODE\NLKH_KOHA
git remote -v
git status
~~~

Nếu git status báo not a git repository, thư mục đang đứng chỉ là file giải nén. Cách an toàn:

1. Clone repo như trên để có thư mục .git.
2. Chép source mới vào trong thư mục vừa clone, chọn ghi đè.
3. Không xóa thư mục .git.
4. Chạy lại git status.

## 3. Tạo và cấu hình Supabase

### 3.1 Tạo project

Tạo một project Supabase cho môi trường test/chính. Lưu lại:

- Project URL.
- anon/public key.
- service_role key.

service_role chỉ được đặt trong Render/.env.local; không đưa lên GitHub và không dùng trong code trình duyệt.

### 3.2 Chạy database migration

Mở Supabase → SQL Editor. Chạy nguyên tệp theo đúng thứ tự:

1. supabase/migrations/202608090001_initial_cms.sql
2. supabase/migrations/202608090002_content_pages_access.sql

Migration tạo bảng, RLS, vai trò, quyền, dữ liệu mẫu, trigger user và lịch keepalive.

Email owner mặc định là khanhhoa2002.hh@gmail.com. Đăng ký đúng địa chỉ này để trigger gán role owner. Nếu muốn thay email owner, sửa email trong migration trước khi tạo database mới.

### 3.3 Cấu hình Auth URL

Supabase → Authentication → URL Configuration:

- Site URL: domain đang test, ví dụ https://ten-test.onrender.com
- Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://ten-test.onrender.com/auth/callback
  - https://nguyenlekhanhhoa.com/auth/callback

Khi đổi domain chỉ cập nhật danh sách này, không di chuyển database.

### 3.4 Xác thực email

Trong giai đoạn test có thể dùng email mặc định của Supabase, nhưng bị giới hạn gửi. Khi public nên cấu hình Custom SMTP.

Gmail cá nhân dùng được để thử bằng App Password nếu tài khoản bật xác minh hai bước. Để ổn định và tránh giới hạn, nên dùng dịch vụ SMTP giao dịch hoặc email theo domain. Dù dùng provider nào, người dùng vẫn đăng ký trong website và Supabase gửi email xác thực.

### 3.5 Tạo user owner

Sau khi website chạy:

1. Mở /login.
2. Đăng ký khanhhoa2002.hh@gmail.com.
3. Bấm link xác thực trong email.
4. Đăng nhập và mở /admin.

User thường được tạo trạng thái pending. Owner/Admin vào Quản lý người dùng để duyệt và phân vai trò.

## 4. Cloudflare R2

### 4.1 Tạo bucket và token

Cloudflare → Storage & databases → R2 Object Storage:

1. Create bucket, ví dụ nlkh-media.
2. Manage R2 API Tokens.
3. Tạo token có quyền Object Read & Write trên bucket.
4. Lưu Account ID, Access Key ID, Secret Access Key.

Không đưa ba giá trị này vào frontend.

### 4.2 Public URL

Có thể:

- dùng custom domain cho bucket public; hoặc
- giữ bucket private và tải qua /api/media/id.

Ảnh website công khai nên có public base URL. Tệp được cấp riêng phải đặt visibility private.

### 4.3 CORS cho upload trực tiếp

Trong CORS bucket, cho phép các origin thực sự sử dụng:

~~~json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://ten-test.onrender.com",
      "https://nguyenlekhanhhoa.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
~~~

Khi đổi domain, thêm origin mới vào CORS.

## 5. Cấu hình local

~~~powershell
Set-Location D:\NEW_CODE\NLKH_KOHA
Copy-Item .env.example .env.local
notepad .env.local
~~~

Điền:

~~~dotenv
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=nlkh-media
R2_PUBLIC_BASE_URL=https://media.example.com
SCHEDULER_SECRET=mot-chuoi-ngau-nhien-dai
OWNER_EMAIL=khanhhoa2002.hh@gmail.com
~~~

Nếu bucket private hoàn toàn, R2_PUBLIC_BASE_URL có thể để trống.

## 6. Cài và kiểm tra local

~~~powershell
npm.cmd install
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:comtrade
npm.cmd run build
npm.cmd run dev
~~~

Kiểm tra:

- /api/health trả trạng thái thành công.
- đăng ký/xác thực/đăng nhập.
- /admin mở được với owner.
- tải thử một ảnh lên R2.
- tạo bài nháp, app, dữ liệu, SEO và redirect.
- Quiz chọn được JSON được cấp.
- PDF chạy local.

## 7. Đưa source lên GitHub

Trước khi commit:

~~~powershell
git status
git add .
git commit -m "Hoan thien backend va admin"
git pull --rebase origin main
git push origin main
git status
~~~

Kết quả cuối đúng là:

~~~text
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
~~~

Nếu push bị fetch first, dùng đúng thứ tự:

~~~powershell
git pull --rebase origin main
git push origin main
~~~

Nếu rebase báo unstaged changes, commit thay đổi trước hoặc dùng git stash; không dùng reset --hard.

## 8. Deploy Render

### Cách 1 — Blueprint

Render → New → Blueprint → chọn repository. render.yaml đã khai báo:

- runtime: Node
- build: npm ci && npm run build
- start: npm run start
- health check: /api/health
- Node: 22.13

### Cách 2 — Web Service thủ công

Render → New → Web Service:

- Branch: main
- Runtime: Node
- Build Command: npm ci && npm run build
- Start Command: npm run start
- Health Check Path: /api/health

Không chọn Static Site vì Auth, API, Admin, redirect, private media và scheduler đều cần server.

### Biến môi trường Render

Thêm toàn bộ biến của .env.example. Trên Render:

- SITE_URL và NEXT_PUBLIC_SITE_URL phải là URL public hiện tại.
- SCHEDULER_SECRET phải là chuỗi dài và trùng GitHub secret.
- Không thêm dấu nháy quanh giá trị.

Sau khi lưu biến, Manual Deploy → Deploy latest commit.

## 9. Lịch keepalive Supabase và gọi API

Database đã có job supabase_keepalive chu kỳ 1440 phút. GitHub Actions chỉ đánh thức runner 30 phút một lần; runner tự chọn job đến hạn, vì vậy Supabase chỉ được gọi nhẹ mỗi ngày.

GitHub → repository → Settings → Secrets and variables → Actions, tạo:

| Secret | Giá trị |
|---|---|
| SITE_BASE_URL | URL Render, không có dấu / cuối |
| SCHEDULER_SECRET | đúng chuỗi ở Render |

Workflow: .github/workflows/backend-scheduler.yml.

Vào tab Actions → Backend scheduler → Run workflow để thử. Nếu 401, hai giá trị SCHEDULER_SECRET không trùng. Nếu 404, SITE_BASE_URL sai hoặc Render chưa deploy source mới.

## 10. Domain Cloudflare → Render

1. Trong Render → Settings → Custom Domains, thêm domain.
2. Render hiển thị bản ghi DNS cần tạo.
3. Trong Cloudflare DNS, tạo đúng A/CNAME mà Render yêu cầu.
4. Lúc Render cấp chứng chỉ, để record DNS only nếu proxy gây lỗi xác minh.
5. Khi Certificate Issued, có thể bật proxy Cloudflare nếu muốn.
6. Cập nhật SITE_URL/NEXT_PUBLIC_SITE_URL, Supabase Auth URL và R2 CORS.

Redirect toàn domain cũ sang domain mới nên đặt tại Cloudflare Redirect Rules. Redirect đường dẫn nội bộ trong cùng website có thể quản lý ở /admin/redirects.

## 11. Search Console và sitemap

Mở trực tiếp trước:

https://nguyenlekhanhhoa.com/sitemap.xml

Nếu XML mở được, trong Google Search Console nhập đầy đủ:

~~~text
https://nguyenlekhanhhoa.com/sitemap.xml
~~~

Với Domain Property, Google đôi khi vẫn yêu cầu URL đầy đủ thay vì chỉ sitemap.xml.

Chỉ gửi sitemap một lần. Khi Admin tạo bài/trang/tool công khai, sitemap động tự cập nhật; không sửa file sitemap thủ công.

Sau khi xuất bản nội dung quan trọng, dùng Kiểm tra URL → Yêu cầu lập chỉ mục. Không gửi hàng loạt URL rỗng/trùng lặp.

## 12. Đổi từ domain test sang domain chính

Không tạo lại Supabase/R2 và không chép dữ liệu:

1. Thêm domain chính vào Render.
2. Trỏ Cloudflare DNS.
3. Đổi SITE_URL và NEXT_PUBLIC_SITE_URL trên Render.
4. Thêm callback domain chính ở Supabase.
5. Thêm domain chính ở R2 CORS.
6. Admin → Cấu hình chung → site_url.
7. Deploy lại để metadata mặc định dùng domain mới.

## 13. Lỗi thường gặp

### npm.cmd is not recognized

Node.js chưa cài hoặc terminal chưa mở lại. Cài Node LTS rồi đóng/mở PowerShell.

### npm.ps1 cannot be loaded

Dùng npm.cmd và npx.cmd.

### not a git repository

Bạn đang ở thư mục giải nén không có .git. Clone repo rồi chép source vào thư mục clone.

### Render Site not found

Kiểm tra service đang chạy và URL Render; website này phải là Web Service.

### SSL/certificate error

Kiểm tra DNS không còn record cũ xung đột, để DNS only trong lúc Render xác minh và chờ DNS/chứng chỉ cập nhật.

### R2 từ chối upload

Kiểm tra token, bucket, public base URL và CORS đúng origin.

### User không mở được dữ liệu private

Kiểm tra user active, item visible/private và có bản ghi Cấp quyền dữ liệu chưa hết hạn.

### Admin thay nội dung nhưng web chưa đổi

Nội dung database đổi ngay. Hard refresh trình duyệt; nếu là cấu hình được cache, chờ ngắn hoặc redeploy. Thay code luôn cần Git push/Render deploy.
