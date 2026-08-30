import type { MetadataRoute } from "next";
import {
  adminContentPages,
  adminCvVisible,
  adminNewsArticles,
  adminSeoEntries,
  adminSite,
  adminTools,
} from "../data/admin-generated";

export const dynamic = "force-static";

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;
type SeoEntry = (typeof adminSeoEntries)[number];
type ContentPage = { slug: string; requires_auth?: boolean };

const site = String(adminSite.site_url || "https://nguyenlekhanhhoa.com").replace(/\/$/, "");
const seoMap = new Map<string, SeoEntry>(
  adminSeoEntries.map((entry) => [String(entry.route), entry]),
);

function meta(
  route: string,
  defaults: { changeFrequency?: ChangeFrequency; priority?: number } = {},
): SitemapEntry | null {
  const seo = seoMap.get(route);
  if (seo?.indexable === false) return null;

  const changeFrequency = String(
    seo?.change_frequency || defaults.changeFrequency || "weekly",
  ) as ChangeFrequency;

  return {
    url: route === "/" ? `${site}/` : `${site}${route}`,
    changeFrequency,
    priority: Number(seo?.priority ?? defaults.priority ?? 0.7),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  const fixed: Array<[string, ChangeFrequency, number]> = [
    ["/", "weekly", 1],
    ["/cv", "monthly", 0.9],
    ["/tools", "weekly", 0.9],
    ["/software", "weekly", 0.8],
    ["/news", "daily", 0.9],
  ];

  for (const [route, changeFrequency, priority] of fixed) {
    if (route === "/cv" && !adminCvVisible) continue;
    const entry = meta(route, { changeFrequency, priority });
    if (entry) out.push(entry);
  }

  for (const tool of adminTools) {
    if (tool.requiresAuth) continue;
    const entry = meta(tool.href || `/tools/${tool.slug}`, {
      changeFrequency: "monthly",
      priority: 0.8,
    });
    if (entry) out.push(entry);
  }

  for (const article of adminNewsArticles) {
    const entry = meta(`/news/${article.slug}`, {
      changeFrequency: "monthly",
      priority: article.featured ? 0.85 : 0.7,
    });
    if (entry) out.push(entry);
  }

  for (const page of adminContentPages as readonly ContentPage[]) {
    if (page.requires_auth) continue;
    const entry = meta(`/p/${page.slug}`, {
      changeFrequency: "monthly",
      priority: 0.6,
    });
    if (entry) out.push(entry);
  }

  const seen = new Set<string>();
  return out.filter((entry) => !seen.has(entry.url) && Boolean(seen.add(entry.url)));
}
