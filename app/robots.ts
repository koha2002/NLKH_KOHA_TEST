import type { MetadataRoute } from "next";
import { adminSite } from "../data/admin-generated";
export const dynamic="force-static";
export default function robots():MetadataRoute.Robots{
 const site=String((adminSite as any).site_url||"https://nguyenlekhanhhoa.com").replace(/\/$/,"");
 return{rules:{userAgent:"*",allow:"/",disallow:["/account/","/login/"]},sitemap:`${site}/sitemap.xml`,host:site};
}
