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
