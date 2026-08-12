import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import {S3Client,ListObjectsV2Command} from "npm:@aws-sdk/client-s3@3";

const cors={
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
 "Access-Control-Allow-Methods":"POST, OPTIONS"
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const env=(...names:string[])=>{for(const n of names){const v=(Deno.env.get(n)||"").trim();if(v)return v}return""};

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);

 try{
  const url=env("SUPABASE_URL");
  const anon=env("SUPABASE_ANON_KEY","SUPABASE_PUBLISHABLE_KEY");
  const service=env("SUPABASE_SERVICE_ROLE_KEY");
  const auth=req.headers.get("Authorization")||"";
  if(!url||!anon||!service)return json({error:"Thiếu Supabase env."},500);
  if(!auth)return json({error:"Chưa đăng nhập."},401);

  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const{data:{user},error:userErr}=await userClient.auth.getUser();
  if(userErr||!user)return json({error:"Phiên đăng nhập không hợp lệ."},401);

  const{data:access,error:accessErr}=await userClient.rpc("get_my_access");
  if(accessErr)return json({error:`Không đọc được quyền Admin: ${accessErr.message}`},403);
  const role=String(access?.role_id||"");
  const perms=Array.isArray(access?.permissions)?access.permissions:[];
  const allowed=access?.status==="active"&&(role==="owner"||role==="admin"||perms.includes("*")||perms.includes("api.manage"));
  if(!allowed)return json({error:"Không có quyền xem usage."},403);

  const admin=createClient(url,service,{auth:{persistSession:false}});
  const{data:db,error:dbErr}=await admin.rpc("admin_system_usage");
  if(dbErr)return json({error:`admin_system_usage: ${dbErr.message}`},500);

  let bytes=0,objects=0,r2Error="";
  const account=env("R2_ACCOUNT_ID","CLOUDFLARE_ACCOUNT_ID");
  const accessKey=env("R2_ACCESS_KEY_ID");
  const secretKey=env("R2_SECRET_ACCESS_KEY");
  const bucket=env("R2_BUCKET_NAME");
  const endpoint=env("R2_ENDPOINT")||(account?`https://${account}.r2.cloudflarestorage.com`:"");

  if(endpoint&&accessKey&&secretKey&&bucket){
   try{
    const s3=new S3Client({region:"auto",endpoint,credentials:{accessKeyId:accessKey,secretAccessKey:secretKey}});
    let token:string|undefined;
    do{
     const page=await s3.send(new ListObjectsV2Command({Bucket:bucket,ContinuationToken:token}));
     for(const o of page.Contents||[]){bytes+=Number(o.Size||0);objects++}
     token=page.IsTruncated?page.NextContinuationToken:undefined;
    }while(token);
   }catch(e){r2Error=e instanceof Error?e.message:String(e)}
  }else r2Error="Thiếu cấu hình R2 trong Supabase secrets.";

  let projectRef="";
  try{projectRef=new URL(url).hostname.split(".")[0]}catch{}

  return json({
   ok:true,
   checked_at:new Date().toISOString(),
   project_ref:projectRef,
   supabase:{
    database_bytes:Number(db?.database_bytes||0),
    storage_bytes:Number(db?.storage_bytes||0),
    storage_objects:Number(db?.storage_objects||0)
   },
   r2:{bytes,objects,error:r2Error||null}
  });
 }catch(e){
  return json({error:e instanceof Error?e.message:String(e)},500);
 }
});