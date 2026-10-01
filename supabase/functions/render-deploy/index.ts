const publishPermissions=["site.manage","content.manage","news.manage","tools.manage","seo.manage"];

function serviceSecret(){
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(legacy)return legacy;
 try{return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{return""}
}

function publicKey(){
 const legacy=Deno.env.get("SUPABASE_ANON_KEY");
 if(legacy)return legacy;
 try{return JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||""}catch{return""}
}

async function caller(req:Request){
 const url=String(Deno.env.get("SUPABASE_URL")||"").replace(/\/$/,"");
 const anon=publicKey();
 const service=serviceSecret();
 const authorization=req.headers.get("Authorization")||"";

 if(!url||!anon||!service||!authorization.startsWith("Bearer ")){
  return{user:null,profile:null,permissions:[] as string[]};
 }

 const userResponse=await fetch(url+"/auth/v1/user",{
  headers:{
   apikey:anon,
   Authorization:authorization
  }
 });

 if(!userResponse.ok){
  return{user:null,profile:null,permissions:[] as string[]};
 }

 const user:any=await userResponse.json();
 if(!user?.id){
  return{user:null,profile:null,permissions:[] as string[]};
 }

 const profileUrl=
  url+
  "/rest/v1/profiles?select=id,email,role_id,status,roles(permissions)&id=eq."+
  encodeURIComponent(String(user.id))+
  "&limit=1";

 const profileResponse=await fetch(profileUrl,{
  headers:{
   apikey:service,
   Authorization:"Bearer "+service,
   Accept:"application/json"
  }
 });

 if(!profileResponse.ok){
  throw new Error(
   "Profile lookup failed HTTP "+
   profileResponse.status+
   ": "+
   (await profileResponse.text()).slice(0,500)
  );
 }

 const rows:any=await profileResponse.json();
 const profile=Array.isArray(rows)?rows[0]||null:null;
 const relation=(profile as any)?.roles;
 const role=Array.isArray(relation)?relation[0]:relation;
 const permissions=Array.isArray(role?.permissions)?role.permissions:[];

 return{user,profile,permissions};
}

function hasPermission(ctx:any,p:string){
 return ctx?.profile?.status==="active"&&(
  ctx.permissions?.includes("*")||
  ctx.permissions?.includes(p)
 );
}

function corsHeaders(req:Request){
 const allowed=(Deno.env.get("ALLOWED_ORIGINS")||"")
  .split(",")
  .map(x=>x.trim())
  .filter(Boolean);
 const origin=req.headers.get("origin")||"";
 const allowOrigin=
  allowed.includes("*")||
  allowed.includes(origin)
   ?(origin||"*")
   :(allowed[0]||"*");

 return{
  "Access-Control-Allow-Origin":allowOrigin,
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-scheduler-secret",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Vary":"Origin"
 };
}

function json(req:Request,body:unknown,status=200){
 return new Response(
  JSON.stringify(body),
  {
   status,
   headers:{
    ...corsHeaders(req),
    "Content-Type":"application/json"
   }
  }
 );
}

function b64uDecode(value:string){
 const p=String(value||"").replace(/-/g,"+").replace(/_/g,"/");
 const raw=atob(p+"=".repeat((4-p.length%4)%4));
 const out=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
 return out;
}

async function verifyInternalPublishRequest(req:Request){
 try{
  const ts=req.headers.get("x-nlkh-publish-ts")||"";
  const target=req.headers.get("x-nlkh-publish-target")||"";
  const signature=req.headers.get("x-nlkh-publish-signature")||"";
  const epoch=Number(ts);

  if(
   !Number.isFinite(epoch)||
   Math.abs(Math.floor(Date.now()/1000)-epoch)>90||
   !["frontend","probe"].includes(target)||
   !signature
  ){
   return false;
  }

  const secret=serviceSecret();
  if(!secret)return false;

  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey(
   "raw",
   enc.encode(secret),
   {name:"HMAC",hash:"SHA-256"},
   false,
   ["verify"]
  );

  return await crypto.subtle.verify(
   "HMAC",
   key,
   b64uDecode(signature),
   enc.encode(`${ts}\n${target}`)
  );
 }catch{
  return false;
 }
}

Deno.serve(async req=>{
 if(req.method==="OPTIONS"){
  return new Response("ok",{headers:corsHeaders(req)});
 }

 try{
  const internal=await verifyInternalPublishRequest(req);
  let allowed=internal;
  let role="internal";

  if(!internal){
   const ctx=await caller(req);
   role=String(ctx?.profile?.role_id||"");

   allowed=ctx?.profile?.status==="active"&&(
    role==="owner"||
    role==="admin"||
    publishPermissions.some(p=>hasPermission(ctx,p))
   );
  }

  if(!allowed){
   return json(
    req,
    {
     error:`Không có quyền Xuất bản frontend. Role hiện tại: ${role||"unknown"}. Cần owner/admin hoặc một quyền quản lý nội dung build-time.`
    },
    403
   );
  }

  const{target}=await req.json();
  const hook=Deno.env.get("RENDER_FRONTEND_DEPLOY_HOOK");

  if(
   internal&&
   req.headers.get("x-nlkh-publish-target")!==target
  ){
   return json(req,{error:"Signed publish target mismatch"},403);
  }

  if(internal&&target==="probe"){
   return json(req,{
    ok:true,
    internal:true,
    ready:Boolean(hook)
   });
  }

  if(target!=="frontend"){
   return json(req,{error:"Unsupported target"},400);
  }

  if(!hook){
   return json(req,{error:"Chưa cấu hình RENDER_FRONTEND_DEPLOY_HOOK"},500);
  }

  const r=await fetch(hook,{method:"POST"});
  if(!r.ok){
   throw new Error(`Render hook HTTP ${r.status}`);
  }

  return json(req,{
   ok:true,
   internal,
   message:"Đã yêu cầu Render build lại frontend."
  });
 }catch(e){
  return json(
   req,
   {error:e instanceof Error?e.message:String(e)},
   500
  );
 }
});
