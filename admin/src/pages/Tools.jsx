import React from"react";import TableManager from"../components/TableManager";import{AdminPage}from"./_shared";import{f}from"../schema";
const roles={table:"roles",select:"id,name",valueKey:"id",labelKey:"name",orderBy:"id"};
export default function Tools({access,openId=null}){return <AdminPage access={access}><TableManager title="Danh sách Tool" description="Thêm Tool ở đây sẽ tự xuất hiện trong menu Tool bên trái Admin. Nếu ô HTML để trống, frontend dùng module có sẵn trong source Git tại public/tool-modules/<slug>/index.html; nếu dán HTML thì frontend chạy HTML đó trực tiếp." table="tools" orderBy="sort_order" ascending openId={openId} defaults={{status:"ready",visible:true,show_home:true,show_orbit:true,orbit_ring:1,orbit_angle:0,sort_order:1,requires_auth:false,accent:"#3157f6",settings:{}}} fields={[
 f.text("slug","Slug / mã thư mục",{required:true,placeholder:"pdf",help:"Mã URL và tên thư mục tool. Ví dụ pdf tương ứng /tools/pdf và public/tool-modules/pdf/.",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug chỉ dùng chữ thường, số và dấu gạch ngang.":null}),
 f.text("code","Mã ngắn hiển thị",{required:true,placeholder:"PDF",help:"Chữ ngắn trên card/quỹ đạo, ví dụ PDF, QUIZ, CFG."}),
 f.text("route","Đường dẫn",{required:true,placeholder:"/tools/pdf",help:"Route public của tool. Thường là /tools/<slug>."}),
 f.text("title_vi","Tên Tool (VI)",{required:true,placeholder:"PDF Studio"}),f.text("title_en","Tên Tool (EN)",{placeholder:"PDF Studio"}),
 f.area("description_vi","Mô tả (VI)",{placeholder:"Tool dùng để làm gì…"}),f.area("description_en","Mô tả (EN)",{placeholder:"Optional…"}),
 f.media("icon_media_id","Icon / logo Tool",{kind:"image",mirrorUrlField:"icon",help:"Tải trực tiếp lên R2 hoặc dùng lại ID đã có. Không cần dán link thủ công."}),
 f.hidden("icon"),
 f.color("accent","Màu chủ đạo",{required:true,help:"Chọn màu trực quan bằng bảng màu; không cần nhớ tên/code màu."}),
 f.sel("status","Trạng thái",[{value:"ready",label:"Ready — dùng ổn định"},{value:"beta",label:"Beta — đang thử nghiệm"},{value:"maintenance",label:"Maintenance — tạm bảo trì"}],{required:true,help:"Nhãn trạng thái để người dùng biết mức sẵn sàng."}),
 f.bool("visible","Hiển thị Tool",{trueLabel:"Cho Tool xuất hiện trên website"}),f.bool("show_home","Hiện ở Trang chủ",{trueLabel:"Hiện card Tool ở Trang chủ"}),f.bool("show_orbit","Hiện ở vòng quỹ đạo",{trueLabel:"Hiện Tool trong vòng tròn/quỹ đạo"}),
 f.num("orbit_ring","Vòng quỹ đạo",{min:1,max:10,step:1,help:"1 = vòng gần tâm nhất trong cấu hình hiện tại; đổi số để chuyển Tool sang vòng khác."}),f.num("orbit_angle","Góc trên vòng",{min:0,max:359,step:1,help:"0–359 độ, quyết định vị trí Tool trên vòng."}),f.sort("sort_order","Thứ tự",{required:true,help:"Tự tăng 1, 2, 3…; dùng để sắp danh sách Tool."}),
 f.bool("requires_auth","Yêu cầu đăng nhập",{trueLabel:"Chỉ người đăng nhập mới mở được route Tool"}),f.checks("allowed_roles","Vai trò được dùng",roles,{showWhen:form=>!!form.requires_auth,help:"Tích các vai trò được phép. Để trống = mọi tài khoản hợp lệ nếu Tool yêu cầu login."}),
 f.html("inline_html","Code HTML thuần của Tool",{rows:18,placeholder:"ĐỂ TRỐNG = dùng source Git.\nHoặc dán nguyên HTML <!doctype html>... để chạy trực tiếp.",help:"Dùng để test/triển khai Tool HTML thuần từ Admin. Có nút Chạy thử trước khi lưu. Không đặt API secret trong HTML vì trình duyệt có thể xem được."}),
 f.json("settings","Cấu hình riêng",{placeholder:'{\n  "featureFlag": true\n}',help:"Các tham số riêng mà code Tool có thể đọc. Nếu Tool không dùng cấu hình bổ sung thì giữ {}."}),
 f.area("admin_note","Ghi chú nội bộ",{placeholder:"Ghi chú cho lần sửa sau…",help:"Chỉ Admin thấy."})
]}/></AdminPage>}
