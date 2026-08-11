import React from "react";
import TableManager from "../components/TableManager";
import { AdminPage } from "./_shared";
import { f } from "../schema";

const roles={table:"roles",select:"id,name",valueKey:"id",labelKey:"name",orderBy:"id"};
const isHtml=form=>form.tool_type==="html";
const isSource=form=>!isHtml(form);

export default function Tools({access,openId=null}){
  return <AdminPage access={access}><TableManager
    title="Danh sách Tool / Tool list"
    description="HTML thuần: tạo, chạy thử và xuất bản trực tiếp từ Admin; không cần tạo page/thư mục riêng trong Git. Source Git chỉ dùng cho module được lập trình trong repository."
    table="tools" orderBy="sort_order" ascending openId={openId}
    defaults={{tool_type:"html",status:"ready",visible:true,show_home:true,show_orbit:false,orbit_ring:1,orbit_angle:0,sort_order:1,requires_auth:false,accent:"#3157f6",settings:{}}}
    fields={[
      f.sel("tool_type","Loại Tool / Tool type",[
        {value:"html",label:"HTML thuần / Static HTML — tạo trực tiếp từ Admin"},
        {value:"source",label:"Source Git / Module — dùng code trong repository"}
      ],{required:true,help:"HTML thuần chỉ hiện các trường cần thiết. Route và mã hiển thị được hệ thống tự sinh từ slug."}),

      f.text("slug","Slug / URL",{required:true,placeholder:"quiz-moi",help:"Ví dụ quiz-moi → /tools/quiz-moi.",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug chỉ dùng chữ thường, số và dấu gạch ngang.":null}),
      f.text("title_vi","Tên Tool (VI)",{required:true,placeholder:"Luyện đề"}),
      f.text("title_en","Tên Tool (EN)",{placeholder:"Quiz practice"}),

      f.text("code","Mã ngắn hiển thị",{showWhen:isSource,requiredWhen:isSource,placeholder:"PDF"}),
      f.text("route","Đường dẫn",{showWhen:isSource,requiredWhen:isSource,placeholder:"/tools/pdf"}),
      f.area("description_vi","Mô tả (VI)",{showWhen:isSource,placeholder:"Tool dùng để làm gì…"}),
      f.area("description_en","Mô tả (EN)",{showWhen:isSource,placeholder:"Optional…"}),
      f.media("icon_media_id","Icon / logo Tool",{showWhen:isSource,kind:"image",mirrorUrlField:"icon"}),
      f.hidden("icon"),
      f.color("accent","Màu chủ đạo",{showWhen:isSource,requiredWhen:isSource}),
      f.sel("status","Trạng thái",[{value:"ready",label:"Ready — dùng ổn định"},{value:"beta",label:"Beta — đang thử nghiệm"},{value:"maintenance",label:"Maintenance — tạm bảo trì"}],{showWhen:isSource,requiredWhen:isSource}),

      f.bool("visible","Hiển thị Tool / Show tool",{trueLabel:"Cho Tool xuất hiện trên website / Show on website"}),
      f.bool("show_home","Hiện ở Trang chủ / Show on Home",{trueLabel:"Hiện card Tool ở Trang chủ / Show tool card on Home"}),

      f.bool("show_orbit","Hiện ở vòng quỹ đạo",{showWhen:isSource,trueLabel:"Hiện Tool trong vòng tròn/quỹ đạo"}),
      f.num("orbit_ring","Vòng quỹ đạo",{showWhen:isSource,min:1,max:10,step:1}),
      f.num("orbit_angle","Góc trên vòng",{showWhen:isSource,min:0,max:359,step:1}),
      f.sort("sort_order","Thứ tự",{showWhen:isSource,requiredWhen:isSource}),
      f.bool("requires_auth","Yêu cầu đăng nhập",{showWhen:isSource,trueLabel:"Chỉ người đăng nhập mới mở được route Tool"}),
      f.checks("allowed_roles","Vai trò được dùng",roles,{showWhen:form=>isSource(form)&&!!form.requires_auth}),

      f.html("inline_html","Code HTML thuần / Static HTML",{showWhen:isHtml,requiredWhen:isHtml,rows:24,placeholder:"Dán nguyên file HTML: <!DOCTYPE html> ...",help:"Bấm Chạy thử để kiểm tra ngay trong Admin. Khi Xuất bản frontend, route /tools/<slug> và file runtime được sinh tự động."}),

      f.json("settings","Cấu hình riêng",{showWhen:isSource,placeholder:'{\n  "featureFlag": true\n}'}),
      f.area("admin_note","Ghi chú nội bộ",{showWhen:isSource,placeholder:"Ghi chú cho lần sửa sau…"})
    ]}
  /></AdminPage>;
}
