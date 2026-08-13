import { S3Client,DeleteObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { adminClient,caller,hasPermission } from "../_shared/auth.ts";
import { corsHeaders,json } from "../_shared/cors.ts";

function r2(){
  const account=Deno.env.get("R2_ACCOUNT_ID"),access=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY");
  if(!account||!access||!secret)throw new Error("Thiếu R2 credentials.");
  return new S3Client({region:"auto",endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId:access,secretAccessKey:secret}});
}
async function stillUsed(admin:any,id:string){
  const refs=[
    ["site_settings","og_media_id"],["site_settings","favicon_media_id"],
    ["navigation_items","icon_media_id"],["social_links","icon_media_id"],
    ["seo_entries","og_media_id"],["tools","icon_media_id"],["profiles","avatar_media_id"],
    ["news_articles","cover_media_id"],["news_article_media","media_id"],
    ["software_items","icon_media_id"],["software_items","cover_media_id"],
    ["software_items","download_media_id"],["cv_profiles","photo_media_id"],
    ["cv_profiles","pdf_media_id"],["data_items","media_id"]
  ];
  for(const [table,column] of refs){
    const {count,error}=await admin.from(table).select("*",{head:true,count:"exact"}).eq(column,id);
    if(error)throw error;
    if(count&&count>0)return true;
  }
  return false;
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});
  if(req.method!=="POST")return json(req,{error:"POST only"},405);
  try{
    const ctx=await caller(req);
    if(!hasPermission(ctx,"news.manage"))return json(req,{error:"Bạn không có quyền xóa bài News."},403);

    const body=await req.json();
    const articleId=String(body.article_id||"").trim();
    if(!articleId)return json(req,{error:"Thiếu article_id."},400);

    const admin=adminClient();
    const {data:article,error:articleError}=await admin.from("news_articles")
      .select("id,cover_media_id").eq("id",articleId).maybeSingle();
    if(articleError)throw articleError;
    if(!article)return json(req,{error:"Không tìm thấy bài."},404);

    const {data:mapped,error:mapError}=await admin.from("news_article_media")
      .select("media_id").eq("article_id",articleId);
    if(mapError)throw mapError;

    const mediaIds=[...new Set([
      article.cover_media_id,
      ...(mapped||[]).map((x:any)=>x.media_id)
    ].filter(Boolean))];

    const {error:deleteError}=await admin.from("news_articles").delete().eq("id",articleId);
    if(deleteError)throw deleteError;

    const s3=r2();
    const bucket=Deno.env.get("R2_BUCKET_NAME")||"";
    const deleted:string[]=[];
    const kept:string[]=[];
    const failed:string[]=[];

    for(const mediaId of mediaIds){
      try{
        if(await stillUsed(admin,String(mediaId))){
          kept.push(String(mediaId));
          continue;
        }
        const {data:asset,error:assetError}=await admin.from("media_assets")
          .select("id,object_key").eq("id",mediaId).maybeSingle();
        if(assetError)throw assetError;
        if(!asset)continue;

        if(bucket&&asset.object_key){
          await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:asset.object_key}));
        }
        const {error:assetDeleteError}=await admin.from("media_assets").delete().eq("id",mediaId);
        if(assetDeleteError)throw assetDeleteError;
        deleted.push(String(mediaId));
      }catch(e){
        failed.push(`${mediaId}: ${e instanceof Error?e.message:String(e)}`);
      }
    }

    return json(req,{ok:true,deleted_media:deleted,kept_shared:kept,cleanup_failed:failed});
  }catch(e){
    return json(req,{error:e instanceof Error?e.message:String(e)},500);
  }
});