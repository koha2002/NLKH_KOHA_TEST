import { notFound } from "next/navigation";
import { adminTools } from "../../../data/admin-generated";
import { AdminToolRoute } from "../../../components/AdminToolRoute";
import { buildMetadata } from "../../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";

function pathSlug(tool:any){
  const href=String(tool?.href||`/tools/${tool?.slug||""}`).split("?")[0].replace(/\/+$/g,"");
  return href.split("/").filter(Boolean).pop()||String(tool?.slug||"");
}
function findTool(segment:string){
  return (adminTools as readonly any[]).find((tool:any)=>tool.slug===segment||pathSlug(tool)===segment);
}
export function generateStaticParams(){
  const fixed=new Set(["quiz","pdf","comtrade"]);
  const seen=new Set<string>();
  const rows:any[]=[];
  for(const tool of adminTools as readonly any[]){
    const slug=pathSlug(tool);
    if(!slug||fixed.has(slug)||seen.has(slug))continue;
    seen.add(slug);
    rows.push({slug});
  }
  return rows;
}
export async function generateMetadata({params}:any){
  const {slug}=await params;
  const tool:any=findTool(slug);
  if(!tool)return {};
  const route=tool.href||`/tools/${slug}`;
  return buildMetadata(route,{title:tool.title?.vi,description:tool.description?.vi});
}
export default async function Page({params}:any){
  const {slug}=await params;
  const tool:any=findTool(slug);
  if(!tool)notFound();
  const route=tool.href||`/tools/${slug}`;
  return <><AdminSeoJsonLd route={route}/><AdminToolRoute tool={tool}/></>;
}
