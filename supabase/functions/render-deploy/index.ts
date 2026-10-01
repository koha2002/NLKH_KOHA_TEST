import{caller,hasPermission}from"../_shared/auth.ts";import{json,corsHeaders}from"../_shared/cors.ts";

const publishPermissions=["site.manage","content.manage","news.manage","tools.manage","seo.manage"];

function serviceSecret(){
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(legacy)return legacy;
 try{return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{return""}
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
  const signature=req.headers.get("x-nlkh-publish-signature")||"";
  const epoch=Number(ts);
  if(!Number.isFinite(epoch)||Math.abs(Math.floor(Date.now()/1000)-epoch)>90||!signature)return false;
  const secret=serviceSecret();
  if(!secret)return false;
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  return await crypto.subtle.verify(
   "HMAC",
   key,
   b64uDecode(signature),
   enc.encode(`${ts}\n${new URL(req.url).pathname}`)
  );
 }catch{return false}
}

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});
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
   return json(req,{
    error:`Không có quyền Xuất bản frontend. Role hiện tại: ${role||"unknown"}. Cần owner/admin hoặc một quyền quản lý nội dung build-time.`
   },403);
  }

  const{target}=await req.json();
  if(target!=="frontend")return json(req,{error:"Unsupported target"},400);

  const hook=Deno.env.get("RENDER_FRONTEND_DEPLOY_HOOK");
  if(!hook)return json(req,{error:"Chưa cấu hình RENDER_FRONTEND_DEPLOY_HOOK"},500);

  const r=await fetch(hook,{method:"POST"});
  if(!r.ok)throw new Error(`Render hook HTTP ${r.status}`);

  return json(req,{
   ok:true,
   internal,
   message:"Đã yêu cầu Render build lại frontend."
  });
 }catch(e){
  return json(req,{error:e instanceof Error?e.message:String(e)},500)
 }
});
