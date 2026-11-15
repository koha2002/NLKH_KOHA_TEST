# NLKH Portal — website, CMS và Admin

Website cá nhân của Nguyễn Lê Khánh Hòa đã được chuyển từ web tĩnh sang hệ thống Next.js + Supabase + Cloudflare R2. Giao diện công khai chỉ làm nhiệm vụ hiển thị; nội dung, quyền truy cập, SEO, menu, CV, phần mềm, dữ liệu, tin tức, API và lịch chạy được quản lý trong Admin.

Địa chỉ chính dự kiến: https://nguyenlekhanhhoa.com

## 1. Kiến trúc ba lớp

| Lớp | Thư mục chính | Nhiệm vụ |
|---|---|---|
| Giao diện | app, components, styles, public/tool-modules | Trang công khai, Admin, theme, ngôn ngữ và giao diện riêng của tool |
| Nghiệp vụ | lib/services, lib/auth, lib/integrations | Kiểm tra quyền, xử lý dữ liệu, gọi API, lịch chạy và quy tắc hệ thống |
| Dữ liệu | lib/repositories, lib/supabase, Supabase, R2 | Database, Auth, RLS, tệp, API Vault và truy vấn dữ liệu |

Ba lớp này tách nhau để thay giao diện không làm hỏng dữ liệu, thay nơi lưu tệp không phải viết lại tool, và mọi quyền vẫn được kiểm tra ở server/database.

## 2. Những gì đã có

- Đăng ký, xác thực email, đăng nhập và trang tài khoản bằng Supabase Auth.
- Vai trò owner, admin, editor, member và hệ thống permission chi tiết.
- Admin quản lý người dùng, role, menu, footer, mạng xã hội, nội dung, SEO, redirect.
- Admin quản lý CV, phần mềm, dữ liệu, tin tức, tool và vòng quỹ đạo.
- Admin tải ảnh/tệp trực tiếp lên Cloudflare R2; khóa R2 không xuất hiện ở trình duyệt.
- API Vault lưu bí mật ở Supabase; source Git không chứa API key.
- Lịch chạy API và lịch keepalive Supabase mỗi ngày.
- Sitemap và robots động; trang mới, bài báo và tool công khai tự vào sitemap.
- Theme sáng/tối và ngôn ngữ VI/EN được lưu trên máy người dùng.
- Quiz chạy cục bộ; tài khoản được cấp quyền có thể chọn tệp JSON từ Dữ liệu rồi nhập vào Quiz.
- PDF chạy cục bộ: gộp, lấy trang, xóa trang, sắp xếp, xoay, đóng dấu, đánh số trang và ảnh sang PDF.
- COMTRADE chạy offline, đã kiểm thử ASCII, BINARY, BINARY32 và FLOAT32.
- Tin tức có danh mục, tác giả, người dịch, biên tập, nguồn, tag, ảnh và SEO.

## 3. Chạy trên máy

Yêu cầu Node.js 22.13 trở lên.

~~~powershell
git clone https://github.com/koha2002/NLKH_KOHA.git
cd NLKH_KOHA
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
~~~

Mở http://localhost:3000.

Điền biến môi trường theo file .env.example. Không commit .env.local lên GitHub.

## 4. Kiểm tra trước khi cập nhật

~~~powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:comtrade
npm.cmd run build
~~~

Build hiện đã vượt qua TypeScript, COMTRADE và production build. ESLint chỉ còn cảnh báo tối ưu ảnh động, không phải lỗi chạy.

## 5. Trang Admin

Sau khi chạy migration và đăng ký đúng email owner:

- /admin — tổng quan.
- /admin/site — cấu hình chung và các khối nội dung.
- /admin/pages — tạo trang /p/slug không cần code.
- /admin/menu — menu header/footer và mạng xã hội.
- /admin/seo — title, description, canonical, robots, Open Graph, schema và sitemap.
- /admin/redirects — redirect theo đường dẫn.
- /admin/users — tài khoản, role và trạng thái.
- /admin/cv — hồ sơ và các mục CV.
- /admin/news — danh mục và bài báo.
- /admin/software — nhóm và app.
- /admin/data — nhóm dữ liệu, mục dữ liệu và cấp quyền.
- /admin/tools — tool, cấu hình riêng và vòng quỹ đạo.
- /admin/media — ảnh/tệp R2.
- /admin/api — API Vault, mẫu gọi API và lịch chạy.

## 6. Việc nào làm trong Admin, việc nào cần code?

| Công việc | Admin | Cần sửa code |
|---|---:|---:|
| Sửa tiêu đề, mô tả, footer, mạng xã hội | Có | Không |
| Thêm menu hoặc trỏ menu tới URL mới | Có | Không |
| Tạo trang nội dung dạng bài/trang thường | Có | Không |
| Thêm bài báo, app, dữ liệu, CV | Có | Không |
| Đổi ảnh/icon/PDF CV | Có, tải qua R2 | Không |
| Bật/tắt tool ở Trang chủ, Công cụ, quỹ đạo | Có | Không |
| Yêu cầu đăng nhập hoặc giới hạn role | Có | Không |
| Thêm title/meta/schema/sitemap cho route | Có | Không |
| Thêm redirect nội bộ | Có | Không |
| Cài API key và lịch gọi | Có | Không |
| Tạo thuật toán/tool hoàn toàn mới | Sau khi có route | Có |
| Tạo một mẫu giao diện hoàn toàn mới | Sau khi có template | Có |

