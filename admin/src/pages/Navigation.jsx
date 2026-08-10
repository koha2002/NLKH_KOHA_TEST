import React from"react";import TableManager from"../components/TableManager";import{AdminPage}from"./_shared";import{f}from"../schema";
const roleRel={table:"roles",select:"id,name",valueKey:"id",labelKey:"name",orderBy:"id"};
const menuRel={table:"navigation_items",select:"id,label_vi,href,sort_order",valueKey:"id",label:o=>`${o.label_vi} — ${o.href}`,orderBy:"sort_order"};
export default function Navigation({access}){return <AdminPage access={access}>
<TableManager title="Menu Header / Footer" description="Tạo mục điều hướng cho đầu trang, chân trang hoặc cả hai. Thứ tự tự tăng 1, 2, 3… khi thêm mới." table="navigation_items" orderBy="sort_order" ascending defaults={{visible:true,location:"header",sort_order:1}} fields={[
 f.text("label_vi","Tên menu (VI)",{required:true,placeholder:"Ví dụ: Công cụ",help:"Chữ người dùng nhìn thấy trên menu."}),
 f.text("label_en","Tên menu (EN)",{placeholder:"Tools",help:"Có thể để trống nếu chưa cần tiếng Anh."}),
 f.text("href","Đường dẫn khi bấm",{required:true,placeholder:"/tools hoặc https://...",help:"Trang sẽ mở khi người dùng bấm menu. Route nội bộ thường bắt đầu bằng /."}),
 f.sel("location","Hiển thị ở đâu?",[{value:"header",label:"Chỉ Header"},{value:"footer",label:"Chỉ Footer"},{value:"both",label:"Cả Header và Footer"}],{required:true,help:"Chọn vị trí xuất hiện của mục menu."}),
 f.relation("parent_id","Menu cha (nếu là menu con)",menuRel,{nullable:true,placeholder:"— Đây là menu cấp 1 —",help:"Không cần nhập ID. Chọn một menu đã có làm menu cha. Nếu để trống thì đây là menu cấp 1."}),
 f.media("icon_media_id","Icon menu",{kind:"image",mirrorUrlField:"icon_url",help:"Icon dùng khi giao diện cần biểu tượng cho mục menu. Tải thẳng lên R2 hoặc chọn ID đã có; không phải dán link."}),
 f.hidden("icon_url"),
 f.sort("sort_order","Thứ tự",{required:true,help:"Số nhỏ đứng trước. Hệ thống tự đề xuất số tiếp theo 1, 2, 3…"}),
 f.bool("visible","Hiển thị",{trueLabel:"Hiển thị mục menu"}),
 f.bool("requires_auth","Yêu cầu đăng nhập",{trueLabel:"Chỉ tài khoản đăng nhập mới thấy mục này",help:"Nếu bật, khách chưa đăng nhập sẽ không thấy menu."}),
 f.checks("allowed_roles","Vai trò được xem",roleRel,{showWhen:form=>!!form.requires_auth,help:"Chỉ có tác dụng khi cần giới hạn theo vai trò. Không tích vai trò nào = mọi tài khoản hợp lệ đều được xem."}),
 f.bool("open_new_tab","Mở tab mới",{trueLabel:"Mở liên kết trong tab mới",help:"Thường bật cho link ra website bên ngoài."})
]}/>
<TableManager title="Liên kết mạng xã hội" description="Các icon/link ở Footer. Icon cũng chọn/tải trực tiếp từ R2." table="social_links" orderBy="sort_order" ascending defaults={{visible:true,sort_order:1}} fields={[
 f.text("platform","Nền tảng",{required:true,placeholder:"facebook",help:"Mã ngắn dùng nội bộ, ví dụ facebook, youtube, linkedin."}),
 f.text("label","Tên hiển thị",{required:true,placeholder:"Facebook"}),
 f.url("url","Liên kết",{required:true,placeholder:"https://...",help:"URL trang mạng xã hội."}),
 f.media("icon_media_id","Icon",{kind:"image",mirrorUrlField:"icon",help:"Tải icon mới hoặc tái sử dụng ID R2 đã có."}),
 f.hidden("icon"),f.sort("sort_order","Thứ tự",{required:true}),f.bool("visible","Hiển thị",{trueLabel:"Hiển thị liên kết này"})
]}/>
</AdminPage>}
