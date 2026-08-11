import type { Metadata } from "next";
import { adminSeoEntries, adminSite } from "../data/admin-generated";

const FALLBACK_NAME = "Nguy\u1EC5n L\u00EA Kh\u00E1nh H\u00F2a";

export function seoEntry(route: string) {
  return (
    (adminSeoEntries as readonly any[]).find(
      (x: any) => String(x.route) === route
    ) || null
  );
}

export function absoluteSiteUrl(pathOrUrl: string) {
  const site = String(
    (adminSite as any).site_url ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://nguyenlekhanhhoa.com"
  ).replace(/\/$/, "");

  if (/^https?:\/\//i.test(pathOrUrl || "")) {
    return pathOrUrl;
  }

  const p = String(pathOrUrl || "/");

  return `${site}${
    p === "/"
      ? ""
      : p.startsWith("/")
        ? p
        : `/${p}`
  }`;
}

export function buildMetadata(
  route: string,
  fallback: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    index?: boolean;
    follow?: boolean;
  } = {}
): Metadata {
  const site: any = adminSite;
  const entry: any = seoEntry(route);

  const title =
    entry?.title_vi ||
    fallback.title ||
    site.default_title_vi ||
    site.site_name ||
    FALLBACK_NAME;

  const description =
    entry?.description_vi ||
    fallback.description ||
    site.description_vi ||
    "";

  const canonical = absoluteSiteUrl(
    entry?.canonical_path || route || "/"
  );

  const image =
    entry?.og_image ||
    fallback.image ||
    site.default_og_image ||
    "";

  const index = entry
    ? entry.indexable !== false
    : fallback.index !== false;

  const follow = entry
    ? entry.follow_links !== false
    : fallback.follow !== false;

  const ogType = (
    entry?.og_type ||
    fallback.type ||
    "website"
  ) as any;

  const favicon = String(site.favicon_url || "/favicon.png").trim();
  const faviconSize = Math.min(128, Math.max(16, Number(site.favicon_size || 32)));

  return {
    metadataBase: new URL(absoluteSiteUrl("/")),

    title,
    description,

    alternates: {
      canonical,
    },

    robots: {
      index,
      follow,
    },

    ...(favicon
      ? {
          icons: {
            icon: [{ url: favicon, sizes: `${faviconSize}x${faviconSize}` }],
            shortcut: [{ url: favicon, sizes: `${faviconSize}x${faviconSize}` }],
          },
        }
      : {}),

    openGraph: {
      type: ogType,
      title,
      description,
      url: canonical,
      ...(image
        ? {
            images: [{ url: image }],
          }
        : {}),
    },
  };
}

export function jsonLdFor(route: string) {
  const entry: any = seoEntry(route);

  if (!entry) return null;

  const custom =
    entry.structured_data &&
    typeof entry.structured_data === "object"
      ? entry.structured_data
      : {};

  return {
    "@context": "https://schema.org",
    "@type": entry.schema_type || "WebPage",
    url: absoluteSiteUrl(entry.canonical_path || route),
    name: entry.title_vi || undefined,
    description: entry.description_vi || undefined,
    ...custom,
  };
}