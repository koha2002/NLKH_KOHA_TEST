import React from "react";
import TableManager from "../components/TableManager";
import { AdminPage } from "./_shared";
import { f } from "../schema";

const roles={table:"roles",select:"id,name",valueKey:"id",labelKey:"name",orderBy:"id"};
const groups={table:"tool_categories",select:"id,name_vi,slug,sort_order",valueKey:"id",label:o=>`${o.name_vi} (${o.slug})`,orderBy:"sort_order"};
const isHtml=form=>form.tool_type==="html";
const isSource=form=>!isHtml(form);

export default function Tools({access,openId=null}){
 return <AdminPage access={access}>
  <TableManager title="Nhóm Tool" description="Bạn tự tạo nhóm như Tiện ích, Công việc, Bổ trợ, Kỹ thuật, Học tập…" table="tool_categories" orderBy="sort_order" ascending defaults={{visible:true}} fields={[
    f.text("slug","Slug nhóm",{required:true,placeholder:"tien-ich",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug chỉ dùng a-z, 0-9 và dấu gạch ngang.":null}),
    f.text("name_vi","Tên nhóm (VI)",{required:true,placeholder:"Tiện ích"}),
    f.text("name_en","Tên nhóm (EN)",{placeholder:"Utilities"}),
    f.area("description_vi","Mô tả VI"),
    f.area("description_en","Mô tả EN"),
    f.sort("sort_order","Thứ tự",{required:true}),
    f.bool("visible","Hiển thị",{trueLabel:"Hiển thị nhóm"})
  ]}/>
  <TableManager
    title="Danh sách Tool / Tool list"
    description="Tool public được build thành snapshot; /tools chỉ render 6 mục mỗi trang."
    table="tools" orderBy="sort_order" ascending openId={openId}
    defaults={{tool_type:"html",status:"ready",visible:true,show_home:true,show_orbit:false,orbit_ring:1,orbit_angle:0,sort_order:1,requires_auth:false,accent:"#3157f6",settings:{}}}
    fields={[
      f.sel("tool_type","Loại Tool / Tool type",[
        {value:"html",label:"HTML thuần / Static HTML — tạo trực tiếp từ Admin"},
        {value:"source",label:"Source Git / Module — dùng code trong repository"}
      ],{required:true}),
      f.relation("category_id","Nhóm Tool",groups,{nullable:true,placeholder:"— Không phân nhóm —"}),
      f.text("slug","Slug / URL",{required:true,placeholder:"quiz-moi",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug chỉ dùng chữ thường, số và dấu gạch ngang.":null}),
      f.text("title_vi","Tên Tool (VI)",{required:true,placeholder:"Luyện đề"}),
      f.text("title_en","Tên Tool (EN)",{placeholder:"Quiz practice"}),
      f.text("code","Mã ngắn hiển thị",{showWhen:isSource,requiredWhen:isSource,placeholder:"PDF"}),
      f.text("route","Đường dẫn",{showWhen:isSource,requiredWhen:isSource,placeholder:"/tools/pdf"}),
      f.area("description_vi","Mô tả (VI)",{showWhen:isSource}),
      f.area("description_en","Mô tả (EN)",{showWhen:isSource}),
      f.text("icon","Icon key",{showWhen:isSource}),
      f.text("accent","Màu nhấn",{showWhen:isSource}),
      f.sel("status","Trạng thái",["ready","beta","hidden"].map(x=>({value:x,label:x})),{showWhen:isSource}),
      f.bool("visible","Hiển thị"),
      f.bool("show_home","Hiện trang chủ",{showWhen:isSource}),
      f.bool("show_orbit","Hiện orbit",{showWhen:isSource}),
      f.num("orbit_ring","Orbit ring",{showWhen:isSource,min:1,max:20}),
      f.num("orbit_angle","Orbit angle",{showWhen:isSource,min:0,max:360}),
      f.sort("sort_order","Thứ tự",{required:true}),
      f.bool("requires_auth","Yêu cầu đăng nhập",{showWhen:isSource,trueLabel:"Chỉ người đăng nhập mới mở được route Tool"}),
      f.checks("allowed_roles","Vai trò được dùng",roles,{showWhen:form=>isSource(form)&&!!form.requires_auth}),
      f.html("inline_html","Code HTML thuần / Static HTML",{showWhen:isHtml,requiredWhen:isHtml,rows:24,placeholder:"Dán nguyên file HTML: <!DOCTYPE html> ..."}),
      f.json("settings","Cấu hình riêng",{showWhen:isSource,placeholder:'{\n  "featureFlag": true\n}'}),
      f.area("admin_note","Ghi chú nội bộ",{showWhen:isSource})
    ]}
  />
 </AdminPage>;
}