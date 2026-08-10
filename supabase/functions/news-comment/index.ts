import{S3Client,PutObjectCommand,DeleteObjectCommand}from"npm:@aws-sdk/client-s3@3";
import{adminClient,caller,hasPermission}from"../_shared/auth.ts";
import{json,corsHeaders}from"../_shared/cors.ts";
function r2(){const account=Deno.env.get("R2_ACCOUNT_ID"),access=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY");if(!account||!access||!secret)throw new Error("Thiếu R2 secrets.");return new S3Client({region:"auto",endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId:access,secretAccessKey:secret}})}
async function hash(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function writeJson(key:string,payload:any){await r2().send(new PutObjectCommand({Bucket:Deno.env.get("R2_BUCKET_NAME")!,Key:key,Body:JSON.stringify(payload,null,2),ContentType:"application/json"}))}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});if(req.method!=="POST")return json(req,{error:"Chỉ hỗ trợ POST."},405);
 try{
  const body=await req.json(),action=String(body.action||"submit"),admin=adminClient(),ctx=await caller(req);
  if(action==="list"){
    if(!hasPermission(ctx,"news.manage"))return json(req,{error:"Bạn không có quyền xem hàng chờ bình luận."},403);
    const filter=String(body.status||"pending");let q=admin.from("news_comments").select("*,news_articles(title_vi,slug)").order("created_at",{ascending:false});if(filter!=="all")q=q.eq("status",filter);const{data,error}=await q;if(error)throw error;return json(req,{rows:data||[]});
  }
  if(action==="moderate"){
    if(!hasPermission(ctx,"news.manage"))return json(req,{error:"Bạn không có quyền duyệt bình luận."},403);
    const id=String(body.comment_id||""),next=String(body.status||"");if(!["approved","rejected"].includes(next))return json(req,{error:"Trạng thái duyệt không hợp lệ."},400);
    const{data:c}=await admin.from("news_comments").select("*,news_articles(slug)").eq("id",id).maybeSingle();if(!c)return json(req,{error:"Không tìm thấy bình luận."},404);
    const reviewedAt=new Date().toISOString();
    if(next==="approved"){
      const key=c.r2_object_key||`comments/${(c as any).news_articles?.slug||"article"}/${c.id}.json`;
      // Chỉ đổi DB sang approved SAU KHI R2 ghi thành công. Nếu R2 lỗi, comment vẫn pending/rejected và không thể lộ ra view public.
      await writeJson(key,{id:c.id,article_id:c.article_id,display_name:c.display_name,body:c.body,status:"approved",created_at:c.created_at,reviewed_at:reviewedAt,reviewed_by:ctx.user?.id||null});
      const{error}=await admin.from("news_comments").update({status:"approved",r2_object_key:key,reviewed_at:reviewedAt,reviewed_by:ctx.user?.id||null}).eq("id",id);if(error)throw error;
      return json(req,{ok:true,message:"Đã duyệt: R2 đã lưu JSON thành công, sau đó hệ thống mới bật hiển thị bình luận."});
    }
    if(c.r2_object_key){
      try{await r2().send(new DeleteObjectCommand({Bucket:Deno.env.get("R2_BUCKET_NAME")!,Key:c.r2_object_key}))}catch(e){throw new Error(`Không thể xóa bản R2 cũ nên chưa đổi trạng thái bình luận: ${e instanceof Error?e.message:String(e)}`)}
    }
    const{error}=await admin.from("news_comments").update({status:"rejected",r2_object_key:null,reviewed_at:reviewedAt,reviewed_by:ctx.user?.id||null}).eq("id",id);if(error)throw error;
    return json(req,{ok:true,message:"Đã từ chối; bình luận không hiển thị và không còn bản JSON R2 đã duyệt."});
  }
  if(action==="delete"){
    if(!hasPermission(ctx,"news.manage"))return json(req,{error:"Bạn không có quyền xóa bình luận."},403);const id=String(body.comment_id||""),{data:c}=await admin.from("news_comments").select("r2_object_key").eq("id",id).maybeSingle();if(!c)return json(req,{error:"Không tìm thấy bình luận."},404);if(c.r2_object_key)try{await r2().send(new DeleteObjectCommand({Bucket:Deno.env.get("R2_BUCKET_NAME")!,Key:c.r2_object_key}))}catch(e){console.error(e)}const{error}=await admin.from("news_comments").delete().eq("id",id);if(error)throw error;return json(req,{ok:true,message:"Đã xóa bình luận khỏi DB và R2."});
  }
  if(action!=="submit")return json(req,{error:"Action không hợp lệ."},400);
  const articleId=String(body.article_id||""),displayName=String(body.display_name||ctx.profile?.display_name||"").trim(),email=String(body.email||ctx.profile?.email||"").trim(),text=String(body.body||"").trim();if(!articleId)return json(req,{error:"Thiếu bài viết cần bình luận."},400);if(displayName.length<2)return json(req,{error:"Tên hiển thị cần ít nhất 2 ký tự."},400);if(text.length<2||text.length>3000)return json(req,{error:"Bình luận cần từ 2 đến 3000 ký tự."},400);
  const{data:article}=await admin.from("news_articles").select("id,slug,status,allow_comments").eq("id",articleId).maybeSingle();if(!article||article.status!=="published")return json(req,{error:"Bài viết không tồn tại hoặc chưa xuất bản."},404);if(!article.allow_comments)return json(req,{error:"Bài viết này đang tắt bình luận."},403);
  const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")||"").split(",")[0].trim(),salt=Deno.env.get("COMMENT_HASH_SALT")||Deno.env.get("SCHEDULER_SECRET")||"nlkh";
  const{data:comment,error}=await admin.from("news_comments").insert({article_id:articleId,user_id:ctx.user?.id||null,display_name:displayName,email:email||null,body:text,status:"pending",ip_hash:ip?await hash(`${salt}:${ip}`):null,user_agent:(req.headers.get("user-agent")||"").slice(0,500)}).select("*").single();if(error)throw error;
  return json(req,{ok:true,message:"Bình luận đã gửi về Admin và đang chờ duyệt. Chỉ khi Admin duyệt hệ thống mới lưu bản JSON vào R2 và hiển thị công khai.",comment_id:comment.id});
 }catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},500)}
});
