import React from"react";import TableManager from"../components/TableManager";import CommentsModeration from"../components/CommentsModeration";import{AdminPage}from"./_shared";import{f}from"../schema";import{supabase,invoke}from"../lib/supabase";
async function deleteNewsArticleAndPublish(row){
 const id=row?.id;
 if(!id)throw new Error("Thiếu ID bài viết.");

 const cleanup=await invoke("news-article-delete",{article_id:id});
 const failed=Array.isArray(cleanup?.cleanup_failed)?cleanup.cleanup_failed:[];

 try{
  const r=await invoke("render-deploy",{target:"frontend"});
  window.dispatchEvent(new CustomEvent("nlkh:admin-toast",{detail:{
   type:failed.length?"error":"success",
   duration:failed.length?12000:7500,
   message:failed.length
    ? "Đã xóa bài nhưng có media R2 cleanup lỗi: "+failed.join(" | ")
    : (r?.message?"Đã xóa bài + media R2. "+r.message:"Đã xóa bài + media R2 và yêu cầu cập nhật frontend.")
  }}));
 }catch(e){
  window.dispatchEvent(new CustomEvent("nlkh:admin-toast",{detail:{
   type:"error",duration:10000,
   message:"Đã xóa bài + media nhưng chưa thể yêu cầu frontend cập nhật: "+(e?.message||String(e))
  }}));
 }
}const catRel={table:"news_categories",select:"id,name_vi,slug,sort_order",valueKey:"id",label:o=>`${o.name_vi} (${o.slug})`,orderBy:"sort_order"};
export default function News({access}){return <AdminPage access={access}>
<TableManager title="Danh mục tin" description="Nhóm bài viết để người đọc dễ lọc. Không bắt buộc phải có nhiều nhóm; một bài có thể để trống danh mục." table="news_categories" orderBy="sort_order" ascending defaults={{visible:true,color:"#3157f6"}} fields={[
 f.text("slug","Slug danh mục",{required:true,placeholder:"ky-thuat",help:"Mã URL/kỹ thuật, chữ thường và dấu gạch ngang.",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug danh mục chỉ dùng a-z, 0-9 và dấu gạch ngang.":null}),f.text("name_vi","Tên danh mục (VI)",{required:true,placeholder:"Kỹ thuật"}),f.text("name_en","Tên (EN)",{placeholder:"Engineering"}),f.area("description_vi","Mô tả",{placeholder:"Danh mục gồm những bài gì…"}),f.area("description_en","Mô tả EN",{placeholder:"Optional…"}),f.color("color","Màu nhãn",{required:true,help:"Chọn trực tiếp màu nhãn danh mục."}),f.sort("sort_order","Thứ tự",{required:true}),f.bool("visible","Hiển thị",{trueLabel:"Hiển thị danh mục"})
]}/>
<TableManager title="Bài viết" description="Tạo/sửa tin tức. Ảnh bìa tải trực tiếp vào R2; Tags nhập cách nhau bằng dấu phẩy. Bình luận phải được duyệt ở phần bên dưới mới hiển thị." table="news_articles" deleteHandler={deleteNewsArticleAndPublish} defaults={{status:"draft",featured:false,allow_comments:false,tags:[]}} fields={[
 f.text("slug","Slug bài viết",{required:true,placeholder:"ten-bai-viet",help:"Phần URL /news/ten-bai-viet. Không dùng khoảng trắng/dấu tiếng Việt.",validate:v=>v&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)?"Slug chỉ dùng a-z, 0-9 và dấu gạch ngang.":null}),
 f.relation("category_id","Danh mục",catRel,{nullable:true,placeholder:"— Không phân nhóm —",help:"Chọn nhóm bài viết; không cần nhập ID."}),
 f.text("title_vi","Tiêu đề (VI)",{required:true,placeholder:"Tiêu đề bài viết"}),f.text("title_en","Tiêu đề (EN)",{placeholder:"Optional…"}),f.area("subtitle_vi","Tiêu đề phụ",{placeholder:"Một dòng bổ sung dưới tiêu đề…"}),f.area("subtitle_en","Tiêu đề phụ EN",{placeholder:"Optional…"}),f.area("excerpt_vi","Tóm tắt",{placeholder:"1–2 câu hiện ở thẻ tin và SEO…"}),f.area("excerpt_en","Tóm tắt EN",{placeholder:"Optional…"}),
 f.area("content_vi","Nội dung (VI)",{required:true,rows:18,placeholder:"Nhập nội dung bài viết; xuống dòng được giữ khi hiển thị.",help:"Bản hiện tại hiển thị nội dung văn bản an toàn và giữ xuống dòng; không yêu cầu biết Markdown."}),f.area("content_en","Nội dung (EN)",{rows:18,placeholder:"Optional…"}),
 f.media("cover_media_id","Ảnh bìa",{kind:"image",mirrorUrlField:"cover_image",help:"Tải ảnh ngay tại đây hoặc chọn lại ID R2 đã có. Khi đăng nhập lại, Admin vẫn nhận đúng ID và preview."}),f.hidden("cover_image"),
 f.text("cover_alt_vi","Alt ảnh (VI)",{placeholder:"Mô tả nội dung bức ảnh",help:"Alt là mô tả thay thế cho ảnh, giúp người dùng dùng trình đọc màn hình và hỗ trợ SEO. Không phải caption."}),f.text("cover_alt_en","Alt ảnh (EN)",{placeholder:"Optional image description"}),
 f.text("author_name","Tác giả",{required:true,placeholder:"Nguyễn Lê Khánh Hòa"}),f.text("translator_name","Người dịch",{nullable:true,placeholder:"Để trống nếu không có"}),f.text("editor_name","Biên tập",{nullable:true,placeholder:"Để trống nếu không có"}),f.text("source_name","Tên nguồn",{nullable:true,placeholder:"Ví dụ: IEEE"}),f.url("source_url","Link nguồn",{nullable:true,placeholder:"https://..."}),
 f.arr("tags","Tags / từ khóa",{placeholder:"điện, relay, comtrade",help:"Không phải JSON. Nhập nhiều tag, cách nhau bằng dấu phẩy; dùng để phân loại/tìm kiếm."}),
 f.sel("status","Trạng thái",[{value:"draft",label:"Nháp"},{value:"review",label:"Chờ duyệt"},{value:"scheduled",label:"Hẹn xuất bản"},{value:"published",label:"Đã xuất bản"},{value:"archived",label:"Lưu trữ"}],{required:true,help:"Chỉ Published được đọc công khai theo chính sách hiện tại."}),
 f.bool("featured","Nổi bật",{trueLabel:"Đánh dấu là bài nổi bật",help:"Bài nổi bật có thể được ưu tiên lên vị trí/khối nổi bật trên giao diện. Không bật thì vẫn là bài bình thường trong danh sách."}),
 f.bool("allow_comments","Cho bình luận",{trueLabel:"Người đọc được gửi bình luận",help:"Bình luận mới luôn ở trạng thái chờ; Admin phải duyệt thì mới hiển thị."}),f.dt("published_at","Ngày/giờ xuất bản",{nullable:true,requiredWhen:form=>form.status==="scheduled",help:"Bắt buộc khi trạng thái = Hẹn xuất bản. Với bài Published có thể điền để ghi đúng mốc công khai; để trống nếu không cần."})
]}/>
<CommentsModeration/>
</AdminPage>}
