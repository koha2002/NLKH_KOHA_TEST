import{createClient}from"npm:@supabase/supabase-js@2";
function serviceKey(){
  const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(legacy)return legacy;
  try{return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{return""}
}
function publicKey(){
  const legacy=Deno.env.get("SUPABASE_ANON_KEY");
  if(legacy)return legacy;
  try{return JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||""}catch{return""}
}
export function adminClient(){
  const url=Deno.env.get("SUPABASE_URL")!,key=serviceKey();
  if(!url||!key)throw new Error("Missing Supabase service secret");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function callerClient(req:Request){
  const url=Deno.env.get("SUPABASE_URL")!,key=publicKey();
  if(!url||!key)throw new Error("Missing Supabase public key");
  return createClient(url,key,{global:{headers:{Authorization:req.headers.get("Authorization")||""}},auth:{persistSession:false,autoRefreshToken:false}});
}
export async function caller(req:Request){
  const c=callerClient(req),{data:{user}}=await c.auth.getUser();
  if(!user)return{user:null,profile:null,permissions:[] as string[]};
  const admin=adminClient(),{data:profile}=await admin.from("profiles").select("id,email,role_id,status,roles(permissions)").eq("id",user.id).maybeSingle();
  const role=(profile as any)?.roles;
  return{user,profile,permissions:Array.isArray(role?.permissions)?role.permissions:[]};
}
export function hasPermission(ctx:any,p:string){
  return ctx?.profile?.status==="active"&&(ctx.permissions?.includes("*")||ctx.permissions?.includes(p));
}
