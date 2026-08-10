import { notFound } from "next/navigation";
import { adminTools } from "../../../data/admin-generated";
import { AdminToolRoute } from "../../../components/AdminToolRoute";
import { buildMetadata } from "../../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";
const fixedTool:any=adminTools.find((x:any)=>x.slug==="comtrade");
export const metadata=buildMetadata("/tools/comtrade",{title:fixedTool?.title?.vi,description:fixedTool?.description?.vi});
export default function Page(){const tool:any=fixedTool;if(!tool)notFound();return <><AdminSeoJsonLd route="/tools/comtrade"/><AdminToolRoute tool={tool}/></>}
