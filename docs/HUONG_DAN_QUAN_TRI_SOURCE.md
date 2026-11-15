# Hướng dẫn quản trị nội dung và phát triển source

Mục tiêu của hệ thống mới: việc thay nội dung hằng ngày thực hiện trong Admin; chỉ sửa source khi tạo thuật toán, route hoặc kiểu giao diện hoàn toàn mới.

## 1. Quy tắc lưu dữ liệu

| Loại | Nơi lưu | Ví dụ |
|---|---|---|
| Nội dung/cấu hình | Supabase Database | menu, CV, bài báo, app, SEO, quyền |
| Tài khoản | Supabase Auth + profiles/roles | email, trạng thái, vai trò |
| Tệp | Cloudflare R2 | ảnh, icon, PDF, Quiz JSON |
| Bí mật | Supabase API Vault | API key/provider secret |
| Source | GitHub | giao diện, thuật toán, API adapter |

Không lưu tài khoản/mật khẩu/API key trong JSON ở public. File public có thể bị bất kỳ ai tải.

## 2. Đăng nhập Admin và phân quyền

### Owner đầu tiên

Đăng ký bằng khanhhoa2002.hh@gmail.com sau khi migration hoàn tất. Email này được gán owner và active tự động.

### User mới

1. User mở /login → Đăng ký.
2. Supabase gửi email xác thực.
3. User bấm link xác thực.
4. Tài khoản mặc định pending/member.
5. Owner/Admin mở Admin → Người dùng, chọn role và đổi status thành active.

### Vai trò và permission

- owner: toàn quyền.
- admin: gần toàn quyền quản trị.
- editor: quyền nội dung theo cấu hình role.
- member: dùng chức năng được cấp.

Admin → Người dùng → Vai trò cho phép tạo role mới. permissions là mảng JSON, ví dụ:

~~~json
["news.manage", "media.manage"]
~~~

Người viết báo chỉ cần hai quyền trên, không cần quyền user/API/SEO.

## 3. Cấu hình chung và Trang chủ

Admin → Website → Cấu hình chung:

- site_name, site_url.
- title/description mặc định VI/EN.
- email, footer, copyright.
- bật/tắt đăng ký.
- bật/tắt tin tức.
- maintenance_mode.

Admin → Website → Khối nội dung dùng cấu trúc page_key + block_key.

Các block Trang chủ đã có:

| page_key | block_key | Công dụng |
|---|---|---|
| home | hero | câu chào, tên, nhãn và nút |
| home | facts | dải thông tin nổi bật |
| home | capabilities | nhóm năng lực |
| home | workspace | tiêu đề khu sản phẩm/tool |

Sửa trường content dạng JSON, không sửa app/page.tsx. Giữ đúng cấu trúc object/array hiện có; nên sao chép nội dung cũ ra tệp dự phòng trước khi thay JSON lớn.

## 4. Tạo một trang mới không viết code

Ví dụ tạo /p/gioi-thieu-du-an:

1. Admin → Trang nội dung → Tạo mới.
2. slug: gioi-thieu-du-an.
3. Điền title/excerpt/content VI và EN.
4. Nội dung hỗ trợ Markdown.
5. Chọn template standard, wide hoặc article.
6. Chọn published và ngày xuất bản; để trống ngày nghĩa là xuất bản ngay.
7. Nếu cần khóa, bật requires_auth và điền allowed_roles.
8. Admin → Menu → tạo mục có href /p/gioi-thieu-du-an.
9. Admin → SEO → tạo route /p/gioi-thieu-du-an.

Trang published, không khóa sẽ tự vào sitemap.

Nếu muốn một kiểu trang đặc biệt như bảng giá tương tác, bản đồ hoặc dashboard, cần code thêm template/component một lần; nội dung sau đó vẫn có thể lấy từ Admin.

## 5. Header, menu, footer và mạng xã hội

Admin → Menu & footer.

### Menu

- location: header hoặc footer.
- href: đường dẫn nội bộ hoặc URL đầy đủ.
- parent_id: menu cha nếu cần.
- sort_order: số nhỏ hiện trước.
- visible: hiện/ẩn.
- requires_auth: chỉ người đăng nhập thấy.
- allowed_roles: giới hạn role.
- open_new_tab: mở tab mới.

Muốn thêm mục Tin tức: href /news. Muốn ẩn một mục: tắt visible, không cần xóa.

### Mạng xã hội

Tạo/sửa/xóa ở danh sách social:

- YouTube.
- Instagram.
- LinkedIn.
- TikTok.
- Email.

Muốn bỏ GitHub ở footer: tìm dòng platform GitHub rồi tắt visible hoặc xóa. Không sửa components/Footer.tsx.

Footer tự lấy footer_intro và copyright ở Cấu hình chung.

## 6. SEO, sitemap và index

Admin → SEO, mỗi route một bản ghi:

- route: /news, /cv, /p/slug...
- title_vi/title_en.
- description_vi/description_en.
- canonical_path.
- og_image và og_type.
- indexable và follow_links.
- schema_type và structured_data JSON.
- change_frequency và priority cho sitemap.

