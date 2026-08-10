import type { MetadataRoute } from "next";
import { adminContentPages, adminCvVisible, adminNewsArticles, adminSeoEntries, adminSite, adminTools } from "../data/admin-generated";

export const dynamic = "force-static";
const site=String((adminSite as any).site_url||"https://nguyenlekhanhhoa.com").replace(/\/$/,"");
const seoMap=new Map((adminSeoEntries as readonly any[]).map((x:any)=>[String(x.route),x]));

function meta(route:string,defaults:{changeFrequency?:any;priority?:number}={}){
  const s:any=seoMap.get(route);
  if(s?.indexable===false)return null;
  return {url:`${site}${route==="/"?"":route}/`.replace(/([^:]\/)\/+/g,"$1"),changeFrequency:(s?.change_frequency||defaults.changeFrequency||"weekly") as any,priority:Number(s?.priority??defaults.priority??.7)};
}

export default function sitemap():MetadataRoute.Sitemap{
  const out:MetadataRoute.Sitemap=[];
  const fixed:[string,any,number][]=[["/","weekly",1],["/cv","monthly",.9],["/tools","weekly",.9],["/software","weekly",.8],["/data","weekly",.4],["/news","daily",.9]];
  for(const[r,c,p]of fixed){if(r==="/cv"&&!adminCvVisible)continue;const x=meta(r,{changeFrequency:c,priority:p});if(x)out.push(x)}
  for(const t of adminTools as readonly any[]){if(t.requiresAuth)continue;const x=meta(t.href||`/tools/${t.slug}`,{changeFrequency:"monthly",priority:.8});if(x)out.push(x)}
  for(const a of adminNewsArticles as readonly any[]){const x=meta(`/news/${a.slug}`,{changeFrequency:"monthly",priority:a.featured?.85:.7});if(x)out.push(x)}
  for(const p of adminContentPages as readonly any[]){if(p.requires_auth)continue;const x=meta(`/p/${p.slug}`,{changeFrequency:"monthly",priority:.6});if(x)out.push(x)}
  const seen=new Set<string>();return out.filter(x=>!seen.has(x.url)&&(seen.add(x.url),true));
}
