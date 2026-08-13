import { S3Client,PutObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { adminClient } from "../_shared/auth.ts";
import { corsHeaders,json } from "../_shared/cors.ts";

function safe(name:string){return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"image"}
function code(n:number){return `R2-${String(n).padStart(6,"0")}`}
function publicUrl(key:string){
  const base=(Deno.env.get("R2_PUBLIC_BASE_URL")||"").trim().replace(/\/$/,"");
  if(!/^https?:\/\/[^()[\]\s]+$/i.test(base))throw new Error("R2_PUBLIC_BASE_URL chưa hợp lệ.");
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
function r2(){
  const account=Deno.env.get("R2_ACCOUNT_ID"),access=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY");
  if(!account||!access||!secret)throw new Error("Thiếu R2 credentials.");
  return new S3Client({region:"auto",endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId:access,secretAccessKey:secret}});
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});
  if(req.method!=="POST")return json(req,{error:"POST only"},405);
  try{
    const expected=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    if(!expected||req.headers.get("authorization")!==`Bearer ${expected}`)return json(req,{error:"Unauthorized"},401);

    const body=await req.json();
    const articleId=String(body.article_id||"").trim();
    const sourceUrl=String(body.source_image_url||"").trim();
    const role=String(body.role||"inline")==="cover"?"cover":"inline";
    const sortOrder=Math.max(0,Number(body.sort_order||0));

    if(!articleId||!/^https?:\/\//i.test(sourceUrl))return json(req,{error:"Thiếu article_id/source_image_url."},400);

    const admin=adminClient();
    const {data:article,error:articleError}=await admin.from("news_articles")
      .select("id,title_vi,title_en,cover_media_id")
      .eq("id",articleId).maybeSingle();
    if(articleError)throw articleError;
    if(!article)return json(req,{error:"Article not found"},404);

    if(role==="cover"&&article.cover_media_id){
      const {data:existing}=await admin.from("media_assets").select("id,public_url,object_key").eq("id",article.cover_media_id).maybeSingle();
      if(existing){
        await admin.from("news_article_media").upsert({
          article_id:articleId,media_id:existing.id,role:"cover",sort_order:0,source_url:sourceUrl
        },{onConflict:"article_id,media_id"});
        return json(req,{ok:true,media_id:existing.id,url:existing.public_url||publicUrl(existing.object_key),skipped:"cover_exists"});
      }
    }

    const response=await fetch(sourceUrl,{
      headers:{
        "User-Agent":"NLKH-Technology-NewsBot/1.0 (+https://nguyenlekhanhhoa.com/news)",
        Accept:"image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
      },
      redirect:"follow"
    });
    if(!response.ok)throw new Error(`Source image HTTP ${response.status}`);

    const type=(response.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
    if(!type.startsWith("image/"))throw new Error(`Không phải ảnh (${type||"unknown"}).`);

    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.byteLength<4096)throw new Error("Ảnh quá nhỏ.");
    if(bytes.byteLength>12*1024*1024)throw new Error("Ảnh vượt 12 MB.");

    const hash=await crypto.subtle.digest("SHA-256",bytes);
    const sha=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");

    const {data:dupe,error:dupeError}=await admin.from("media_assets")
      .select("*").eq("sha256",sha).eq("visibility","public").eq("status","ready").maybeSingle();
    if(dupeError)throw dupeError;

    let asset=dupe;
    if(!asset){
      let ext="jpg";
      if(type==="image/png")ext="png";
      else if(type==="image/webp")ext="webp";
      else if(type==="image/avif")ext="avif";
      else if(type==="image/gif")ext="gif";

      const original=safe(`${role}-${sortOrder}.${ext}`);
      const temp=`pending/${crypto.randomUUID()}`;
      const {data:created,error:createError}=await admin.from("media_assets").insert({
        object_key:temp,
        original_name:original,
        mime_type:type,
        size_bytes:bytes.byteLength,
        title:article.title_vi||article.title_en||original,
        alt_vi:article.title_vi||"",
        alt_en:article.title_en||article.title_vi||"",
        folder:`news/${articleId}`,
        visibility:"public",
        owner_id:null,
        sha256:sha,
        status:"pending",
        usage_note:`News ${role} ${articleId}`,
        uploaded_from:"automation"
      }).select("*").single();
      if(createError)throw createError;

      const objectKey=`news/${articleId}/${code(created.asset_no)}/${original}`;
      const pub=publicUrl(objectKey);
      const bucket=Deno.env.get("R2_BUCKET_NAME")||"";
      if(!bucket)throw new Error("Thiếu R2_BUCKET_NAME.");

      await r2().send(new PutObjectCommand({
        Bucket:bucket,Key:objectKey,Body:bytes,ContentType:type,
        CacheControl:"public, max-age=31536000, immutable"
      }));

      const {data:ready,error:readyError}=await admin.from("media_assets")
        .update({object_key:objectKey,public_url:pub,status:"ready"})
        .eq("id",created.id).select("*").single();
      if(readyError)throw readyError;
      asset=ready;
    }

    const url=asset.public_url||publicUrl(String(asset.object_key));

    const {error:mapError}=await admin.from("news_article_media").upsert({
      article_id:articleId,
      media_id:asset.id,
      role,
      sort_order:sortOrder,
      source_url:sourceUrl
    },{onConflict:"article_id,media_id"});
    if(mapError)throw mapError;

    if(role==="cover"){
      const {error:updateError}=await admin.from("news_articles").update({
        cover_media_id:asset.id,
        cover_image:url,
        cover_alt_vi:article.title_vi||"",
        cover_alt_en:article.title_en||article.title_vi||""
      }).eq("id",articleId);
      if(updateError)throw updateError;
    }

    return json(req,{ok:true,media_id:asset.id,url,duplicate:!!dupe,role,sort_order:sortOrder});
  }catch(e){
    return json(req,{error:e instanceof Error?e.message:String(e)},500);
  }
});