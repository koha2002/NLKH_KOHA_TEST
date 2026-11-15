# NLKH KOHA — Admin V4

Bản này là **overlay nâng cấp** cho repository `koha2002/NLKH_KOHA` hiện tại, không phải một website mới viết lại từ số 0.

Frontend gốc vẫn là **Next.js static export**. Admin được tách thành một **Render Static Site** riêng và dữ liệu/quyền dùng Supabase + Cloudflare R2.

## 1. Những gì Admin V4 đã đổi

- Bỏ màn hình **Tổng quan**; đăng nhập xong đi thẳng **Cấu hình chung**.
- Form có dấu `*` đỏ chỉ ở trường thật sự bắt buộc; trường bắt buộc có điều kiện chỉ hiện `*` khi điều kiện đó đang đúng.
- Lỗi lưu trả về đúng trường cần sửa: trùng slug, thiếu trường bắt buộc, sai URL, sai JSON, foreign key không còn tồn tại, sai quyền, migration chưa đồng bộ…
- Tất cả trường đều có placeholder/help; dấu `?` có tooltip giải thích.
- Thứ tự tự quản lý theo kiểu `1, 2, 3…`, không yêu cầu nhập `10, 20, 30…`.
- Quan hệ như Menu cha, Nhóm, Vai trò, Danh mục… dùng dropdown/checkbox; không bắt Admin nhớ UUID.
- Ảnh/tệp được tải hoặc chọn **ngay trong form** qua Cloudflare R2.
- R2 có ID dễ đọc `R2-000001`, `R2-000002`…; ID tăng dần, xóa rồi không dùng lại.
- Upload có SHA-256 để nhận diện file giống hệt và tái sử dụng ID có sẵn thay vì lưu bản trùng.
- Có preview / chọn ID cũ / thay file giữ ID / bỏ liên kết / xóa ID R2.
- Thêm Tool mới thì Admin sidebar tự sinh mục con; frontend Tools/Home/Orbit tự đồng bộ ở lần build tiếp theo.
- Tool có thể dùng source Git như cũ hoặc dán HTML thuần vào Admin và chạy thử trong iframe sandbox trước khi lưu.
- User avatar tải R2; người chưa có avatar hiện chữ viết tắt từ tên.
- Data permission có `Chỉ đọc`, `Thêm mới`, `Full`; Admin cấp nhiều tài liệu cho một tài khoản bằng checkbox.
- Bình luận tin tức vào hàng chờ Supabase; chỉ khi Admin **Duyệt** mới ghi JSON vào R2 và hiển thị công khai.
- Phần mềm hỗ trợ file tải bằng **Link hoặc R2**; R2 có chế độ công khai hoặc bắt đăng nhập bằng signed URL.
- PDF Studio có nút **Offline / Online**. Online giữ flow iLovePDF có sẵn trong source; Offline dùng `pdf-lib`/Canvas cho những chức năng làm được tại trình duyệt.

## 2. OG image và Favicon khác nhau

### OG image

OG = Open Graph. Đây là ảnh preview khi chia sẻ link website/bài viết lên Facebook, Zalo, LinkedIn hoặc dịch vụ đọc metadata.

**OG image không phải icon trên tab trình duyệt.**

Admin V4 có:
- `Ảnh chia sẻ mặc định (OG image)` trong **Cấu hình chung**;
- `Ảnh chia sẻ riêng cho trang` trong **SEO**.

Nếu trang không có OG riêng, frontend dùng OG mặc định.

### Favicon

Favicon là icon nhỏ ở:
- tab trình duyệt;
- bookmark/favorite;
- một số danh sách lịch sử/trình duyệt.

Admin V4 có trường riêng **Icon trên tab trình duyệt (Favicon)** và frontend đưa URL này vào Next Metadata khi build.

## 3. R2 ID hoạt động như thế nào?

Database giữ UUID nội bộ để quan hệ an toàn, nhưng Admin hiển thị thêm `asset_no` theo dạng:

```text
R2-000001
R2-000002
R2-000003
```

`asset_no` dùng sequence/bigserial nên tăng ở database/cloud, **không liên quan máy tính của bạn**.

Một asset lưu:
- R2 ID dễ đọc;
- UUID database;
- object key thật trên bucket;
- tên file gốc;
- MIME type;
- dung lượng;
- SHA-256;
- quyền public/authenticated/private;
- thư mục logic;
- nơi đang dùng asset.

Khi upload file giống hệt file đã có trong cùng mức quyền, hệ thống trả ID cũ và không upload thêm bản trùng.

## 4. Quy tắc xóa R2

Admin Media có quyền xóa file vật lý.

Nếu một ID R2 đang được Site/SEO/Tool/News/CV/Data dùng, thao tác xóa bình thường bị chặn và chỉ rõ đang được dùng ở đâu. Admin có thể chọn xóa bắt buộc; khi đó hệ thống gỡ các reference trước.

