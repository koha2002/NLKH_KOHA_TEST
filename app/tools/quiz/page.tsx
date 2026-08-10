import { notFound } from "next/navigation";
import { adminTools } from "../../../data/admin-generated";
import { AdminToolRoute } from "../../../components/AdminToolRoute";
import { buildMetadata } from "../../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";
const fixedTool:any=adminTools.find((x:any)=>x.slug==="quiz");
export const metadata=buildMetadata("/tools/quiz",{title:fixedTool?.title?.vi,description:fixedTool?.description?.vi});
export default function Page(){const tool:any=fixedTool;if(!tool)notFound();return <><AdminSeoJsonLd route="/tools/quiz"/><AdminToolRoute tool={tool}/></>}
