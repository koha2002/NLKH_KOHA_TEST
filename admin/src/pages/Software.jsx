import React from"react";
import TableManager from"../components/TableManager";
import{AdminPage}from"./_shared";
import{f}from"../schema";

const catRel={table:"software_categories",select:"id,name_vi,slug,sort_order",valueKey:"id",label:o=>`${o.name_vi} (${o.slug})`,orderBy:"sort_order"};
const roles={table:"roles",select:"id,name",valueKey:"id",labelKey:"name",orderBy:"id"};

export default function Software({access}){return <AdminPage access={access}>
<TableManager title="Nhóm phần mềm" description="Nhóm chỉ để lọc/sắp xếp kho phần mềm." table="software_categories" orderBy="sort_order" ascending defaults={{visible:true}} fields={[
 f.text("slug","Slug nhóm",{required:true,placeholder:"engineering",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug nhóm chỉ dùng a-z, 0-9 và dấu gạch ngang.":null}),
 f.text("name_vi","Tên nhóm (VI)",{required:true,placeholder:"Kỹ thuật"}),
 f.text("name_en","Tên nhóm (EN)",{placeholder:"Engineering"}),
 f.sort("sort_order","Thứ tự",{required:true}),
 f.bool("visible","Hiển thị",{trueLabel:"Hiển thị nhóm"})
]}/>
<TableManager title="Kho phần mềm" description="Metadata ở Supabase. Nút tải được kiểm quyền lại tại Edge; link/file thật không còn đưa vào public bundle." table="software_items" orderBy="sort_order" ascending defaults={{visible:true,featured:false,download_source:"link",download_access:"public",download_allowed_roles:[],price_label_vi:"Miễn phí",price_label_en:"Free"}} fields={[
 f.text("name","Tên phần mềm",{required:true,placeholder:"EPLAN"}),
 f.text("slug","Slug",{required:true,placeholder:"eplan",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug chỉ dùng a-z, 0-9 và dấu gạch ngang.":null}),
 f.relation("category_id","Nhóm",catRel,{nullable:true,placeholder:"— Không phân nhóm —"}),
 f.area("description_vi","Mô tả VI"),
 f.area("description_en","Mô tả EN"),
 f.media("icon_media_id","Icon",{kind:"image",mirrorUrlField:"icon_url",visibility:"public"}),
 f.hidden("icon_url"),
 f.media("cover_media_id","Cover",{kind:"image",mirrorUrlField:"cover_url",visibility:"public"}),
 f.hidden("cover_url"),
 f.sel("download_source","Nguồn file tải",[{value:"link",label:"Liên kết ngoài — Google Drive / OneDrive / website khác"},{value:"r2",label:"Cloudflare R2"}],{required:true}),
 f.url("download_url","Link tải ngoài",{showWhen:form=>form.download_source==="link",requiredWhen:form=>form.download_source==="link",derive:form=>form.download_source==="link"?form.download_url:null}),
 f.media("download_media_id","File tải trên R2",{kind:"file",showWhen:form=>form.download_source==="r2",requiredWhen:form=>form.download_source==="r2",derive:form=>form.download_source==="r2"?form.download_media_id:null,visibility:form=>form.download_access==="authenticated"?"authenticated":"public"}),
 f.sel("download_access","Quyền tải",[{value:"public",label:"Công khai — ai cũng tải"},{value:"authenticated",label:"Có tài khoản + được cấp quyền"}],{required:true}),
 f.checks("download_allowed_roles","Vai trò được tải",roles,{showWhen:form=>form.download_access==="authenticated",help:"Để trống = mọi tài khoản trạng thái Active được tải. Nếu tích vai trò = chỉ tài khoản Active thuộc các vai trò đó được tải."}),
 f.text("price_label_vi","Nhãn giá (VI)",{placeholder:"Miễn phí"}),
 f.text("price_label_en","Nhãn giá (EN)",{placeholder:"Free"}),
 f.text("version","Phiên bản",{nullable:true}),
 f.text("compatibility","Tương thích",{nullable:true}),
 f.bool("visible","Hiển thị",{trueLabel:"Hiển thị ngoài website"}),
 f.bool("featured","Nổi bật",{trueLabel:"Ưu tiên lên trước"}),
 f.sort("sort_order","Thứ tự",{required:true})
]}/>
</AdminPage>}