import{adminClient,caller,hasPermission}from"../_shared/auth.ts";
import{corsHeaders,json}from"../_shared/cors.ts";
import{S3Client,ListBucketsCommand,ListObjectsV2Command,GetObjectCommand}from"npm:@aws-sdk/client-s3@3";

const PAGE=250;
const enc=new TextEncoder();
const dec=new TextDecoder();

function b64u(bytes:Uint8Array){
  let s="";
  for(let i=0;i<bytes.length;i+=0x8000){
    s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  }
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function unb64u(s:string){
  const p=s.replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(p+"=".repeat((4-p.length%4)%4));
  const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
async function ticketKey(){
  const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!secret)throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  return crypto.subtle.importKey(
    "raw",enc.encode(secret),
    {name:"HMAC",hash:"SHA-256"},
    false,["sign","verify"]
  );
}
async function signTicket(userId:string){
  const payload={
    kind:"manual-full-backup-v2",
    sub:userId,
    exp:Date.now()+2*60*60*1000,
    nonce:crypto.randomUUID()
  };
  const body=b64u(enc.encode(JSON.stringify(payload)));
  const sig=new Uint8Array(
    await crypto.subtle.sign("HMAC",await ticketKey(),enc.encode(body))
  );
  return{
    token:`${body}.${b64u(sig)}`,
    expires_at:new Date(payload.exp).toISOString()
  };
}
async function verifyTicket(token:string){
  try{
    const[body,sigText]=token.split(".");
    if(!body||!sigText)return null;
    const ok=await crypto.subtle.verify(
      "HMAC",await ticketKey(),unb64u(sigText),enc.encode(body)
    );
    if(!ok)return null;
    const payload=JSON.parse(dec.decode(unb64u(body)));
    if(
      payload?.kind!=="manual-full-backup-v2"||
      !payload?.sub||
      Number(payload?.exp||0)<=Date.now()
    )return null;
    return payload;
  }catch{return null}
}

function r2Config(){
  const account=Deno.env.get("R2_ACCOUNT_ID")||"";
  const access=Deno.env.get("R2_ACCESS_KEY_ID")||"";
  const secret=Deno.env.get("R2_SECRET_ACCESS_KEY")||"";
  const bucket=Deno.env.get("R2_BUCKET_NAME")||"";
  if(!account||!access||!secret||!bucket){
    throw new Error("Missing R2 credentials/bucket.");
  }
  return{
    account,bucket,
    s3:new S3Client({
      region:"auto",
      endpoint:`https://${account}.r2.cloudflarestorage.com`,
      credentials:{accessKeyId:access,secretAccessKey:secret}
    })
  };
}
async function accessibleR2Buckets(){
  const{s3,bucket}=r2Config();
  try{
    const out=await s3.send(new ListBucketsCommand({}));
    const names=(out.Buckets||[])
      .map((x:any)=>String(x?.Name||"").trim())
      .filter(Boolean);
    if(names.length){
      return{
        names:Array.from(new Set(names)).sort(),
        mode:"account-list"
      };
    }
  }catch{}
  return{names:[bucket],mode:"configured-bucket-fallback"};
}
function responseHeaders(req:Request,contentType?:string){
  const h=new Headers(corsHeaders(req));
  // Ticket GETs are authenticated by a short-lived HMAC token, not cookies.
  // Make CORS explicit because Admin is hosted on a different origin.
  h.set("Access-Control-Allow-Origin","*");
  h.set("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  h.set(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type"
  );
  h.set("Cache-Control","no-store");
  h.set("X-Content-Type-Options","nosniff");
  h.set(
    "Access-Control-Expose-Headers",
    "Content-Type,ETag,Last-Modified,Cache-Control,Content-Disposition,Content-Language,X-NLKH-Object-Meta,X-NLKH-Chunk-Start,X-NLKH-Chunk-Bytes,X-NLKH-Content-Range"
  );
  if(contentType)h.set("Content-Type",contentType);
  return h;
}
function objectMetaHeader(value:any){
  try{
    const text=JSON.stringify(value||{});
    if(text.length>7000)return"";
    return b64u(enc.encode(text));
  }catch{return""}
}
async function technologyNewsKvBackup(){
  const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!secret)throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  const path="/backup-config-internal";
  const ts=String(Math.floor(Date.now()/1000));
  const key=await crypto.subtle.importKey(
    "raw",enc.encode(secret),
    {name:"HMAC",hash:"SHA-256"},
    false,["sign"]
  );
  const sig=new Uint8Array(
    await crypto.subtle.sign("HMAC",key,enc.encode(`${ts}\n${path}`))
  );
  const base=(Deno.env.get("TECHNOLOGY_NEWS_URL")||
    "https://automation.nguyenlekhanhhoa.com").replace(/\/$/,"");
  const res=await fetch(`${base}${path}`,{
    headers:{
      "x-nlkh-backup-ts":ts,
      "x-nlkh-backup-signature":b64u(sig)
    }
  });
  const text=await res.text();
  if(!res.ok)throw new Error(
    `Technology News KV backup HTTP ${res.status}: ${text.slice(0,1000)}`
  );
  const data=text?JSON.parse(text):{};
  if(!data?.ok||!Array.isArray(data?.keys)){
    throw new Error("Technology News KV backup returned invalid payload.");
  }
  return data;
}

