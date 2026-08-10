import{adminClient,caller,hasPermission}from"../_shared/auth.ts";import{decryptSecret}from"../_shared/crypto.ts";import{json,corsHeaders}from"../_shared/cors.ts";
function repl(v:any,secret:string,payload:any,placeholder:string):any{if(typeof v==="string"){let o=v.split(placeholder).join(secret);return o.replace(/\{\{payload\.([a-zA-Z0-9_]+)\}\}/g,(_,k)=>String(payload?.[k]??""))}if(Array.isArray(v))return v.map(x=>repl(x,secret,payload,placeholder));if(v&&typeof v==="object")return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,repl(x,secret,payload,placeholder)]));return v}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders(req)});try{
 const scheduler=req.headers.get("x-scheduler-secret"),serverCall=!!scheduler&&scheduler===Deno.env.get("SCHEDULER_SECRET");
 const ctx=serverCall?{user:{id:"scheduler"},profile:{status:"active"},permissions:["*"]}:await caller(req);
 const body=await req.json(),slug=String(body.slug||"");if(!slug)return json(req,{error:"Missing slug"},400);
 const admin=adminClient(),{data:i,error}=await admin.from("api_integrations").select("*").eq("slug",slug).eq("active",true).maybeSingle();if(error||!i)return json(req,{error:"Integration not found"},404);
 if(!serverCall){if(i.scope==="authenticated"&&!ctx.user)return json(req,{error:"Login required"},401);if(i.scope==="admin"&&!hasPermission(ctx,"api.manage"))return json(req,{error:"Forbidden"},403)}
 const secret=i.secret_ciphertext?await decryptSecret(i.secret_ciphertext):"",payload=body.payload||{},placeholder=i.key_placeholder||"{{API_KEY}}";
 const base=new URL(i.base_url),allowed=String(i.allowed_host||"").toLowerCase();if(base.hostname.toLowerCase()!==allowed)throw new Error("allowed_host mismatch");
 const endpoint=repl(i.endpoint_template||"/",secret,payload,placeholder),url=new URL(endpoint,base);if(url.hostname.toLowerCase()!==allowed)throw new Error("Host blocked");
 const query=repl(i.query_template||{},secret,payload,placeholder);for(const[k,v]of Object.entries(query))if(v!=null)url.searchParams.set(k,String(v));
 const h=repl(i.headers_template||{},secret,payload,placeholder),templBody=repl(i.body_template||{},secret,payload,placeholder);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(Number(i.timeout_ms||30000),60000)),method=i.method||"POST";
 const r=await fetch(url,{method,headers:Object.fromEntries(Object.entries(h).map(([k,v])=>[k,String(v)])),body:["GET","DELETE"].includes(method)?undefined:JSON.stringify({...templBody,...payload}),signal:controller.signal});clearTimeout(timer);
 const text=await r.text();let data:any;try{data=JSON.parse(text)}catch{data=text}
 return json(req,{status:r.status,ok:r.ok,data},r.ok?200:502);
}catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},500)}})
