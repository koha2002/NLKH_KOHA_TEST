# NLKH Portal — nguyenlekhanhhoa.com

Website cá nhân của Nguyễn Lê Khánh Hòa: hồ sơ, công cụ chạy trên trình duyệt, kho phần mềm, tin tức. Nội dung được quản lý bằng một Admin riêng, không cần sửa code cho việc thường ngày.

## Kiến trúc

| Phần | Công nghệ | Thư mục | Nơi chạy |
|---|---|---|---|
| Website công khai | Next.js 16 (static export) | `app/`, `components/`, `lib/`, `styles/` | Render Static Site `nguyen-le-khanh-hoa` |
| Admin | Vite + React 19 | `admin/` | Render Static Site `nlkh-admin` |
| Công cụ (Quiz, PDF, COMTRADE, Remove Background) | HTML/JS chạy ngay trong trình duyệt | `public/tool-modules/` | Nhúng vào website qua iframe |
| Backend | Supabase: Postgres, Auth, RLS, Edge Functions | `supabase/` | Supabase |
| Tệp, ảnh | Cloudflare R2 qua Edge Function `r2-file` | — | Cloudflare |
| Thu thập tin công nghệ | Worker | `workers/technology-news/` | — |
| Lịch chạy định kỳ | GitHub Actions, 15 phút một lần | `.github/workflows/` | GitHub |

Cấu hình deploy nằm trong `render.yaml`. Redirect thật được xử lý ở Cloudflare.

## Nhánh

`admin-v4` là nhánh đang chạy thật. Các nhánh `backup/*` chỉ là bản sao lưu, không cần đụng tới.

## Chạy trên máy (Node.js 22.13 trở lên)

    Copy-Item .env.example .env.local
    npm install
    npm run dev                 # http://localhost:3000

    cd admin
    Copy-Item .env.example .env.local
    npm install
    npm run dev                 # http://localhost:5174

## Trước khi push

    npm run build
    npx tsc --noEmit
    npm run test:comtrade
    npm run test:pdf
    cd admin; npm run build

## Việc nào làm ở đâu

- Nội dung, menu, SEO, tin tức, CV, phần mềm, redirect, API key: làm trong Admin, sau đó bấm **Xuất bản frontend**.
- Công cụ mới hoặc giao diện mới: cần sửa code. Xem `docs/README_CU.md`, mục "Tạo tool mới".

## Lưu ý

- `data/admin-generated.ts` do `scripts/sync-admin-cms.mjs` sinh lúc build. Không sửa tay. Giữ trong Git làm bản dự phòng khi thiếu biến môi trường.
- Không commit `.env*`, service-role key, R2 secret hay API key. Thư mục `supabase/.temp/` đã được ignore.

## Tài liệu

- `docs/DEPLOY_A_Z.md`: cài máy mới, Supabase, R2, GitHub, Render, domain, scheduler.
- `docs/DEPLOY_ADMIN_V4_A_Z.md`: triển khai Admin V4.
- `docs/HUONG_DAN_QUAN_TRI_SOURCE.md`: hướng dẫn từng màn hình Admin.
- `docs/README_ADMIN_V4.md`: các tính năng Admin V4.
- `docs/README_CU.md`: README cũ (hướng dẫn tạo tool và API).
- `CHANGELOG.md`: nhật ký các bản vá.