async function tableInventory(admin:any){
  const{data,error}=await admin.rpc("manual_backup_table_inventory");
  if(error)throw error;
  return(data||[]).map((x:any)=>({
    table_name:String(x.table_name),
    row_count:Number(x.row_count||0)
  }));
}
async function authCount(admin:any){
  let page=1,count=0;
  while(page<=10000){
    const{data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
    if(error)throw error;
    const users=data?.users||[];
    count+=users.length;
    if(users.length<1000)break;
    page++;
  }
  return count;
}
async function storageBuckets(admin:any){
  const{data,error}=await admin.rpc("manual_backup_storage_buckets");
  if(error)throw error;
  return Array.isArray(data)?data:[];
}
async function storageInventory(admin:any){
  let count=0,bytes=0;
  for(let offset=0;;offset+=PAGE){
    const{data,error}=await admin.rpc(
      "manual_backup_storage_objects_page",
      {p_offset:offset,p_limit:PAGE}
    );
    if(error)throw error;
    const rows=Array.isArray(data)?data:[];
    count+=rows.length;
    for(const x of rows){
      bytes+=Number(x?.metadata?.size||0);
    }
    if(rows.length<PAGE)break;
  }
  return{count,bytes};
}
async function r2Inventory(){
  const{s3}=r2Config();
  const access=await accessibleR2Buckets();
  const buckets:any[]=[];
  let count=0,bytes=0;
  for(const bucket of access.names){
    let bucketCount=0,bucketBytes=0,token:string|undefined=undefined;
    do{
      const out=await s3.send(new ListObjectsV2Command({
        Bucket:bucket,ContinuationToken:token,MaxKeys:1000
      }));
      for(const o of out.Contents||[]){
        if(!o.Key)continue;
        bucketCount++;
        bucketBytes+=Number(o.Size||0);
      }
      token=out.IsTruncated&&out.NextContinuationToken
        ?String(out.NextContinuationToken):undefined;
    }while(token);
    buckets.push({name:bucket,objects:bucketCount,bytes:bucketBytes});
    count+=bucketCount;
    bytes+=bucketBytes;
  }
  return{
    mode:access.mode,
    buckets,
    total_buckets:buckets.length,
    count,
    bytes
  };
}
async function inventory(admin:any){
  const[tables,auth,buckets,storage,r2]=await Promise.all([
    tableInventory(admin),
    authCount(admin),
    storageBuckets(admin),
    storageInventory(admin),
    r2Inventory()
  ]);
  return{
    ok:true,
    ready:true,
    format:"NLKH_MANUAL_FULL_BACKUP_V4_2",
    checked_at:new Date().toISOString(),
    database:{
      tables,
      total_tables:tables.length,
      total_rows:tables.reduce((n:number,x:any)=>n+x.row_count,0)
    },
    auth:{users:auth},
    supabase_storage:{
      buckets:buckets.length,
      objects:storage.count,
      bytes:storage.bytes
    },
    r2:{
      mode:r2.mode,
      buckets:r2.buckets,
      total_buckets:r2.total_buckets,
      objects:r2.count,
      bytes:r2.bytes
    },
    estimated_binary_bytes:storage.bytes+r2.bytes,
    consistency:"non-transactional-cross-service",
    known_external_state:[
      "Git/source repository is separate from runtime data.",
      "Secret VALUES are intentionally not exportable from runtime."
    ]
  };
}

async function getTablePage(admin:any,u:URL,req:Request){
  const table=String(u.searchParams.get("table")||"");
  const offset=Math.max(0,Number(u.searchParams.get("offset")||0));
  const limit=Math.min(500,Math.max(1,Number(u.searchParams.get("limit")||PAGE)));
  const{data,error}=await admin.rpc("manual_backup_table_page",{
    p_table:table,p_offset:offset,p_limit:limit
  });
  if(error)throw error;
  return json(req,{rows:Array.isArray(data)?data:[]});
}
async function getAuthPage(admin:any,u:URL,req:Request){
  const page=Math.max(1,Number(u.searchParams.get("page")||1));
  const perPage=Math.min(1000,Math.max(1,Number(u.searchParams.get("limit")||1000)));
  const{data,error}=await admin.auth.admin.listUsers({page,perPage});
  if(error)throw error;
  return json(req,{users:data?.users||[]});
}
async function getStorageListPage(admin:any,u:URL,req:Request){
  const offset=Math.max(0,Number(u.searchParams.get("offset")||0));
  const limit=Math.min(500,Math.max(1,Number(u.searchParams.get("limit")||PAGE)));
  const{data,error}=await admin.rpc("manual_backup_storage_objects_page",{
    p_offset:offset,p_limit:limit
  });
  if(error)throw error;
  return json(req,{objects:Array.isArray(data)?data:[]});
}
async function getR2ListPage(u:URL,req:Request){
  const{s3}=r2Config();
  const bucket=String(u.searchParams.get("bucket")||"");
  if(!bucket)throw new Error("Missing R2 bucket.");
  const allowed=await accessibleR2Buckets();
  if(!allowed.names.includes(bucket))throw new Error("R2 bucket is not accessible.");
  const cursor=u.searchParams.get("cursor")||undefined;
  const limit=Math.min(1000,Math.max(1,Number(u.searchParams.get("limit")||250)));
  const out=await s3.send(new ListObjectsV2Command({
    Bucket:bucket,
    ContinuationToken:cursor,
    MaxKeys:limit
  }));
  const objects=(out.Contents||[])
    .filter((o:any)=>!!o.Key)
    .map((o:any)=>({
      key:String(o.Key),
      size:Number(o.Size||0),
      etag:String(o.ETag||""),
      last_modified:o.LastModified?o.LastModified.toISOString():null,
      storage_class:String(o.StorageClass||"")
    }));
  return json(req,{
    bucket,objects,
    next_cursor:out.IsTruncated&&out.NextContinuationToken
      ?String(out.NextContinuationToken):null
  });
}
async function getStorageFile(admin:any,u:URL,req:Request){
  const bucket=String(u.searchParams.get("bucket")||"");
  const name=String(u.searchParams.get("name")||"");
  if(!bucket||!name)throw new Error("Missing storage bucket/name.");
  const{data:signed,error}=await admin.storage.from(bucket).createSignedUrl(name,300);
  if(error||!signed?.signedUrl){
    throw new Error(error?.message||"Cannot create Storage signed URL.");
  }
  const upstream=await fetch(signed.signedUrl,{redirect:"follow",headers:{"Accept-Encoding":"identity"}});
  if(!upstream.ok||!upstream.body){
    throw new Error(`Storage HTTP ${upstream.status}: ${bucket}/${name}`);
  }
  const h=responseHeaders(req,upstream.headers.get("Content-Type")||"application/octet-stream");
  for(const key of [
    "ETag","Last-Modified","Cache-Control",
    "Content-Disposition","Content-Language"
  ]){
    const v=upstream.headers.get(key);
    if(v)h.set(key,v);
  }
  h.set("X-NLKH-Object-Meta",objectMetaHeader({
    provider:"supabase-storage",bucket,name
  }));
  return new Response(upstream.body,{status:200,headers:h});
}
async function bodyToBytes(raw:any){
  if(typeof raw?.transformToByteArray==="function"){
    return new Uint8Array(await raw.transformToByteArray());
  }
  if(typeof raw?.transformToWebStream==="function"){
    return new Uint8Array(
      await new Response(raw.transformToWebStream()).arrayBuffer()
    );
  }
  return new Uint8Array(await new Response(raw).arrayBuffer());
}
async function getR2File(u:URL,req:Request){
  const bucket=String(u.searchParams.get("bucket")||"");
  const key=String(u.searchParams.get("key")||"");
  if(!bucket||!key)throw new Error("Missing R2 bucket/object key.");

  const start=Math.max(0,Math.floor(Number(u.searchParams.get("start")||0)));
  const requested=Math.max(1,Math.floor(Number(u.searchParams.get("length")||2097152)));
  const length=Math.min(4*1024*1024,requested);
  const end=start+length-1;

  const{s3}=r2Config();
  const allowed=await accessibleR2Buckets();
  if(!allowed.names.includes(bucket))throw new Error("R2 bucket is not accessible.");

  // NLKH_BACKUP_V42_R2_CHUNKS:
  // Do NOT relay the AWS SDK body stream through Supabase Edge. The relay can
  // remain open and make ZipWriter appear stuck at 0/N. Read only a small byte
  // range into memory, return a finite response, and let the browser request
  // the next chunk. This also works for large objects without one long Edge run.
  const obj=await s3.send(new GetObjectCommand({
    Bucket:bucket,
    Key:key,
    Range:`bytes=${start}-${end}`
  }));
  if(!obj.Body)throw new Error(`R2 object has no body: ${key}`);

  const bytes=await bodyToBytes(obj.Body);
  const h=responseHeaders(req,String(obj.ContentType||"application/octet-stream"));
  h.set("X-NLKH-Chunk-Start",String(start));
  h.set("X-NLKH-Chunk-Bytes",String(bytes.byteLength));
  if(obj.ContentRange)h.set("X-NLKH-Content-Range",String(obj.ContentRange));
  if(obj.ETag)h.set("ETag",String(obj.ETag));
  if(obj.LastModified)h.set("Last-Modified",obj.LastModified.toUTCString());
  if(obj.CacheControl)h.set("Cache-Control",String(obj.CacheControl));
  if(obj.ContentDisposition)h.set("Content-Disposition",String(obj.ContentDisposition));
  if(obj.ContentLanguage)h.set("Content-Language",String(obj.ContentLanguage));
  h.set("X-NLKH-Object-Meta",objectMetaHeader({
    provider:"cloudflare-r2",
    bucket,key,
    content_type:obj.ContentType||null,
    cache_control:obj.CacheControl||null,
    content_disposition:obj.ContentDisposition||null,
    content_encoding:obj.ContentEncoding||null,
    content_language:obj.ContentLanguage||null,
    expires:obj.Expires?obj.Expires.toISOString():null,
    metadata:obj.Metadata||{},
    etag:obj.ETag||null,
    last_modified:obj.LastModified?obj.LastModified.toISOString():null,
    content_range:obj.ContentRange||null
  }));
  return new Response(bytes,{status:200,headers:h});
}

Deno.serve(async req=>{
  const u=new URL(req.url);

  if(req.method==="OPTIONS"){
    return new Response("ok",{headers:responseHeaders(req,"text/plain; charset=utf-8")});
  }

  if(req.method==="GET"){
    const ticket=String(u.searchParams.get("ticket")||"");
    if(!(await verifyTicket(ticket))){
      return new Response(
        "Invalid or expired backup ticket.",
        {status:403,headers:responseHeaders(req,"text/plain; charset=utf-8")}
      );
    }
    try{
      const admin=adminClient();
      const op=String(u.searchParams.get("op")||"");
      if(op==="table-page")return await getTablePage(admin,u,req);
      if(op==="auth-page")return await getAuthPage(admin,u,req);
      if(op==="storage-list-page")return await getStorageListPage(admin,u,req);
      if(op==="r2-list-page")return await getR2ListPage(u,req);
      if(op==="storage-file")return await getStorageFile(admin,u,req);
      if(op==="r2-file")return await getR2File(u,req);
      if(op==="technology-news-kv"){
        return json(req,await technologyNewsKvBackup());
      }
      if(op==="schema"){
        const{data,error}=await admin.rpc("manual_backup_schema_metadata");
        if(error)throw error;
        return json(req,{schema:data||{}});
      }
      if(op==="meta"){
        const buckets=await storageBuckets(admin);
        const r2=r2Config();
        const secretNames=[
          "SUPABASE_SERVICE_ROLE_KEY","INTEGRATION_SECRETS_KEY","SCHEDULER_SECRET",
          "R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","CLOUDFLARE_API_TOKEN"
        ];
        return json(req,{
          generated_at:new Date().toISOString(),
          safe_runtime:{
            supabase_url:Deno.env.get("SUPABASE_URL")||"",
            r2_account_id:r2.account,
            r2_bucket_name:r2.bucket,
            technology_news_url:Deno.env.get("TECHNOLOGY_NEWS_URL")||
              "https://automation.nguyenlekhanhhoa.com",
            edge_region:Deno.env.get("SB_REGION")||""
          },
          secret_presence_only:Object.fromEntries(
            secretNames.map(k=>[k,{present:!!Deno.env.get(k)}])
          ),
          supabase_storage_buckets:buckets
        });
      }
      return json(req,{error:"Unknown GET operation"},400);
    }catch(e){
      return json(req,{error:e instanceof Error?e.message:String(e)},500);
    }
  }

  if(req.method!=="POST")return json(req,{error:"Method not allowed"},405);

  try{
    const ctx=await caller(req);
    if(!hasPermission(ctx,"api.manage"))return json(req,{error:"Forbidden"},403);

    const body=await req.json().catch(()=>({}));
    const action=String(body?.action||"inventory");
    const admin=adminClient();

    if(action==="json-op"){
      const op=String(body?.op||"");
      const v=new URL(req.url);
      for(const[k,val]of Object.entries(body||{})){
        if(k==="action"||k==="op"||val===undefined||val===null||val==="")continue;
        v.searchParams.set(k,String(val));
      }

      if(op==="table-page")return await getTablePage(admin,v,req);
      if(op==="auth-page")return await getAuthPage(admin,v,req);
      if(op==="storage-list-page")return await getStorageListPage(admin,v,req);
      if(op==="r2-list-page")return await getR2ListPage(v,req);
      if(op==="technology-news-kv"){
        return json(req,await technologyNewsKvBackup());
      }
      if(op==="schema"){
        const{data,error}=await admin.rpc("manual_backup_schema_metadata");
        if(error)throw error;
        return json(req,{schema:data||{}});
      }
      if(op==="meta"){
        const buckets=await storageBuckets(admin);
        const r2=r2Config();
        const secretNames=[
          "SUPABASE_SERVICE_ROLE_KEY","INTEGRATION_SECRETS_KEY","SCHEDULER_SECRET",
          "R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","CLOUDFLARE_API_TOKEN"
        ];
        return json(req,{
          generated_at:new Date().toISOString(),
          safe_runtime:{
            supabase_url:Deno.env.get("SUPABASE_URL")||"",
            r2_account_id:r2.account,
            r2_bucket_name:r2.bucket,
            technology_news_url:Deno.env.get("TECHNOLOGY_NEWS_URL")||
              "https://automation.nguyenlekhanhhoa.com",
            edge_region:Deno.env.get("SB_REGION")||""
          },
          secret_presence_only:Object.fromEntries(
            secretNames.map(k=>[k,{present:!!Deno.env.get(k)}])
          ),
          supabase_storage_buckets:buckets
        });
      }
      return json(req,{error:"Unknown JSON backup operation"},400);
    }

    if(action==="inventory"){
      return json(req,await inventory(admin));
    }

    if(action==="ticket"){
      const signed=await signTicket(String(ctx.user?.id||""));
      const endpoint=new URL(req.url);
      endpoint.search="";
      return json(req,{
        ok:true,
        ticket:signed.token,
        expires_at:signed.expires_at,
        endpoint:endpoint.toString()
      });
    }

    return json(req,{error:"Unknown action"},400);
  }catch(e){
    return json(req,{error:e instanceof Error?e.message:String(e)},500);
  }
});