Metadata route được server tạo tự động. Không nhét thẻ meta vào từng HTML tool.

Sitemap ở /sitemap.xml tự tổng hợp:

- route SEO indexable.
- tool visible, không khóa.
- bài báo published.
- trang nội dung published, không khóa.

Không chỉnh app/sitemap.ts khi chỉ thêm nội dung mới. Search Console chỉ cần gửi URL sitemap một lần.

## 7. Redirect

Admin → Redirect:

- source_path: /duong-dan-cu.
- target_url: /duong-dan-moi hoặc URL đầy đủ.
- status_code: 301 cho chuyển vĩnh viễn, 302/307 cho tạm thời.
- preserve_query: giữ query string.
- active: bật/tắt.

Admin phù hợp redirect đường dẫn. Chuyển toàn bộ domain cũ sang domain mới nên tạo Cloudflare Redirect Rule để hoạt động cả khi app gặp sự cố.

Không tạo vòng lặp A → B và B → A.

## 8. CV

Admin → CV có hai phần.

### Hồ sơ chính

Sửa:

- tên, vai trò, headline, tóm tắt VI/EN.
- ngày sinh, địa chỉ, điện thoại, email.
- photo_url.
- pdf_url.
- theme và published.

Ảnh và PDF:

1. Admin → Thư viện → tải ảnh/PDF lên R2.
2. Sao chép public URL nếu file công khai.
3. Dán vào photo_url hoặc pdf_url.

### Mục CV

Mỗi mục là một cv_section:

- section_type: education, experience, certification, skill, project...
- title/subtitle VI/EN.
- period, organization, description, URL.
- sort_order, visible.
- data JSON cho dữ liệu bổ sung.

Thêm kinh nghiệm mới chỉ tạo section mới. Không sửa giao diện CV. Nếu muốn đổi hoàn toàn bố cục CV, code thêm theme rồi chọn tên theme trong hồ sơ.

## 9. Kho phần mềm/App

Admin → Phần mềm.

### Tạo nhóm

1. Mở Nhóm phần mềm.
2. Tạo slug, tên VI/EN.
3. sort_order và visible.

### Thêm app

1. Tải icon/cover lên R2.
2. Tạo Phần mềm.
3. Chọn category.
4. Điền name, slug, description.
5. Điền icon_url, cover_url và download_url.
6. Điền version, compatibility, nhãn giá.
7. Bật visible/featured và đặt thứ tự.

App tự xuất hiện ở /software, tìm kiếm và bộ lọc. Không sửa app/software/page.tsx.

Xóa app không xóa tệp R2 tự động; nếu không dùng nữa, xóa riêng trong bucket/thư viện để tránh xóa nhầm file đang được mục khác dùng.

## 10. Dữ liệu: nhóm, mục và cấp quyền

### 10.1 Tạo nhóm dữ liệu

Admin → Dữ liệu → Nhóm dữ liệu:

- slug, tên, mô tả VI/EN.
- icon.
- visibility:
  - public: ai cũng thấy.
  - authenticated: mọi user đã đăng nhập.
  - private: chỉ user được cấp.
- visible và sort_order.

### 10.2 Thêm tài liệu/link/tệp

Admin → Dữ liệu → Tài liệu & liên kết:

1. Chọn collection_id.
2. Điền tiêu đề/mô tả.
3. Chọn item_type:
   - link: link ngoài/Google Drive/FileShare.
   - r2_file: tệp R2.
   - quiz_json: dữ liệu nhập trực tiếp vào Quiz.
   - document hoặc video.
4. Link ngoài dùng external_url.
5. Tệp R2 chọn media_id hoặc object_key.
6. Chọn visibility, visible, sort_order.
7. metadata là JSON mở rộng.

### 10.3 Cấp riêng cho user

Với mục private:

1. Admin → Cấp quyền dữ liệu.
2. Chọn user_id.
3. Chọn item_id.
4. Đặt expires_at nếu quyền có hạn; để trống nếu không hết hạn.

RLS và API kiểm tra quyền trước khi cấp tệp.

### 10.4 Quiz lấy JSON từ tài khoản

Tạo item_type = quiz_json. Khi user được cấp mở Quiz, bộ chọn Dữ liệu hiển thị mục đó. User chọn tệp, server lấy từ R2 và Quiz nhập vào local/browser. File không được dùng làm database câu hỏi trực tiếp và không tự đồng bộ tiến độ lên server.

## 11. Tin tức

Admin → Tin tức.

### Danh mục

Tạo slug, tên/mô tả VI/EN, màu, thứ tự và visible.

### Bài báo

Điền:

- slug.
- category.
- title, subtitle, excerpt, content VI/EN.
- cover_image và alt.
- author_name, translator_name, editor_name.
- source_name, source_url.
- tags JSON.
- draft/published/archived.
- featured, comments, published_at.

Nội dung hỗ trợ Markdown. Bài published tự có URL /news/slug, metadata và sitemap. Với bài dịch, luôn ghi nguồn và tác giả gốc; không sao chép toàn bài vi phạm bản quyền.

