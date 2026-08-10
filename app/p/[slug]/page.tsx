import { adminContentRoutes } from "../../../data/admin-generated";
import { CmsContentPage } from "../../../components/CmsContentPage";
import { adminContentPages } from "../../../data/admin-generated";
import { buildMetadata } from "../../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../../components/AdminSeoJsonLd";
export const dynamicParams=false;
export function generateStaticParams() {
  const routes = adminContentRoutes as readonly any[];

  if (routes.length === 0) {
    return [{ slug: "cms-empty-placeholder" }];
  }

  return routes.map((x: any) => ({
    slug: String(x.slug),
  }));
}export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const p:any=(adminContentPages as readonly any[]).find((x:any)=>x.slug===slug);return buildMetadata(`/p/${slug}`,{title:p?.title_vi,description:p?.excerpt_vi,index:p?true:false})}
export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <AdminSeoJsonLd route={`/p/${slug}`} />
      <CmsContentPage slug={slug} />
    </>
  );
}
