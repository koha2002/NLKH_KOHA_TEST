import React from"react";import TableManager from"../components/TableManager";import{AdminPage}from"./_shared";import{f}from"../schema";
export default function Redirects({access}){return <AdminPage access={access}><TableManager title="Redirect" description="Chuyển một URL cũ sang URL mới. Khi bấm Xuất bản frontend, build tạo trang redirect static tương ứng. Các mã 301/302/307/308 bên dưới là ý nghĩa HTTP chuẩn; muốn máy chủ/CDN trả đúng status code thật thì cần đồng bộ thêm Cloudflare/Render Redirect Rule (file HTML static tự nó trả 200 rồi chuyển bằng trình duyệt)." table="redirects" orderBy="source_path" ascending defaults={{status_code:301,active:true,preserve_query:true}} fields={[
 f.text("source_path","Đường dẫn cũ",{required:true,placeholder:"/cv-cu",help:"URL cần chuyển đi, thường chỉ nhập path bắt đầu bằng /."}),
 f.text("target_url","Chuyển tới",{required:true,placeholder:"/cv hoặc https://...",help:"Đường dẫn/URL đích sau khi redirect."}),
 f.sel("status_code","Loại redirect",[{value:301,label:"301 — chuyển vĩnh viễn, SEO chuyển sang URL mới"},{value:302,label:"302 — chuyển tạm thời"},{value:307,label:"307 — tạm thời và giữ nguyên phương thức HTTP"},{value:308,label:"308 — vĩnh viễn và giữ nguyên phương thức HTTP"}],{required:true,help:"Thông thường khi đổi URL lâu dài dùng 301. 302/307 dùng cho chuyển tạm thời; 308 giống 301 nhưng bảo toàn method/body."}),
 f.bool("active","Kích hoạt",{trueLabel:"Redirect đang hoạt động"}),
 f.bool("preserve_query","Giữ query string",{trueLabel:"Giữ các tham số sau dấu ?",help:"Ví dụ /old?ref=facebook → /new?ref=facebook. Tắt nếu muốn bỏ các tham số query khi chuyển."}),
 f.area("note","Ghi chú nội bộ",{placeholder:"Lý do chuyển URL…",help:"Chỉ Admin thấy, không hiển thị ngoài website."})
]}/></AdminPage>}
