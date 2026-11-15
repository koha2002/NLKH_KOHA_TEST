# Claude context — NLKH_KOHA_TEST

- Nhánh: `admin-v4`, commit: `c3f8780`, tạo lúc: 2026-11-15T14:47:27.176Z
- Tổng nội dung code: 2258KB trong 19 file
- Chuỗi giống key/secret đã bị che. Ảnh, thư viện bên thứ ba, file sinh tự động chỉ được liệt kê ở `99_ASSETS.md`.

## Các nhóm chức năng (mỗi nhóm là một hoặc vài file .txt)

| Nhóm | Mô tả | Số file nguồn | Dung lượng | File |
|---|---|---|---|---|
| 00_docs | Tài liệu | 7 | 76KB | 00_docs_01.txt |
| 10_frontend | Website công khai (Next.js: app, components, lib, styles, data) | 84 | 265KB | 10_frontend_01.txt, 10_frontend_02.txt |
| 20_admin | Admin (Vite + React) | 37 | 164KB | 20_admin_01.txt, 20_admin_02.txt |
| 31_tool_pdf | Tool PDF Studio | 19 | 279KB | 31_tool_pdf_01.txt, 31_tool_pdf_02.txt |
| 32_tool_quiz | Tool Quiz | 6 | 151KB | 32_tool_quiz_01.txt |
| 33_tool_comtrade | Tool COMTRADE | 4 | 56KB | 33_tool_comtrade_01.txt |
| 34_tool_removebg | Tool Remove Background | 5 | 72KB | 34_tool_removebg_01.txt |
| 35_tool_shared | CSS dùng chung của các tool | 1 | 1.4KB | 35_tool_shared_01.txt |
| 40_supabase_functions | Supabase Edge Functions (backend) | 16 | 91KB | 40_supabase_functions_01.txt |
| 41_supabase_migrations | Supabase migrations (cấu trúc database) | 23 | 129KB | 41_supabase_migrations_01.txt |
| 50_worker | Worker thu thập tin công nghệ | 2 | 213KB | 50_worker_01.txt, 50_worker_02.txt |
| 60_build_config | Cấu hình, build, deploy, script | 29 | 58KB | 60_build_config_01.txt |
| 90_other | Khác | 21 | 702KB | 90_other_01.txt, 90_other_02.txt, 90_other_03.txt |

## Bản đồ chức năng -> nơi chứa code

- **Đăng nhập, tài khoản, quên mật khẩu**: app/login, app/account, lib/supabase-browser.ts
- **Đồng bộ nội dung CMS về website**: scripts/sync-admin-cms.mjs -> data/admin-generated.ts
- **Công cụ (iframe) và quyền truy cập tool**: components/AdminToolRoute.tsx, ToolFrame.tsx, lib/auth/tool-access.ts, public/tool-modules
- **Tin tức**: app/news, components/News*, supabase/functions/news-*, workers/technology-news
- **Kho phần mềm**: app/software, admin/src/pages/Software.jsx
- **Hồ sơ CV**: app/cv, admin/src/pages/Cv.jsx
- **Dữ liệu cấp quyền**: app/data, admin/src/pages/Data.jsx, admin/src/components/DataAccessMatrix.jsx
- **Ảnh/tệp (Cloudflare R2)**: supabase/functions/r2-file, admin/src/pages/Media.jsx
- **Sao lưu**: supabase/functions/manual-backup, admin/src/pages/Backup.jsx
- **Redirect (Cloudflare)**: supabase/functions/cloudflare-redirect-sync, admin/src/pages/Redirects.jsx
- **Xuất bản / deploy Render**: supabase/functions/render-deploy, render.yaml
- **Lịch chạy định kỳ**: .github/workflows/supabase-scheduler.yml, supabase/functions/schedule-runner

## Danh sách file nguồn (kèm dung lượng)

### 00_docs

- CHANGELOG.md (15KB)
- README.md (2.7KB)
- docs/DEPLOY_ADMIN_V4_A_Z.md (16KB)
- docs/DEPLOY_A_Z.md (11KB)
- docs/HUONG_DAN_QUAN_TRI_SOURCE.md (13KB)
- docs/README_ADMIN_V4.md (8.4KB)
- docs/README_CU.md (9.3KB)

### 10_frontend

