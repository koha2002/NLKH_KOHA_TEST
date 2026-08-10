import{createClient}from"@supabase/supabase-js";const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=createClient(url||"",key||"",{auth:{flowType:"pkce",persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function invoke(name,body){
 const{data:{session}}=await supabase.auth.getSession();let r;
 try{r=await fetch(`${url.replace(/\/$/,"")}/functions/v1/${name}`,{method:"POST",headers:{"Content-Type":"application/json",...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify(body||{})})}
 catch(e){throw new Error(`Failed to fetch Edge Function “${name}”. Origin hiện tại: ${typeof location!=="undefined"?location.origin:"unknown"}. Kiểm tra mạng và ALLOWED_ORIGINS/CORS. ${e instanceof Error?e.message:""}`)}
 const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch{d={message:t}}if(!r.ok)throw new Error(d.error||d.message||`HTTP ${r.status}`);return d
}