## 12. Tool và vòng quỹ đạo

### Tool đã có code

Sau khi route/tool module đã được push:

1. Admin → Tool → tạo bản ghi cùng slug.
2. route phải khớp route trong code.
3. Điền title/description/icon/accent.
4. visible điều khiển danh sách Công cụ.
5. show_home điều khiển thẻ Trang chủ.
6. show_orbit điều khiển quỹ đạo.
7. status, sort_order.
8. requires_auth/allowed_roles.
9. settings JSON là cấu hình riêng.

Không cần thêm lại tool vào app/page.tsx, data/home-products.ts hoặc orbit.config.ts. Database hiện là nguồn cấu hình chính.

### Tạo thuật toán tool mới

Phải tạo source theo README:

- public/tool-modules/ten-tool/index.html.
- module.css.
- module.js.
- core.js/vendor nếu có.
- app/tools/ten-tool/page.tsx.
- app/tools/ten-tool/layout.tsx.

Sau đó mọi việc hiện/ẩn/phân quyền/quỹ đạo được Admin điều khiển.

### Vòng quỹ đạo

Admin → Quỹ đạo:

- size: kích thước vòng.
- duration: thời gian quay.
- reverse: đảo chiều.
- dashed: nét đứt.
- dot_angle/dot_tone.
- sort_order, visible.

Trong bản ghi tool:

- orbit_ring trỏ đến vòng.
- orbit_angle đặt góc.
- icon có thể là URL R2 hoặc biểu tượng hệ thống.

Có thể thêm nhiều vòng và mục mà không sửa component ToolOrbit.

## 13. Cấu hình riêng từng tool

Admin → Tool có trang riêng cho Quiz, PDF và COMTRADE. Không đưa mọi tùy chọn vào Cấu hình chung.

- Quiz: quyền, nguồn dữ liệu, giới hạn/import theo settings.
- PDF: bật/tắt tác vụ local và integration trực tuyến.
- COMTRADE: giới hạn file, tùy chọn parser/biểu đồ.

Nếu thêm field settings mới, code tool phải đọc field đó. Admin chỉ lưu cấu hình; Admin không tự tạo thuật toán.

## 14. PDF local và API

Các tác vụ đang làm local, không tải tài liệu lên server:

- gộp PDF.
- lấy/tách trang.
- xóa trang.
- sắp xếp trang.
- xoay trang.
- watermark.
- số trang.
- JPG/PNG thành PDF.

Các tác vụ cần engine đặc biệt như OCR chất lượng cao, Office sang PDF chính xác hoặc chỉnh nội dung nâng cao có thể gọi provider API. Khi đó:

1. Code tạo nút/adapter server.
2. Admin → API tạo integration.
3. Secret lưu trong Vault.
4. Tool chỉ gọi slug integration, không biết key.

## 15. API Vault và lịch gọi

### Tạo integration

Admin → API → Tích hợp:

- slug/name.
- base_url.
- allowed_host: chống SSRF, phải đúng host provider.
- endpoint_template.
- method.
- headers/query/body template.
- key_placeholder.
- scope, timeout và active.

Sau đó dùng form Cài bí mật. Secret chỉ ghi vào Vault; API danh sách không trả lại secret.

Admin không cho dán code JavaScript tùy ý. Provider cần OAuth, chữ ký HMAC hay định dạng đặc biệt phải có adapter trong lib/integrations.

### Lịch gọi

Tạo scheduled job:

- integration_id.
- handler = integration hoặc supabase_keepalive.
- endpoint_path và request_payload.
- interval_minutes tối thiểu 15.
- enabled và next_run_at.

GitHub Actions gọi runner mỗi 30 phút. Job keepalive mặc định chỉ chạy mỗi 1440 phút.

## 16. Thư viện R2

Admin → Thư viện:

1. Chọn tệp.
2. Chọn thư mục logic.
3. Chọn public/authenticated/private.
4. Browser upload trực tiếp bằng signed URL ngắn hạn.
5. Metadata được ghi vào media_assets.

Ảnh/icon/CV có thể tải hoàn toàn từ Admin; không cần mở R2 Dashboard. Với 2–5 GB, R2 phù hợp hơn GitHub. Không commit file lớn vào repo.

## 17. Thay nội dung và deploy

### Chỉ thay nội dung Admin

Không cần Git commit hoặc Render deploy. Dữ liệu lưu Supabase/R2 và website đọc lại.

### Thay source/tool/giao diện

~~~powershell
git status
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
git add .
git commit -m "Mo ta thay doi"
git pull --rebase origin main
git push origin main
~~~

Render Auto Deploy sẽ chạy.

## 18. Sao lưu

- Supabase: xuất schema/data định kỳ.
- R2: giữ quy ước folder và danh sách object.
- GitHub: source và migration.
- Trước khi xóa nhóm, kiểm tra các item con.
- Trước khi xóa media, kiểm tra CV/news/software/data có dùng URL đó.
- API secret nên có bản ghi an toàn ngoài source để có thể thay vòng khóa.