- app/account/account.module.css (2.3KB)
- app/account/layout.tsx (0.2KB)
- app/account/page.tsx (10KB)
- app/account/reset-password/page.tsx (4.4KB)
- app/account/reset-password/reset-password.module.css (1.1KB)
- app/auth/callback/page.tsx (3.2KB)
- app/automation-auth/layout.tsx (0.2KB)
- app/automation-auth/page.tsx (2.2KB)
- app/cv/cv.module.css (6.5KB)
- app/cv/layout.tsx (0.3KB)
- app/cv/page.tsx (19KB)
- app/data/data.module.css (4.7KB)
- app/data/layout.tsx (0.2KB)
- app/data/page.tsx (12KB)
- app/globals.css (0.1KB)
- app/home.module.css (6.1KB)
- app/layout.tsx (1.0KB)
- app/login/layout.tsx (0.2KB)
- app/login/login.module.css (1.5KB)
- app/login/page.tsx (5.5KB)
- app/news/[slug]/article.module.css (6.4KB)
- app/news/[slug]/layout.tsx (2.5KB)
- app/news/[slug]/page.tsx (1.2KB)
- app/news/layout.tsx (0.3KB)
- app/news/news.module.css (4.8KB)
- app/news/page.tsx (0.4KB)
- app/p/[slug]/page.module.css (1.0KB)
- app/p/[slug]/page.tsx (1.1KB)
- app/page.tsx (5.5KB)
- app/robots.ts (0.4KB)
- app/sitemap.ts (2.5KB)
- app/software/layout.tsx (2.2KB)
- app/software/page.tsx (8.3KB)
- app/software/software.module.css (4.7KB)
- app/tools/comtrade/layout.tsx (0.6KB)
- app/tools/comtrade/page.tsx (0.6KB)
- app/tools/layout.tsx (0.3KB)
- app/tools/page.tsx (3.7KB)
- app/tools/pdf/layout.tsx (0.5KB)
- app/tools/pdf/merge/page.tsx (6.1KB)
- app/tools/pdf/page.tsx (0.6KB)
- app/tools/pdf/pdf.module.css (5.8KB)
- app/tools/quiz/layout.tsx (0.5KB)
- app/tools/quiz/page.tsx (0.7KB)
- app/tools/remove-background/layout.tsx (0.6KB)
- app/tools/remove-background/page.tsx (0.5KB)
- app/tools/tool-page.module.css (1.3KB)
- app/tools/tools.module.css (2.8KB)
- components/AdminSeoJsonLd.tsx (0.3KB)
- components/AdminToolRoute.tsx (4.9KB)
- components/CmsContentPage.tsx (2.2KB)
- components/FeatureIcon.tsx (2.8KB)
- components/Footer.module.css (1.4KB)
- components/Footer.tsx (2.8KB)
- components/Header.module.css (4.7KB)
- components/Header.tsx (6.4KB)
- components/LanguageProvider.tsx (2.1KB)
- components/NewsArticleClient.tsx (3.3KB)
- components/NewsComments.module.css (1.0KB)
- components/NewsComments.tsx (3.0KB)
- components/NewsPageClient.tsx (10KB)
- components/PublicShellProvider.tsx (2.5KB)
- components/QuizDataPicker.module.css (1.4KB)
- components/QuizDataPicker.tsx (5.5KB)
- components/SafeMarkdown.tsx (3.2KB)
- components/ScrollToTop.module.css (0.7KB)
- components/ScrollToTop.tsx (2.2KB)
- components/SitePresence.tsx (3.9KB)
- components/ToolFrame.module.css (0.6KB)
- components/ToolFrame.tsx (4.5KB)
- components/ToolOrbit/ToolOrbit.module.css (4.9KB)
- components/ToolOrbit/ToolOrbit.tsx (3.8KB)
- components/ToolOrbit/orbit.config.ts (2.6KB)
- components/usePublicTools.ts (2.2KB)
- data/home-products.ts (2.3KB)
- lib/admin-seo.ts (3.0KB)
- lib/auth/tool-access.ts (1.2KB)
- lib/i18n.ts (12KB)
- lib/public/metadata.ts (1.4KB)
- lib/public/site-content.ts (1.9KB)
- lib/supabase-browser.ts (4.0KB)
- lib/supabase/server.ts (1.4KB)
- styles/base.css (1.2KB)
- styles/tokens.css (1.7KB)

### 20_admin