Người dùng được cấp `Full` cho Data có thể xóa **mục dữ liệu** đã cấp. Hệ thống **không tự xóa file vật lý R2** vì file có thể đang được tái sử dụng ở chỗ khác. Xóa file vật lý vẫn là việc của Admin Media.

## 5. Ý nghĩa quyền Data

- **Chỉ đọc**: xem/tải tài liệu đã được tích.
- **Thêm mới**: xem tài liệu được tích và được tạo tài liệu mới trong cùng nhóm; không sửa/xóa tài liệu hiện có.
- **Full**: xem, thêm, sửa và xóa mục dữ liệu được cấp.

Admin chọn một tài khoản rồi tích nhiều tài liệu; không phải chọn từng tài liệu một lần.

## 6. CV

Admin V4 chỉ dùng **một hồ sơ CV chính**.

Migration khởi tạo dữ liệu mẫu theo `public/content/cv/profile.json` của source gốc. Admin có thể sửa:
- thông tin chính;
- ảnh;
- PDF;
- học vấn;
- chứng chỉ;
- kỹ năng;
- kinh nghiệm;
- dự án/ngôn ngữ/custom section;
- thứ tự;
- ẩn/hiện từng mục.

`Hiển thị hồ sơ` = bật/tắt toàn bộ CV ngoài website. Nó **không phải** quyền file. Riêng `Quyền tải file PDF CV` có 3 mức: Công khai / Cần đăng nhập / Ẩn nút tải; khi dùng R2, file mới được lưu theo mức quyền tương ứng.

Theme mặc định:

```json
{
  "layout": "source-default",
  "accent": "blue",
  "show_photo": true,
  "show_contact": true,
  "show_download_pdf": true
}
```

Nếu chưa cần đổi sâu, giữ mẫu này.

## 7. Tool mới

Khi tạo Tool:

- `slug` là route/thư mục, ví dụ `kiem-tra-cap`;
- `route` thường là `/tools/kiem-tra-cap`;
- icon upload/chọn R2 ngay trong form;
- màu dùng color picker;
- role dùng checkbox;
- `Code HTML thuần` để trống = dùng `public/tool-modules/<slug>/index.html` trong Git;
- nếu điền HTML = build tạo `public/tool-modules/_admin/<slug>/index.html` và route dùng bản này;
- nút `Chạy thử HTML` chạy trong iframe sandbox trước khi lưu.

Sau khi sửa Tool/Nội dung/SEO/CV/News và cần cập nhật static output, bấm **Xuất bản frontend**.


## 7.1. Phần mềm: Link hay R2?

Mỗi phần mềm có `Nguồn file tải`:

- **Liên kết bên ngoài**: dùng Drive/OneDrive/website khác. Nếu chọn “Cần đăng nhập”, Admin chỉ khóa nút ở frontend; bản thân URL ngoài phải tự có bảo vệ nếu cần bí mật thật.
- **Cloudflare R2**: upload/chọn ID ngay trong form. Chọn “Cần đăng nhập” sẽ lưu/chọn asset mức `authenticated`; frontend chỉ xin signed URL sau khi người dùng đăng nhập. Đây là lựa chọn nên dùng cho file cần kiểm soát tải.

## 8. PDF Online / Offline

Bản nâng cấp **không xóa code online** hiện tại.

- **Online**: tiếp tục chạy `module.js` gốc và iLovePDF API/public project key đang có trong source.
- **Offline**: chạy hoàn toàn trên trình duyệt cho các tác vụ phù hợp như merge PDF, tách trang, xoay PDF, watermark chữ, đánh số trang và nhiều thao tác ảnh.
- Các tác vụ cần engine/server mà browser không xử lý tương đương sẽ yêu cầu chuyển sang Online.

Script build chỉ inject menu Offline/Online và thư viện offline; nó không ghi đè `public/tool-modules/pdf/module.js` gốc.

## 9. Scheduler secret không phụ thuộc PowerShell/máy tính

Chuỗi `SCHEDULER_SECRET` chỉ là một secret ngẫu nhiên dùng để xác thực request giữa cloud services.

Admin có nút **Tạo khóa ngẫu nhiên an toàn** bằng Web Crypto. Copy cùng một giá trị sang:
- Supabase Edge Function Secrets;
- GitHub Actions Secrets.

Sau khi đã lưu trên cloud, tắt máy tính không ảnh hưởng gì. Không dùng `[guid]::NewGuid()` để “duy trì” hệ thống.

## 10. Redirect trên web static

Admin vẫn cho chọn 301/302/307/308 và giải thích từng loại. Tuy nhiên file HTML static của Render tự nó trả HTTP 200 rồi mới chuyển ở browser.

Nếu cần **HTTP status redirect thật** cho SEO/migration URL, tạo rule tương ứng ở Cloudflare/Render. Bản build static vẫn tạo fallback redirect để người dùng không bị kẹt link cũ.
