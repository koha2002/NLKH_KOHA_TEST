import{S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,HeadObjectCommand}from"npm:@aws-sdk/client-s3@3";import{getSignedUrl}from"npm:@aws-sdk/s3-request-presigner@3";import{adminClient,caller,hasPermission}from"../_shared/auth.ts";import{json,corsHeaders}from"../_shared/cors.ts";
function r2(){const account=Deno.env.get("R2_ACCOUNT_ID"),access=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY");if(!account||!access||!secret)throw new Error("Thiếu R2 credentials.");return new S3Client({region:"auto",endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId:access,secretAccessKey:secret}})}const bucket=()=>Deno.env.get("R2_BUCKET_NAME")||"";const code=(n:number)=>`R2-${String(n).padStart(6,"0")}`;const safe=(name:string)=>name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"file";const safePath=(p:string)=>String(p||"uploads").split("/").map(safe).filter(Boolean).join("/")||"uploads";function publicUrl(key:string){
  const raw=(Deno.env.get("R2_PUBLIC_BASE_URL")||"").trim();
  const base=raw.replace(/\/$/,"");
  if(!/^https?:\/\/[^()[\]\s]+$/i.test(base))return null;
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
async function collectionPermission(admin:any,userId:string,collectionId:string){const{data}=await admin.from("user_collection_access").select("permission_level,expires_at").eq("user_id",userId).eq("collection_id",collectionId).maybeSingle();if(!data||data.expires_at&&new Date(data.expires_at)<=new Date())return null;return data.permission_level as string}
async function usageOf(admin:any,id:string){const defs=[["site_settings","og_media_id","OG website"],["site_settings","favicon_media_id","Favicon"],["navigation_items","icon_media_id","Menu"],["social_links","icon_media_id","Social"],["seo_entries","og_media_id","SEO"],["tools","icon_media_id","Tool"],["profiles","avatar_media_id","Avatar"],["news_articles","cover_media_id","Tin tức"],["software_items","icon_media_id","Icon phần mềm"],["software_items","cover_media_id","Cover phần mềm"],["software_items","download_media_id","File tải phần mềm"],["cv_profiles","photo_media_id","Ảnh CV"],["cv_profiles","pdf_media_id","PDF CV"],["data_items","media_id","Dữ liệu"]];const usage=[];for(const[t,c,label]of defs){const{count}=await admin.from(t).select("*",{head:true,count:"exact"}).eq(c,id);if(count)usage.push({table:t,column:c,label,count})}return usage}
async function detachEverywhere(admin:any,id:string,asset:any){await admin.from("software_items").update({visible:false}).eq("download_media_id",id);const refs=[["site_settings","og_media_id"],["site_settings","favicon_media_id"],["navigation_items","icon_media_id"],["social_links","icon_media_id"],["seo_entries","og_media_id"],["tools","icon_media_id"],["profiles","avatar_media_id"],["news_articles","cover_media_id"],["software_items","icon_media_id"],["software_items","cover_media_id"],["software_items","download_media_id"],["cv_profiles","photo_media_id"],["cv_profiles","pdf_media_id"]];for(const[t,c]of refs)await admin.from(t).update({[c]:null}).eq(c,id);await admin.from("data_items").update({media_id:null,object_key:null,visible:false}).eq("media_id",id);if(asset?.public_url){await admin.from("site_settings").update({default_og_image:null}).eq("default_og_image",asset.public_url);await admin.from("site_settings").update({favicon_url:null}).eq("favicon_url",asset.public_url)}}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});if(req.method!=="POST")return json(req,{error:"Chỉ hỗ trợ POST."},405);try{const body=await req.json(),ctx=await caller(req),admin=adminClient(),s3=r2(),b=bucket();if(!b)throw new Error("Thiếu R2_BUCKET_NAME.");const action=String(body.action||"");
if(action==="software-download"){
  const softwareId=String(body.software_id||"");
  if(!softwareId)return json(req,{error:"Thiếu software_id."},400);

  const{data:item,error:itemErr}=await admin.from("software_items")
    .select("id,name,visible,download_access,download_source,download_url,download_media_id,download_allowed_roles")
    .eq("id",softwareId).maybeSingle();
  if(itemErr)throw itemErr;
  if(!item||!item.visible)return json(req,{error:"Phần mềm không tồn tại hoặc đang ẩn."},404);

  let allowed=item.download_access==="public";
  if(!allowed&&ctx.user){
    const{data:profile}=await admin.from("profiles")
      .select("status,role_id").eq("id",ctx.user.id).maybeSingle();
    const roles=Array.isArray(item.download_allowed_roles)?item.download_allowed_roles.map(String):[];
    allowed=profile?.status==="active"&&(!roles.length||roles.includes(String(profile.role_id||"")));
  }
  if(!allowed)return json(req,{error:ctx.user?"Tài khoản chưa được cấp quyền tải. Vui lòng liên hệ ADMIN.":"Bạn cần đăng nhập để tải."},403);

  if(item.download_source==="link"){
    const url=String(item.download_url||"").trim();
    if(!/^https?:\/\//i.test(url))return json(req,{error:"Phần mềm chưa có link tải hợp lệ."},404);
    return json(req,{url,source:"link"});
  }

  if(!item.download_media_id)return json(req,{error:"Phần mềm chưa có file R2."},404);
  const{data:asset,error:assetErr}=await admin.from("media_assets").select("*").eq("id",item.download_media_id).maybeSingle();
  if(assetErr)throw assetErr;
  if(!asset?.object_key)return json(req,{error:"Không tìm thấy file R2."},404);
  const url=await getSignedUrl(s3,new GetObjectCommand({Bucket:b,Key:asset.object_key}),{expiresIn:900});
  return json(req,{url,source:"r2"});
}
if(action==="prepare-upload"){
  const usageType=String(body.usage_type||"admin");
  const isOwnAvatar=usageType==="avatar"&&!!ctx.user;
  const isData=usageType==="data"&&!!ctx.user;
  let dataUploadAllowed=false;
  let dataCollectionId="";
  let dataFolder="";

  if(isData){
    if(body.item_id){
      const{data:item}=await admin.from("data_items").select("collection_id").eq("id",body.item_id).maybeSingle();
      dataCollectionId=String(item?.collection_id||"");
    }else if(body.collection_id){
      dataCollectionId=String(body.collection_id||"");
    }

    if(hasPermission(ctx,"data.manage")||hasPermission(ctx,"media.manage")){
      dataUploadAllowed=true;
    }else if(dataCollectionId){
      const level=String(await collectionPermission(admin,ctx.user!.id,dataCollectionId)||"");
      dataUploadAllowed=body.item_id?level==="full":["add","full"].includes(level);
    }

    if(dataCollectionId){
      const{data:collection}=await admin.from("data_collections").select("slug,r2_prefix").eq("id",dataCollectionId).maybeSingle();
      if(collection)dataFolder=safePath(String(collection.r2_prefix||`data/${collection.slug||dataCollectionId}`));
    }
  }

  if(!isOwnAvatar&&!dataUploadAllowed&&!hasPermission(ctx,"media.manage")){
    return json(req,{error:isData?"Bạn chưa có quyền Add/Full trong thư mục dữ liệu này.":"Bạn không có quyền tải tệp lên R2."},403);
  }

  const sha=String(body.sha256||"").toLowerCase();
  const original=String(body.original_name||"file");
  const mime=String(body.mime_type||"application/octet-stream").toLowerCase();
  const size=Number(body.size_bytes||0);
  let visibility=String(body.visibility||"public");
  let folder=safePath(String(body.folder||"uploads"));

  if(!/^[a-f0-9]{64}$/.test(sha))return json(req,{error:"SHA-256 không hợp lệ."},400);
  if(!original.trim())return json(req,{error:"Thiếu tên tệp."},400);
  if(!Number.isFinite(size)||size<=0)return json(req,{error:"Dung lượng tệp không hợp lệ."},400);

  if(isOwnAvatar){
    const allowedAvatarMime=new Set(["image/jpeg","image/png","image/webp"]);
    if(!allowedAvatarMime.has(mime))return json(req,{error:"Avatar chỉ hỗ trợ JPEG, PNG hoặc WebP."},415);
    if(size>5*1024*1024)return json(req,{error:"Avatar tối đa 5 MB."},413);
    visibility="public";
    folder=safePath(`avatars/${ctx.user!.id}`);
  }else if(isData&&dataFolder){
    // Người dùng thư mục dữ liệu không được tự đổi prefix/visibility từ client.
    folder=dataFolder;
    visibility="private";
  }

  let dupeQuery=admin.from("media_assets").select("*").eq("sha256",sha).eq("visibility",visibility).eq("status","ready");
  if(ctx.user&&!hasPermission(ctx,"media.manage"))dupeQuery=dupeQuery.eq("owner_id",ctx.user.id);
  const{data:dupe}=await dupeQuery.maybeSingle();
  if(dupe&&!isOwnAvatar){
    let reusable=dupe;
    if(visibility==="public"&&!dupe.public_url&&dupe.object_key){
      const repairedUrl=publicUrl(String(dupe.object_key));
      if(repairedUrl){
        const{data:repaired,error:repairErr}=await admin.from("media_assets").update({public_url:repairedUrl}).eq("id",dupe.id).select("*").single();
        if(repairErr)throw repairErr;
        reusable=repaired||{...dupe,public_url:repairedUrl};
      }
    }
    return json(req,{duplicate:true,asset:reusable});
  }

  const temp=`pending/${crypto.randomUUID()}`;
  const{data:asset,error}=await admin.from("media_assets").insert({
    object_key:temp,original_name:original,mime_type:mime,size_bytes:size,title:original,folder,visibility,
    owner_id:ctx.user?.id||null,sha256:sha,status:"pending",usage_note:String(body.usage_note||usageType),
    uploaded_from:isOwnAvatar?"profile":isData?"data":"admin"
  }).select("*").single();
  if(error)throw error;

  const objectKey=`${folder}/${code(asset.asset_no)}/${safe(original)}`;
  const pub=visibility==="public"?publicUrl(objectKey):null;
  const{error:upErr}=await admin.from("media_assets").update({object_key:objectKey,public_url:pub}).eq("id",asset.id);
  if(upErr)throw upErr;

  const url=await getSignedUrl(s3,new PutObjectCommand({Bucket:b,Key:objectKey,ContentType:mime}),{expiresIn:900});
  return json(req,{duplicate:false,url,asset:{...asset,object_key:objectKey,public_url:pub,asset_code:code(asset.asset_no)}});
}
if(action==="complete-upload"){
  const{data:asset}=await admin.from("media_assets").select("*").eq("id",body.media_id).maybeSingle();
  if(!asset)return json(req,{error:"Không tìm thấy ID R2 đang upload."},404);
  const own=(asset.uploaded_from==="profile"||asset.uploaded_from==="data")&&ctx.user&&asset.owner_id===ctx.user.id;
  if(!own&&!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền hoàn tất upload này."},403);

  let head:any;
  try{
    head=await s3.send(new HeadObjectCommand({Bucket:b,Key:asset.object_key}));
  }catch{
    return json(req,{error:"Không tìm thấy object đã upload trên R2."},409);
  }
  const actualSize=Number(head?.ContentLength||0);
  const actualMime=String(head?.ContentType||asset.mime_type||"application/octet-stream").toLowerCase();

  if(asset.uploaded_from==="profile"){
    const allowedAvatarMime=new Set(["image/jpeg","image/png","image/webp"]);
    if(!allowedAvatarMime.has(actualMime)||actualSize<=0||actualSize>5*1024*1024){
      try{await s3.send(new DeleteObjectCommand({Bucket:b,Key:asset.object_key}))}catch{}
      await admin.from("media_assets").delete().eq("id",asset.id);
      return json(req,{error:"Avatar không hợp lệ hoặc vượt quá 5 MB."},413);
    }
  }

  let completedPublicUrl=asset.public_url;
  if(asset.visibility==="public"&&!completedPublicUrl&&asset.object_key){
    completedPublicUrl=publicUrl(String(asset.object_key));
  }
  const{data:ready,error}=await admin.from("media_assets")
    .update({status:"ready",size_bytes:actualSize,mime_type:actualMime,...(completedPublicUrl?{public_url:completedPublicUrl}:{})})
    .eq("id",asset.id).select("*").single();
  if(error)throw error;
  if(asset.uploaded_from==="profile"){
    await admin.from("profiles").update({avatar_media_id:ready.id,avatar_url:ready.public_url||completedPublicUrl||null}).eq("id",ctx.user!.id);
  }
  return json(req,{ok:true,asset:{...ready,public_url:ready.public_url||completedPublicUrl||null,asset_code:code(ready.asset_no)}});
}
if(action==="prepare-replace"){if(!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền thay nội dung file R2."},403);const id=String(body.media_id||""),sha=String(body.sha256||"").toLowerCase(),original=String(body.original_name||"file"),mime=String(body.mime_type||"application/octet-stream"),size=Number(body.size_bytes||0);const{data:asset}=await admin.from("media_assets").select("*").eq("id",id).eq("status","ready").maybeSingle();if(!asset)return json(req,{error:"Không tìm thấy ID R2."},404);const{data:dupe}=await admin.from("media_assets").select("*").eq("sha256",sha).eq("visibility",asset.visibility).eq("status","ready").neq("id",id).maybeSingle();if(dupe)return json(req,{duplicate:true,asset:{...dupe,asset_code:code(dupe.asset_no)}});const url=await getSignedUrl(s3,new PutObjectCommand({Bucket:b,Key:asset.object_key,ContentType:mime}),{expiresIn:900});return json(req,{duplicate:false,url,asset:{...asset,original_name:original,mime_type:mime,size_bytes:size,sha256,asset_code:code(asset.asset_no)}})}
if(action==="complete-replace"){if(!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền hoàn tất thay file R2."},403);const{data:ready,error}=await admin.from("media_assets").update({sha256:String(body.sha256||"").toLowerCase(),original_name:String(body.original_name||"file"),title:String(body.original_name||"file"),mime_type:String(body.mime_type||"application/octet-stream"),size_bytes:Number(body.size_bytes||0),status:"ready"}).eq("id",body.media_id).select("*").single();if(error)throw error;return json(req,{ok:true,asset:{...ready,asset_code:code(ready.asset_no)}})}
if(action==="delete"){if(!hasPermission(ctx,"media.manage"))return json(req,{error:"Bạn không có quyền xóa thư viện R2."},403);const id=String(body.media_id||""),{data:asset}=await admin.from("media_assets").select("*").eq("id",id).maybeSingle();if(!asset)return json(req,{error:"ID R2 không tồn tại."},404);const usage=await usageOf(admin,id);if(usage.length&&!body.force)return json(req,{error:`${code(asset.asset_no)} đang được dùng.`,usage},409);if(body.force)await detachEverywhere(admin,id,asset);try{await s3.send(new DeleteObjectCommand({Bucket:b,Key:asset.object_key}))}catch{}const{error}=await admin.from("media_assets").delete().eq("id",id);if(error)throw error;return json(req,{ok:true,deleted:code(asset.asset_no)})}
if(action==="presign-download"){
  const key=String(body.object_key||"").replace(/^\/+/,"");
  let allowed=false;
  let asset:any=null;

  if(body.item_id){
    const{data:item}=await admin.from("data_items").select("*,media_assets(*)").eq("id",body.item_id).maybeSingle();
    if(!item)return json(req,{error:"Dữ liệu không tồn tại."},404);
    asset=item.media_assets;

    if(item.visible&&item.visibility==="public")allowed=true;
    else if(item.visible&&item.visibility==="authenticated"&&ctx.user)allowed=true;
    else if(item.visible&&ctx.user){
      if(item.collection_id)allowed=!!(await collectionPermission(admin,ctx.user.id,item.collection_id));
      if(!allowed){
        const{data:a}=await admin.from("user_data_access").select("permission_level,expires_at").eq("item_id",item.id).eq("user_id",ctx.user.id).maybeSingle();
        allowed=!!a&&(!a.expires_at||new Date(a.expires_at)>new Date());
      }
    }

    if(!allowed)return json(req,{error:"Bạn không có quyền đọc tệp này."},403);
    if(!asset?.object_key)return json(req,{error:"Mục dữ liệu này không có file R2 được liên kết."},404);
    if(body.media_id&&String(body.media_id)!==String(asset.id))return json(req,{error:"Item và media_id không khớp."},400);
    if(key&&key!==String(asset.object_key))return json(req,{error:"Item và object key không khớp."},400);
  }else if(body.media_id){
    const r=await admin.from("media_assets").select("*").eq("id",body.media_id).maybeSingle();
    asset=r.data;
    if(!asset)return json(req,{error:"ID R2 không tồn tại."},404);
    if(asset.object_key!==key&&key)return json(req,{error:"ID R2 và object key không khớp."},400);
    if(asset.visibility==="public")allowed=true;
    else if(asset.visibility==="authenticated"&&ctx.user)allowed=true;
    else if(ctx.user&&(asset.owner_id===ctx.user.id||hasPermission(ctx,"media.manage")||hasPermission(ctx,"data.manage")))allowed=true;
  }

  if(!allowed)return json(req,{error:"Bạn không có quyền đọc tệp này."},403);
  const objectKey=String(asset?.object_key||"");
  if(!objectKey)return json(req,{error:"Không tìm thấy tệp R2."},404);
  const url=await getSignedUrl(s3,new GetObjectCommand({Bucket:b,Key:objectKey}),{expiresIn:900});
  return json(req,{url});
}
return json(req,{error:"Action R2 không hợp lệ."},400)}catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},500)}});
