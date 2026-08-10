import React from"react";import TableManager from"../components/TableManager";import{AdminPage}from"./_shared";import{f}from"../schema";
export default function Site({access}){return <AdminPage access={access}><TableManager title="Cấu hình chung" description="Các thông tin nền của website. Dấu * màu đỏ là bắt buộc; các mục còn lại có thể để trống." table="site_settings" singleRow allowDelete={false} allowAdd={false} fields={[
 f.text("site_name","1. Tên website",{required:true,placeholder:"Nguyễn Lê Khánh Hòa",help:"Tên thương hiệu/website hiển thị ở tiêu đề và footer."}),
 f.url("site_url","2. Địa chỉ website chính",{required:true,placeholder:"https://nguyenlekhanhhoa.com",help:"Domain chính của frontend. Dùng để tạo canonical, sitemap và liên kết tuyệt đối."}),
 f.text("default_title_vi","3. Tiêu đề mặc định (VI)",{required:true,placeholder:"Nguyễn Lê Khánh Hòa | Kỹ sư điện",help:"Tiêu đề dùng khi một trang chưa có SEO riêng."}),
 f.text("default_title_en","4. Tiêu đề mặc định (EN)",{placeholder:"Nguyen Le Khanh Hoa | Electrical Engineer",help:"Có thể để trống nếu chưa dùng tiếng Anh."}),
 f.area("description_vi","5. Mô tả website (VI)",{placeholder:"Mô tả ngắn 1–2 câu về website…",help:"Mô tả mặc định cho công cụ tìm kiếm và khi chia sẻ nếu trang chưa có mô tả riêng."}),
 f.area("description_en","6. Mô tả website (EN)",{placeholder:"Optional English description…",help:"Không bắt buộc."}),
 f.media("og_media_id","7. Ảnh chia sẻ mặc định (OG image)",{kind:"image",mirrorUrlField:"default_og_image",help:"OG image KHÔNG phải icon trên tab. Đây là ảnh đại diện khi link website được chia sẻ trên Facebook/Zalo/LinkedIn và các nền tảng đọc Open Graph. Bạn có thể tải mới hoặc chọn lại ID R2 đã có để tránh trùng file."}),
 f.hidden("default_og_image"),
 f.media("favicon_media_id","8. Icon trên tab trình duyệt (Favicon)",{kind:"image",mirrorUrlField:"favicon_url",help:"Đây mới là ảnh/icon nhỏ ở tab trình duyệt, bookmark và một số giao diện trình duyệt. Nên dùng PNG/WebP vuông; có thể chọn lại ID R2 cũ."}),
 f.hidden("favicon_url"),
 f.text("contact_email","9. Email liên hệ",{required:true,placeholder:"khanhhoa2002.hh@gmail.com",help:"Email chung hiển thị/liên hệ trên website."}),
 f.area("footer_intro_vi","10. Giới thiệu ngắn ở Footer (VI)",{placeholder:"Một câu mô tả ngắn…",help:"Nội dung dưới tên website ở chân trang."}),
 f.area("footer_intro_en","11. Giới thiệu Footer (EN)",{placeholder:"Optional…"}),
 f.text("copyright_text","12. Dòng bản quyền",{placeholder:"© 2026 Nguyễn Lê Khánh Hòa",help:"Dòng cuối footer."}),
 f.bool("news_enabled","13. Bật mục Tin tức",{trueLabel:"Hiển thị mục Tin tức trên website"}),
 f.bool("registration_enabled","14. Cho phép đăng ký tài khoản",{trueLabel:"Người mới có thể tạo tài khoản"}),
 f.bool("maintenance_mode","15. Chế độ bảo trì",{trueLabel:"Bật trạng thái bảo trì"}),
 f.json("extra","16. Cấu hình nâng cao",{placeholder:'{\n  "languageDefault": "vi"\n}',help:"Chỉ dùng khi một chức năng mới cần tham số bổ sung. Nếu không biết mục này, giữ nguyên {}."})
 ]}/></AdminPage>}
