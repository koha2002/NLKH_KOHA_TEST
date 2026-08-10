export function corsHeaders(req: Request) {
  const allowed=(Deno.env.get("ALLOWED_ORIGINS")||"").split(",").map(x=>x.trim()).filter(Boolean);
  const origin=req.headers.get("origin")||"";
  const allowOrigin=allowed.includes("*")||allowed.includes(origin)?(origin||"*"):(allowed[0]||"*");
  return {
    "Access-Control-Allow-Origin":allowOrigin,
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-scheduler-secret",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
export function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...corsHeaders(req),"Content-Type":"application/json"}});
}
