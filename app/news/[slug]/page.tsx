import { notFound } from "next/navigation";
import { adminNewsArticles } from "../../../data/admin-generated";
import { NewsArticleClient } from "../../../components/NewsArticleClient";
import { buildMetadata } from "../../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";

export const dynamicParams=false;
export function generateStaticParams(){
  const articles=adminNewsArticles as readonly any[];
  if(!articles.length)return[{slug:"__placeholder__"}];
  return articles.map((x:any)=>({slug:String(x.slug)}));
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;const a:any=(adminNewsArticles as readonly any[]).find((x:any)=>x.slug===slug);
  return buildMetadata(`/news/${slug}`,{title:a?.title_vi,description:a?.excerpt_vi,image:a?.cover_image,type:"article"});
}
export default async function NewsArticlePage({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;const article:any=(adminNewsArticles as readonly any[]).find((x:any)=>x.slug===slug);if(!article)notFound();
  return <><AdminSeoJsonLd route={`/news/${slug}`}/><NewsArticleClient article={article}/></>;
}