- admin/scripts/postbuild-routes.mjs (1.5KB)
- admin/src/App.jsx (1.9KB)
- admin/src/brand-fix.css (0.4KB)
- admin/src/components/AdminShell.jsx (4.1KB)
- admin/src/components/CommentsModeration.jsx (2.3KB)
- admin/src/components/DataAccessMatrix.jsx (3.8KB)
- admin/src/components/MediaPicker.jsx (7.3KB)
- admin/src/components/RequireAccess.jsx (1.0KB)
- admin/src/components/SystemUsage.jsx (3.7KB)
- admin/src/components/TableManager.jsx (22KB)
- admin/src/components/UserTraffic.jsx (5.5KB)
- admin/src/lib/access.js (0.5KB)
- admin/src/lib/media.js (3.4KB)
- admin/src/lib/notify.js (0.2KB)
- admin/src/lib/supabase.js (1.0KB)
- admin/src/main.jsx (0.3KB)
- admin/src/pages/Api.jsx (7.1KB)
- admin/src/pages/AuthCallback.jsx (0.4KB)
- admin/src/pages/Backup.jsx (25KB)
- admin/src/pages/Content.jsx (3.9KB)
- admin/src/pages/Cv.jsx (5.9KB)
- admin/src/pages/Data.jsx (1.8KB)
- admin/src/pages/Login.jsx (0.9KB)
- admin/src/pages/Media.jsx (5.4KB)
- admin/src/pages/Navigation.jsx (3.6KB)
- admin/src/pages/News.jsx (6.3KB)
- admin/src/pages/Redirects.jsx (3.9KB)
- admin/src/pages/Seo.jsx (4.0KB)
- admin/src/pages/Site.jsx (4.1KB)
- admin/src/pages/Software.jsx (3.8KB)
- admin/src/pages/Tools.jsx (4.0KB)
- admin/src/pages/Users.jsx (2.2KB)
- admin/src/pages/_shared.jsx (0.2KB)
- admin/src/schema.js (1.2KB)
- admin/src/scroll-fix.css (1.5KB)
- admin/src/styles.css (15KB)
- admin/src/theme-v48.css (3.2KB)

### 31_tool_pdf

- public/tool-modules/pdf/crop-image-v55.css (2.9KB)
- public/tool-modules/pdf/crop-image-v55.js (11KB)
- public/tool-modules/pdf/i18n-v48.js (6.7KB)
- public/tool-modules/pdf/index.html (9.2KB)
- public/tool-modules/pdf/module.css (12KB)
- public/tool-modules/pdf/module.js (34KB)
- public/tool-modules/pdf/offline-v2.css (1.0KB)
- public/tool-modules/pdf/offline-v2.js (22KB)
- public/tool-modules/pdf/page-number-pro-v3.css (5.7KB)
- public/tool-modules/pdf/page-number-pro-v3.js (29KB)
- public/tool-modules/pdf/pdf-lib-lazy-v33.js (2.4KB)
- public/tool-modules/pdf/pdf-preview-v52.css (3.6KB)
- public/tool-modules/pdf/pdf-preview-v52.mjs (22KB)
- public/tool-modules/pdf/pdf-ui-v50.css (7.8KB)
- public/tool-modules/pdf/pdf-ui-v50.js (63KB)
- public/tool-modules/pdf/tile-pages-v62.css (2.2KB)
- public/tool-modules/pdf/tile-pages-v62.js (15KB)
- public/tool-modules/pdf/v48.css (1.8KB)
- public/tool-modules/pdf/watermark-image-fix-v4.js (26KB)

### 32_tool_quiz

- public/tool-modules/quiz/i18n-v48.js (7.8KB)
- public/tool-modules/quiz/index.html (24KB)
- public/tool-modules/quiz/module.css (11KB)
- public/tool-modules/quiz/module.js (89KB)
- public/tool-modules/quiz/tailwind-v24.css (18KB)
- public/tool-modules/quiz/v48.css (1.1KB)

### 33_tool_comtrade

- public/tool-modules/comtrade/comtrade-core.js (9.4KB)
- public/tool-modules/comtrade/index.html (7.1KB)
- public/tool-modules/comtrade/module.css (12KB)
- public/tool-modules/comtrade/module.js (28KB)

### 34_tool_removebg

- public/tool-modules/remove-background/THIRD_PARTY.md (0.4KB)
- public/tool-modules/remove-background/index.html (7.2KB)
- public/tool-modules/remove-background/manifest.json (0.6KB)
- public/tool-modules/remove-background/remove-background-v29.css (12KB)
- public/tool-modules/remove-background/remove-background-v29.js (52KB)

### 35_tool_shared

- public/tool-modules/shared/module-base.css (1.4KB)

### 40_supabase_functions

- supabase/functions/_shared/auth.ts (1.6KB)
- supabase/functions/_shared/cors.ts (0.7KB)
- supabase/functions/_shared/crypto.ts (1.1KB)
- supabase/functions/cloudflare-redirect-sync/index.ts (13KB)
- supabase/functions/integration-proxy/index.ts (2.8KB)
- supabase/functions/integration-secret/index.ts (0.9KB)
- supabase/functions/manual-backup/index.ts (21KB)
- supabase/functions/news-article-delete/index.ts (3.7KB)
- supabase/functions/news-comment/index.ts (6.0KB)
- supabase/functions/news-media-ingest/index.ts (6.2KB)
- supabase/functions/r2-file/index.ts (17KB)
- supabase/functions/render-deploy/index.ts (5.4KB)
- supabase/functions/schedule-runner/index.ts (1.6KB)
- supabase/functions/site-traffic/index.ts (5.8KB)
- supabase/functions/system-usage/index.ts (3.4KB)
- supabase/functions/user-admin/index.ts (1.3KB)

