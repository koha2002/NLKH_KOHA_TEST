import fs from "node:fs";
import path from "node:path";
const source=path.resolve("public/content/admin/redirects.json"),out=path.resolve("out");
if(!fs.existsSync(source)||!fs.existsSync(out)){console.log("[Redirect] Không có dữ liệu/out; bỏ qua.");process.exit(0)}
let rows=[];try{rows=JSON.parse(fs.readFileSync(source,"utf8"))}catch(e){console.warn("[Redirect] JSON lỗi:",e.message);process.exit(0)}
function cleanRoute(v=""){const s=String(v).trim();if(!s.startsWith("/")||s.includes("..")||/[?*#]/.test(s))return null;return s.replace(/^\/+|\/+$/g,"")}
function esc(v=""){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}
let n=0;
const mainHost=(()=>{try{return new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://nguyenlekhanhhoa.com").hostname.toLowerCase()}catch{return"nguyenlekhanhhoa.com"}})();
for(const r of rows){
  const sourceHost=String(r.source_host||mainHost).toLowerCase();
  // Cross-domain redirect được Cloudflare Edge xử lý; không sinh nhầm HTML fallback trên miền chính.
  if(sourceHost!==mainHost)continue;if(r.active===false)continue;const route=cleanRoute(r.source_path);if(route===null)continue;const target=String(r.target_url||"").trim();if(!target)continue;const dir=route?path.join(out,...route.split("/")):out;fs.mkdirSync(dir,{recursive:true});const jsTarget=JSON.stringify(target),preserve=!!r.preserve_query;
 const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${esc(target)}"><title>Đang chuyển hướng…</title></head><body><p>Đang chuyển hướng…</p><script>(function(){var t=${jsTarget};var q=location.search;if(${preserve?"true":"false"}&&q){t+=t.includes('?')?'&'+q.slice(1):q}location.replace(t)})()</script></body></html>`;
 fs.writeFileSync(path.join(dir,"index.html"),html,"utf8");n++;
}
console.log(`[Redirect] Đã tạo ${n} trang chuyển hướng static. Lưu ý HTTP status của file static vẫn là 200; mã 301/302/307/308 trong Admin dùng làm cấu hình/ý nghĩa và cần Cloudflare/Render edge rule nếu muốn HTTP status thật.`);
