import { notFound } from "next/navigation";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";
import { AdminToolRoute } from "../../../components/AdminToolRoute";
import { adminTools } from "../../../data/admin-generated";

const fixedTool:any = adminTools.find((x:any) => x.slug === "remove-background");

export default function RemoveBackgroundPage() {
  const tool:any = fixedTool;
  if (!tool) notFound();
  return <>
    <AdminSeoJsonLd route="/tools/remove-background" />
    <AdminToolRoute tool={tool} />
  </>;
}