### 41_supabase_migrations

- supabase/migrations/202608090001_initial_cms.sql (35KB)
- supabase/migrations/202608090002_content_pages_access.sql (0.7KB)
- supabase/migrations/202608100001_static_split.sql (1.7KB)
- supabase/migrations/202608100002_admin_ux_v4.sql (20KB)
- supabase/migrations/202608100003_software_r2_only.sql (0.5KB)
- supabase/migrations/202608100004_software_link_or_r2.sql (1.1KB)
- supabase/migrations/202608100005_legacy_import_cloudflare_redirects.sql (2.3KB)
- supabase/migrations/202608110001_v48_system_update.sql (6.7KB)
- supabase/migrations/202608110003_html_tool_combined.sql (1.5KB)
- supabase/migrations/20260812095600_admin_system_usage.sql (0.9KB)
- supabase/migrations/20260813083500_technology_news_ingest.sql (1.2KB)
- supabase/migrations/20260813152000_news_article_media.sql (1.0KB)
- supabase/migrations/20260813154500_news_article_auto_datetime.sql (0.7KB)
- supabase/migrations/20260813160000_technology_news_ingest_deleted_draft_reset.sql (1.2KB)
- supabase/migrations/20260813163000_news_existing_draft_repair.sql (0.1KB)
- supabase/migrations/20260814090000_perf_access_presence.sql (3.4KB)
- supabase/migrations/20260814093000_google_drive_backup.sql (3.5KB)
- supabase/migrations/20260814100000_manual_full_backup.sql (7.1KB)
- supabase/migrations/20260814103000_manual_full_backup_v2.sql (7.5KB)
- supabase/migrations/20260814133000_presence_v3_reliable.sql (1.5KB)
- supabase/migrations/20260817105000_detailed_web_cv.sql (18KB)
- supabase/migrations/20260817111500_restore_cv_left_column.sql (6.0KB)
- supabase/migrations/20260817113000_fix_cv_left_utf8.sql (5.7KB)

### 50_worker

- workers/technology-news/package.json (0.2KB)
- workers/technology-news/src/index.ts (212KB)

### 60_build_config

- .env.example (0.2KB)
- .github/workflows/claude-context.yml (0.9KB)
- .github/workflows/supabase-scheduler.yml (0.5KB)
- .gitignore (0.1KB)
- .npmrc (0.1KB)
- .nvmrc (0.0KB)
- R2_CORS.example.json (0.3KB)
- admin/.env.example (0.2KB)
- admin/index.html (0.4KB)
- admin/package.json (0.5KB)
- admin/vite.config.js (0.2KB)
- eslint.config.mjs (0.5KB)
- next-env.d.ts (0.2KB)
- next.config.ts (0.2KB)
- package.json (1.3KB)
- render.yaml (3.1KB)
- scripts/build-static-redirects.mjs (0.5KB)
- scripts/export-claude-context.mjs (8.4KB)
- scripts/harden-tool-modules.mjs (1.4KB)
- scripts/optimize-home-assets.mjs (3.2KB)
- scripts/patch-pdf-mode.mjs (1.2KB)
- scripts/prepare-pdf-vendor.mjs (0.6KB)
- scripts/sync-admin-cms.mjs (23KB)
- scripts/test-comtrade.mjs (2.0KB)
- scripts/test-pdf-crop-v55.mjs (1.4KB)
- scripts/test-pdf-v63-state-i18n.mjs (3.4KB)
- serve-static.mjs (1.7KB)
- supabase/config.toml (0.4KB)
- tsconfig.json (0.7KB)

### 90_other

- admin/dist/api/index.html (0.5KB)
- admin/dist/assets/index-BzlDh3cB.css (19KB)
- admin/dist/assets/index-C9G9qSe1.js (658KB)
- admin/dist/assets/zip-reader-DQs8FtXe.js (15KB)
- admin/dist/auth/callback/index.html (0.5KB)
- admin/dist/backup/index.html (0.5KB)
- admin/dist/content/index.html (0.5KB)
- admin/dist/cv/index.html (0.5KB)
- admin/dist/data/index.html (0.5KB)
- admin/dist/index.html (0.5KB)
- admin/dist/login/index.html (0.5KB)
- admin/dist/media/index.html (0.5KB)
- admin/dist/navigation/index.html (0.5KB)
- admin/dist/news/index.html (0.5KB)
- admin/dist/redirects/index.html (0.5KB)
- admin/dist/seo/index.html (0.5KB)
- admin/dist/site/index.html (0.5KB)
- admin/dist/software/index.html (0.5KB)
- admin/dist/tools/index.html (0.5KB)
- admin/dist/users/index.html (0.5KB)
- public/feature-icons/README.md (0.3KB)

