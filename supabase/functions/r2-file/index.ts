import{S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand}from"npm:@aws-sdk/client-s3@3";
import{getSignedUrl}from"npm:@aws-sdk/s3-request-presigner@3";
import{adminClient,caller,hasPermission}from"../_shared/auth.ts";
import{json,corsHeaders}from"../_shared/cors.ts";

function r2(){
 const account=Deno.env.get("R2_ACCOUNT_ID"),access=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY");
 if(!account||!access||!secret)throw new Error("Thiếu R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY trong Edge Function Secrets.");
 return new S3Client({region:"auto",endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId:access,secretAccessKey:secret}});
}
const bucket=()=>Deno.env.get("R2_BUCKET_NAME")||"";
const code=(n:number)=>`R2-${String(n).padStart(6,"0")}`;
const safe=(name:string)=>name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"file";
function publicUrl(key:string){const base=(Deno.env.get("R2_PUBLIC_BASE_URL")||"").replace(/\/$/,"");return base?`${base}/${key.split("/").map(encodeURIComponent).join("/")}`:null}

async function usageOf(admin:any,id:string){
 const defs=[
  ["site_settings","og_media_id","OG website"],["site_settings","favicon_media_id","Favicon"],["navigation_items","icon_media_id","Menu"],["social_links","icon_media_id","Social"],["seo_entries","og_media_id","SEO"],["tools","icon_media_id","Tool"],["profiles","avatar_media_id","Avatar"],["news_articles","cover_media_id","Tin tức"],["software_items","icon_media_id","Icon phần mềm"],["software_items","cover_media_id","Cover phần mềm"],["software_items","download_media_id","File tải phần mềm"],["cv_profiles","photo_media_id","Ảnh CV"],["cv_profiles","pdf_media_id","PDF CV"],["data_items","media_id","Dữ liệu"]
 ];
 const usage=[];
 for(const[t,c,label]of defs){const{count}=await admin.from(t).select("*",{head:true,count:"exact"}).eq(c,id);if(count)usage.push({table:t,column:c,label,count})}
 return usage;
}
async function detachEverywhere(admin:any,id:string,asset:any){
 // Nếu file là file tải chính của software thì ẩn app trước để không để nút tải hỏng sau khi force-delete.
 await admin.from("software_items").update({visible:false}).eq("download_media_id",id);
 const refs=[["site_settings","og_media_id"],["site_settings","favicon_media_id"],["navigation_items","icon_media_id"],["social_links","icon_media_id"],["seo_entries","og_media_id"],["tools","icon_media_id"],["profiles","avatar_media_id"],["news_articles","cover_media_id"],["software_items","icon_media_id"],["software_items","cover_media_id"],["software_items","download_media_id"],["cv_profiles","photo_media_id"],["cv_profiles","pdf_media_id"]];
 for(const[t,c]of refs)await admin.from(t).update({[c]:null}).eq(c,id);
 // Dữ liệu R2 đang dùng asset bị xóa phải được ẩn và gỡ cả object_key để không để lại link hỏng.
 await admin.from("data_items").update({media_id:null,object_key:null,visible:false}).eq("media_id",id);
 if(asset?.public_url){
   await admin.from("site_settings").update({default_og_image:null}).eq("default_og_image",asset.public_url);
   await admin.from("site_settings").update({favicon_url:null}).eq("favicon_url",asset.public_url);
   await admin.from("navigation_items").update({icon_url:null}).eq("icon_url",asset.public_url);
   await admin.from("social_links").update({icon:null}).eq("icon",asset.public_url);
   await admin.from("tools").update({icon:null}).eq("icon",asset.public_url);
   await admin.from("seo_entries").update({og_image:null}).eq("og_image",asset.public_url);
   await admin.from("profiles").update({avatar_url:null}).eq("avatar_url",asset.public_url);
   await admin.from("news_articles").update({cover_image:null}).eq("cover_image",asset.public_url);
   await admin.from("software_items").update({icon_url:null}).eq("icon_url",asset.public_url);
   await admin.from("software_items").update({cover_url:null}).eq("cover_url",asset.public_url);
   await admin.from("cv_profiles").update({photo_url:null}).eq("photo_url",asset.public_url);
   await admin.from("cv_profiles").update({pdf_url:null}).eq("pdf_url",asset.public_url);
 }
}

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});
 if(req.method!=="POST")return json(req,{error:"Chỉ hỗ trợ POST."},405);
 try{
  const body=await req.json(),ctx=await caller(req),admin=adminClient(),s3=r2(),b=bucket();if(!b)throw new Error("Thiếu R2_BUCKET_NAME.");
  const action=String(body.action||"");

  if(action==="prepare-upload"){
    const usageType=String(body.usage_type||"admin"),isOwnAvatar=usageType==="avatar"&&!!ctx.user,isData=usageType==="data"&&!!ctx.user;
    let dataUploadAllowed=false;
    if(isData){
      if(hasPermission(ctx,"data.manage")||hasPermission(ctx,"media.manage")) dataUploadAllowed=true;
      else if(body.item_id){
        const{data:a}=await admin.from("user_data_access").select("permission_level,expires_at").eq("user_id",ctx.user.id).eq("item_id",body.item_id).maybeSingle();
        dataUploadAllowed=!!a&&a.permission_level==="full"&&(!a.expires_at||new Date(a.expires_at)>new Date());
      }else if(body.collection_id){
        const{data:grants}=await admin.from("user_data_access").select("permission_level,expires_at,data_items!inner(collection_id)").eq("user_id",ctx.user.id).in("permission_level",["add","full"]);
        dataUploadAllowed=(grants||[]).some((a:any)=>a.data_items?.collection_id===body.collection_id&&(!a.expires_at||new Date(a.expires_at)>new Date()));
      }
    }
    if(!isOwnAvatar&&!dataUploadAllowed&&!hasPermission(ctx,"media.manage"))return json(req,{error:isData?"Bạn chưa có quyền Thêm/Full để tải tệp R2 cho nhóm dữ liệu này.":"Bạn không có quyền tải tệp lên thư viện R2."},403);
    const sha=String(body.sha256||"").toLowerCase(),original=String(body.original_name||"file"),mime=String(body.mime_type||"application/octet-stream"),size=Number(body.size_bytes||0),visibility=String(body.visibility||"public"),folder=safe(String(body.folder||"uploads"));
    if(!sha||!original)return json(req,{error:"Thiếu mã SHA-256 hoặc tên tệp."},400);
    const{data:dupe}=await admin.from("media_assets").select("*").eq("sha256",sha).eq("visibility",visibility).eq("status","ready").maybeSingle();
    if(dupe)return json(req,{duplicate:true,asset:dupe});
    const temp=`pending/${crypto.randomUUID()}`;
    const{data:asset,error}=await admin.from("media_assets").insert({object_key:temp,original_name:original,mime_type:mime,size_bytes:size,title:original,folder,visibility,owner_id:ctx.user?.id||null,sha256:sha,status:"pending",usage_note:String(body.usage_note||usageType),uploaded_from:isOwnAvatar?"profile":isData?"data":"admin"}).select("*").single();
    if(error)throw error;
    const objectKey=`${folder}/${code(asset.asset_no)}/${safe(original)}`;
    const pub=visibility==="public"?publicUrl(objectKey):null;
    const{error:upErr}=await admin.from("media_assets").update({object_key:objectKey,public_url:pub}).eq("id",asset.id);if(upErr)throw upErr;
    const url=await getSignedUrl(s3,new PutObjectCommand({Bucket:b,Key:objectKey,ContentType:mime}),{expiresIn:900});
    return json(req,{duplicate:false,url,asset:{...asset,object_key:objectKey,public_url:pub,asset_code:code(asset.asset_no)}});
  }

  if(action==="complete-upload"){
    const{data:asset}=await admin.from("media_assets").select("*").eq("id",body.media_id).maybeSingle();if(!asset)return json(req,{error:"Không tìm thấy ID R2 đang upload."},404);
    const isOwnAvatar=asset.uploaded_from==="profile"&&ctx.user&&asset.owner_id===ctx.user.id;
    const isOwnData=asset.uploaded_from==="data"&&ctx.user&&asset.owner_id===ctx.user.id;
    if(!isOwnAvatar&&!isOwnData&&!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền hoàn tất upload này."},403);
    const{data:ready,error}=await admin.from("media_assets").update({status:"ready"}).eq("id",asset.id).select("*").single();if(error)throw error;
    if(isOwnAvatar)await admin.from("profiles").update({avatar_media_id:ready.id,avatar_url:ready.public_url}).eq("id",ctx.user.id);
    return json(req,{ok:true,asset:{...ready,asset_code:code(ready.asset_no)}});
  }

  if(action==="prepare-replace"){
    if(!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền thay nội dung file R2."},403);
    const id=String(body.media_id||""),sha=String(body.sha256||"").toLowerCase(),original=String(body.original_name||"file"),mime=String(body.mime_type||"application/octet-stream"),size=Number(body.size_bytes||0);
    const{data:asset}=await admin.from("media_assets").select("*").eq("id",id).eq("status","ready").maybeSingle();
    if(!asset)return json(req,{error:"Không tìm thấy ID R2 cần thay file."},404);
    if(!sha)return json(req,{error:"Không tính được SHA-256 của file mới."},400);
    const{data:dupe}=await admin.from("media_assets").select("*").eq("sha256",sha).eq("visibility",asset.visibility).eq("status","ready").neq("id",id).maybeSingle();
    if(dupe)return json(req,{duplicate:true,asset:{...dupe,asset_code:code(dupe.asset_no)}});
    const url=await getSignedUrl(s3,new PutObjectCommand({Bucket:b,Key:asset.object_key,ContentType:mime}),{expiresIn:900});
    return json(req,{duplicate:false,url,asset:{...asset,original_name:original,mime_type:mime,size_bytes:size,sha256:sha,asset_code:code(asset.asset_no)}});
  }

  if(action==="complete-replace"){
    if(!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền hoàn tất thay file R2."},403);
    const id=String(body.media_id||""),sha=String(body.sha256||"").toLowerCase(),original=String(body.original_name||"file"),mime=String(body.mime_type||"application/octet-stream"),size=Number(body.size_bytes||0);
    const{data:ready,error}=await admin.from("media_assets").update({sha256:sha,original_name:original,title:original,mime_type:mime,size_bytes:size,status:"ready"}).eq("id",id).select("*").single();
    if(error)throw error;
    return json(req,{ok:true,asset:{...ready,asset_code:code(ready.asset_no)}});
  }

  if(action==="delete"){
    if(!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền xóa thư viện R2."},403);
    const id=String(body.media_id||""),{data:asset}=await admin.from("media_assets").select("*").eq("id",id).maybeSingle();if(!asset)return json(req,{error:"ID R2 không tồn tại hoặc đã xóa."},404);
    const usage=await usageOf(admin,id);
    if(usage.length&&!body.force)return json(req,{error:`${code(asset.asset_no)} đang được dùng ở ${usage.map((x:any)=>`${x.label} (${x.count})`).join(", ")}. Hãy thay/bỏ liên kết trước hoặc xác nhận xóa bắt buộc.`,usage},409);
    if(body.force)await detachEverywhere(admin,id,asset);
    try{await s3.send(new DeleteObjectCommand({Bucket:b,Key:asset.object_key}))}catch(e){console.error("R2 delete",e)}
    const{error}=await admin.from("media_assets").delete().eq("id",id);if(error)throw error;
    return json(req,{ok:true,deleted:code(asset.asset_no)});
  }

  if(action==="presign-download"){
    const key=String(body.object_key||"").replace(/^\/+/,"");let allowed=false,asset:any=null;
    if(body.media_id){const r=await admin.from("media_assets").select("*").eq("id",body.media_id).maybeSingle();asset=r.data;if(asset?.object_key!==key&&key)return json(req,{error:"ID R2 và object key không khớp."},400);if(asset?.visibility==="public")allowed=true;else if(asset?.visibility==="authenticated"&&ctx.user)allowed=true;else if(ctx.user&&(asset?.owner_id===ctx.user.id||hasPermission(ctx,"media.manage")||hasPermission(ctx,"data.manage")))allowed=true}
    if(!allowed&&body.item_id){const{data:item}=await admin.from("data_items").select("*,media_assets(*)").eq("id",body.item_id).maybeSingle();asset=item?.media_assets;if(item?.visible&&item.visibility==="public")allowed=true;else if(item?.visible&&item.visibility==="authenticated"&&ctx.user)allowed=true;else if(item?.visible&&ctx.user){const{data:a}=await admin.from("user_data_access").select("permission_level,expires_at").eq("item_id",item.id).eq("user_id",ctx.user.id).maybeSingle();allowed=!!a&&(!a.expires_at||new Date(a.expires_at)>new Date())}}
    if(!allowed)return json(req,{error:"Bạn không có quyền đọc tệp này."},403);
    const objectKey=asset?.object_key||key;if(!objectKey)return json(req,{error:"Không tìm thấy tệp R2."},404);
    const url=await getSignedUrl(s3,new GetObjectCommand({Bucket:b,Key:objectKey}),{expiresIn:900});return json(req,{url});
  }
  return json(req,{error:"Action R2 không hợp lệ."},400);
 }catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},500)}
});
