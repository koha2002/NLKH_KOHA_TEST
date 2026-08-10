import React from"react";import TableManager from"../components/TableManager";import{AdminPage}from"./_shared";import{f}from"../schema";
const roles={table:"roles",select:"id,name",valueKey:"id",labelKey:"name",orderBy:"id"};
export default function Content({access}){return <AdminPage access={access}>
<TableManager title="Trang nội dung" description="Dùng để tạo các trang nội dung CMS như /p/gioi-thieu, /p/chinh-sach… mà không phải viết thêm file React. Không phải trang chủ/CV/Tool chuyên dụng." table="content_pages" defaults={{template:"standard",status:"draft",requires_auth:false}} fields={[
 f.text("slug","Slug (mã trong URL)",{required:true,placeholder:"gioi-thieu",help:"Slug là phần cuối của địa chỉ. Ví dụ slug gioi-thieu tạo URL /p/gioi-thieu. Dùng chữ thường, số và dấu gạch ngang; không dùng khoảng trắng.",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug chỉ dùng a-z, 0-9 và dấu gạch ngang; ví dụ gioi-thieu.":null}),
 f.text("title_vi","Tiêu đề (VI)",{required:true,placeholder:"Giới thiệu"}),f.text("title_en","Tiêu đề (EN)",{placeholder:"About"}),
 f.area("excerpt_vi","Mô tả ngắn (VI)",{placeholder:"1–2 câu tóm tắt trang…",help:"Dùng trên danh sách/SEO nếu cần."}),f.area("excerpt_en","Mô tả ngắn (EN)",{placeholder:"Optional…"}),
 f.area("content_vi","Nội dung (VI)",{required:true,rows:16,placeholder:"Nhập nội dung văn bản. Xuống dòng sẽ được giữ khi hiển thị.",help:"Nội dung chính của trang. Nếu cần trình soạn thảo Markdown/rich text có thể bổ sung sau; bản này ưu tiên hiển thị văn bản an toàn."}),
 f.area("content_en","Nội dung (EN)",{rows:16,placeholder:"Optional English content…"}),
 f.sel("template","Mẫu giao diện",[{value:"standard",label:"Standard — trang nội dung thường"},{value:"article",label:"Article — bài dài"},{value:"landing",label:"Landing — trang giới thiệu"}],{required:true,help:"Mã giao diện quyết định bố cục hiển thị. Nếu chưa có template riêng, chọn Standard."}),
 f.sel("status","Trạng thái",[{value:"draft",label:"Nháp — chưa công khai"},{value:"published",label:"Đã xuất bản"},{value:"archived",label:"Lưu trữ — không còn dùng"}],{required:true,help:"Chỉ Published mới dành cho người dùng bình thường."}),
 f.bool("requires_auth","Yêu cầu đăng nhập",{trueLabel:"Chỉ người đã đăng nhập mới xem được",help:"Dùng cho trang nội dung chỉ dành cho thành viên."}),
 f.checks("allowed_roles","Vai trò được xem",roles,{help:"Nếu cần giới hạn sâu hơn, tích các vai trò được phép. Để trống = không giới hạn theo role."}),
 f.dt("published_at","Ngày/giờ xuất bản",{nullable:true,placeholder:"Để trống nếu xuất bản ngay",help:"Thời điểm hiển thị/ghi nhận bài được xuất bản. Có thể để trống nếu không cần lịch."})
]}/>
<TableManager title="Khối nội dung trang chủ" description="Các khối đã có trên trang chủ như Hero/Thông tin nhanh. Chỉ sửa khi muốn thay nội dung cấu hình của một khối." table="content_blocks" orderBy="sort_order" ascending defaults={{visible:true}} fields={[
 f.text("page_key","Trang",{required:true,placeholder:"home",help:"Mã trang chứa khối; hiện chủ yếu là home."}),f.text("block_key","Mã khối",{required:true,placeholder:"hero",help:"Mã kỹ thuật của khối, thường không đổi."}),f.text("label","Tên dễ nhớ",{required:true,placeholder:"Trang chủ / Hero"}),f.json("content","Nội dung khối",{required:true,help:"Cấu trúc dữ liệu cho khối. Giữ các key sẵn có; chỉ thay giá trị nếu không chắc."}),f.sort("sort_order","Thứ tự",{required:true}),f.bool("visible","Hiển thị",{trueLabel:"Hiển thị khối này"})
]}/></AdminPage>}
