import{caller,hasPermission}from"../_shared/auth.ts";import{json,corsHeaders}from"../_shared/cors.ts";
const publishPermissions=["site.manage","content.manage","news.manage","tools.manage","seo.manage"];
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});try{
 const ctx=await caller(req),role=String(ctx?.profile?.role_id||"");
 const allowed=ctx?.profile?.status==="active"&&(role==="owner"||role==="admin"||publishPermissions.some(p=>hasPermission(ctx,p)));
 if(!allowed)return json(req,{error:`Không có quyền Xuất bản frontend. Role hiện tại: ${role||"unknown"}. Cần owner/admin hoặc một quyền quản lý nội dung build-time.`},403);
 const{target}=await req.json();if(target!=="frontend")return json(req,{error:"Unsupported target"},400);
 const hook=Deno.env.get("RENDER_FRONTEND_DEPLOY_HOOK");if(!hook)return json(req,{error:"Chưa cấu hình RENDER_FRONTEND_DEPLOY_HOOK"},500);
 const r=await fetch(hook,{method:"POST"});if(!r.ok)throw new Error(`Render hook HTTP ${r.status}`);
 return json(req,{ok:true,message:"Đã yêu cầu Render build lại frontend."});
}catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},500)}});
