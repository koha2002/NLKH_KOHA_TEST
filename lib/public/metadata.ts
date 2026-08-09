import type { Metadata } from "next";
import { absoluteSiteUrl, getPublicSiteSettings, getSeoEntry } from "./site-content";

type MetadataFallback = { title: string; description: string; image?: string | null };

export async function buildRouteMetadata(route: string, fallback: MetadataFallback): Promise<Metadata> {
  const [site, seo] = await Promise.all([getPublicSiteSettings(), getSeoEntry(route)]);
  const title = seo?.title_vi || fallback.title;
  const description = seo?.description_vi || fallback.description || site.description_vi;
  const canonicalPath = seo?.canonical_path || route;
  const image = seo?.og_image || fallback.image || site.default_og_image;

  return {
    metadataBase: new URL(site.site_url),
    title,
    description,
    alternates: { canonical: absoluteSiteUrl(canonicalPath) },
    robots: {
      index: seo?.indexable ?? true,
      follow: seo?.follow_links ?? true,
      googleBot: { index: seo?.indexable ?? true, follow: seo?.follow_links ?? true },
    },
    openGraph: {
      title,
      description,
      url: absoluteSiteUrl(canonicalPath),
      siteName: site.site_name,
      images: image ? [image] : undefined,
      locale: "vi_VN",
      type: seo?.og_type === "article" ? "article" : "website",
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}