Admin không nhận đoạn JavaScript tùy ý để chạy. Đây là chủ ý bảo mật. Với API mới, lập trình viên thêm một adapter/mẫu gọi an toàn một lần; sau đó Admin quản lý URL, key, header, body, bật/tắt và lịch.

## 7. Tạo tool mới đúng chuẩn

### 7.1 Tạo module độc lập

~~~text
public/tool-modules/ten-tool/
├── index.html
├── module.css
├── module.js
├── core.js           # tùy chọn: thuật toán lớn
└── vendor/           # tùy chọn: thư viện offline
~~~

index.html chỉ dựng cấu trúc. Gọi CSS chung trước CSS riêng:

~~~html
<link rel="stylesheet" href="/tool-modules/shared/module-base.css">
<link rel="stylesheet" href="./module.css">
<script defer src="./core.js"></script>
<script defer src="./module.js"></script>
~~~

Không chép Header/Footer vào tool. Header/Footer đã nằm trong app/layout.tsx.

### 7.2 Tạo route Next.js

Tạo app/tools/ten-tool/page.tsx và dùng ToolFrame:

~~~tsx
"use client";
import { ToolFrame } from "../../../components/ToolFrame";

export default function ToolPage() {
  return <ToolFrame src="/tool-modules/ten-tool/index.html" title="Tên tool" tall flush />;
}
~~~

Tạo app/tools/ten-tool/layout.tsx để kiểm tra quyền và SEO:

~~~tsx
import { enforceToolAccess } from "../../../lib/auth/tool-access";
import { buildRouteMetadata } from "../../../lib/public/metadata";

export async function generateMetadata() {
  return buildRouteMetadata("/tools/ten-tool", { title: "Tên tool", description: "Mô tả" });
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  await enforceToolAccess("ten-tool");
  return children;
}
~~~

### 7.3 Khai báo trong Admin

Vào Admin → Tool → Danh sách tool và tạo:

- slug: ten-tool
- route: /tools/ten-tool
- visible: bật
- show_home: có/không
- show_orbit: có/không
- orbit_ring, orbit_angle: vị trí quỹ đạo
- requires_auth, allowed_roles: quyền truy cập
- settings: cấu hình JSON riêng của tool

Từ thời điểm route tồn tại, việc hiện/ẩn ở Trang chủ, Công cụ, quỹ đạo và quyền truy cập đều do Admin; không sửa app/page.tsx.

## 8. API mới

Code server chỉ gọi theo slug:

~~~ts
await fetch("/api/integrations/ten-api", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ payload: { /* dữ liệu không bí mật */ } })
});
~~~

Trong Admin → API:

1. Tạo API integration, khai báo allowed_host, base_url, method và template.
2. Bấm cài bí mật để lưu key vào Vault.
3. Nếu cần tự chạy, tạo lịch trong Lịch gọi API.
4. Với provider có cách ký request đặc biệt, thêm adapter server trong lib/integrations; tuyệt đối không đưa secret vào frontend.

## 9. Quiz và dữ liệu được cấp

1. Admin tải file JSON lên R2 tại Thư viện.
2. Admin tạo Nhóm dữ liệu.
3. Admin tạo Mục dữ liệu, chọn loại quiz_json và chọn tệp R2.
4. Nếu private, Admin cấp mục đó cho user trong Cấp quyền dữ liệu.
5. User đăng nhập, mở Quiz → chọn dữ liệu được cấp.
6. Server kiểm tra quyền rồi trả file; Quiz nhập dữ liệu vào bộ nhớ trình duyệt và tiếp tục chạy local.

Quiz không gửi đáp án hoặc tiến độ làm bài lên Internet trừ khi sau này chủ động phát triển tính năng đồng bộ.

## 10. Thay tên miền

Không lưu cứng tên miền trong nội dung. Khi đổi domain chỉ cần:

1. Đổi SITE_URL và NEXT_PUBLIC_SITE_URL trên Render.
2. Cập nhật Site URL/Redirect URLs trong Supabase Auth.
3. Thêm origin mới vào CORS của R2.
4. Trỏ DNS Cloudflare sang Render.
5. Sửa site_url tại Admin → Cấu hình chung.

Không phải chuyển database, R2 hay sửa toàn bộ source.

## 11. Tài liệu chi tiết

- DEPLOY_A_Z.md — cài máy mới, Supabase, R2, GitHub, Render, domain và scheduler.
- HUONG_DAN_QUAN_TRI_SOURCE.md — hướng dẫn từng màn hình Admin và cách thêm/bớt nội dung.

## 12. Nguyên tắc bảo mật

- Không commit .env.local, service-role key, R2 secret hoặc API key.
- Không dùng service-role key trong component client.
- Quyền được kiểm tra đồng thời ở server và RLS.
- Tài khoản mới ở trạng thái pending cho đến khi được Admin duyệt/phân role.
- Redirect chỉ dùng đường dẫn nguồn hợp lệ; redirect toàn domain vẫn nên đặt ở Cloudflare/Render.
- R2 private phải tải qua API có kiểm tra quyền, không phát public URL.
