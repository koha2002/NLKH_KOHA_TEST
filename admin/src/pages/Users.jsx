import React from"react";
import TableManager from"../components/TableManager";
import UserTraffic from"../components/UserTraffic";
import{AdminPage}from"./_shared";
import{f}from"../schema";
import{invoke}from"../lib/supabase";

const roleRel={table:"roles",select:"id,name",valueKey:"id",label:o=>`${o.name} (${o.id})`,orderBy:"id"};
const permissions=[
 {value:"site.manage",label:"Cấu hình website"},{value:"content.manage",label:"Nội dung & CV"},
 {value:"seo.manage",label:"SEO & Redirect"},{value:"tools.manage",label:"Tool"},
 {value:"news.manage",label:"Tin tức"},{value:"software.manage",label:"Phần mềm"},
 {value:"data.manage",label:"Dữ liệu"},{value:"media.manage",label:"Thư viện R2"},
 {value:"users.manage",label:"Người dùng"},{value:"api.manage",label:"API & lịch chạy"},
 {value:"*",label:"Toàn quyền"}
];
export default function Users({access}){return <AdminPage access={access}>
 <UserTraffic/>
 <TableManager title="Người dùng" description="Sửa tên/avatar/vai trò/trạng thái. Status Active là điều kiện cơ bản để dùng nội dung cần tài khoản." table="profiles" allowAdd={false} allowDelete orderBy="created_at" canDelete={r=>r.id!==access?.id&&r.role_id!=="owner"} deleteHandler={async r=>invoke("user-admin",{action:"delete-user",user_id:r.id})} fields={[
  f.text("email","Email",{readonly:true}),f.text("display_name","Tên hiển thị",{required:true}),
  f.media("avatar_media_id","Avatar",{kind:"image",mirrorUrlField:"avatar_url"}),f.hidden("avatar_url"),
  f.relation("role_id","Vai trò",roleRel,{required:true}),
  f.sel("status","Trạng thái",[{value:"pending",label:"Chờ duyệt"},{value:"active",label:"Đang hoạt động"},{value:"suspended",label:"Tạm khóa"}],{required:true})
 ]}/>
 <TableManager title="Vai trò & quyền" description="Vai trò cũng được dùng để giới hạn tải từng phần mềm nếu Admin chọn role allow-list." table="roles" idField="id" orderBy="id" ascending fields={[
  f.text("id","Mã vai trò",{required:true}),f.text("name","Tên vai trò",{required:true}),f.checkOptions("permissions","Chức năng được phép",permissions),f.area("description","Mô tả vai trò")
 ]}/>
</AdminPage>}