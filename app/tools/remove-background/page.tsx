import { notFound } from "next/navigation";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";
import { AdminToolRoute } from "../../../components/AdminToolRoute";
import { adminTools } from "../../../data/admin-generated";

const fixedTool = adminTools.find((tool) => tool.slug === "remove-background");

export default function RemoveBackgroundPage() {
  if (!fixedTool) notFound();

  return (
    <>
      <AdminSeoJsonLd route="/tools/remove-background" />
      <AdminToolRoute tool={fixedTool} />
    </>
  );
}
