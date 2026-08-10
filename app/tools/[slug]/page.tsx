import { notFound } from "next/navigation";
import { adminTools } from "../../../data/admin-generated";
import { AdminToolRoute } from "../../../components/AdminToolRoute";
import { buildMetadata } from "../../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";

export const dynamicParams=false;
const fixed=new Set(["quiz","pdf","comtrade"]);
export function generateStaticParams() {
  const tools = (adminTools as readonly any[]).filter(
    (x: any) => !fixed.has(String(x.slug))
  );

  if (tools.length === 0) {
    return [{ slug: "tool-empty-placeholder" }];
  }

  return tools.map((x: any) => ({
    slug: String(x.slug),
  }));
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const t:any=adminTools.find((x:any)=>x.slug===slug);return buildMetadata(`/tools/${slug}`,{title:t?.title?.vi,description:t?.description?.vi})}

export default async function DynamicToolPage({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;const tool:any=adminTools.find((x:any)=>x.slug===slug);if(!tool)notFound();
  return (
  <>
    <AdminSeoJsonLd route={`/tools/${slug}`} />
    <AdminToolRoute tool={tool} />
  </>
);
}
