import { notFound } from "next/navigation";
import { adminTools } from "../../../data/admin-generated";
import { AdminToolRoute } from "../../../components/AdminToolRoute";
import { buildMetadata } from "../../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";

/**
 * This project uses next.config output: "export".
 * Every dynamic route MUST enumerate its static params at build time.
 */
export const dynamicParams = false;

function routeSlug(tool: any): string {
  const href = String(tool?.href || `/tools/${tool?.slug || ""}`)
    .split("?")[0]
    .replace(/\/+$/g, "");

  return href.split("/").filter(Boolean).pop() || String(tool?.slug || "");
}

function findTool(segment: string) {
  return (adminTools as readonly any[]).find(
    (tool: any) => tool?.slug === segment || routeSlug(tool) === segment
  );
}

/**
 * IMPORTANT: keep this as a direct named export in this file.
 * Next static export detects it at build time.
 */
export function generateStaticParams(): Array<{ slug: string }> {
  const reserved = new Set(["quiz", "pdf", "comtrade"]);
  const seen = new Set<string>();
  const params: Array<{ slug: string }> = [];

  for (const tool of adminTools as readonly any[]) {
    const slug = routeSlug(tool);

    if (!slug || reserved.has(slug) || seen.has(slug)) continue;

    seen.add(slug);
    params.push({ slug });
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool: any = findTool(slug);

  if (!tool) return {};

  const route = tool.href || `/tools/${slug}`;

  return buildMetadata(route, {
    title: tool.title?.vi,
    description: tool.description?.vi,
  });
}

export default async function DynamicAdminToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool: any = findTool(slug);

  if (!tool) notFound();

  const route = tool.href || `/tools/${slug}`;

  return (
    <>
      <AdminSeoJsonLd route={route} />
      <AdminToolRoute tool={tool} />
    </>
  );
}
