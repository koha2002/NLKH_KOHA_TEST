import type { MetadataRoute } from "next";
import { createSupabaseServiceClient } from "../lib/supabase/server";
import { absoluteSiteUrl } from "../lib/public/site-content";

export const dynamic = "force-dynamic";

const fallbackRoutes = [
  ["/", "weekly", 1], ["/cv", "monthly", .9], ["/tools", "weekly", .9],
  ["/tools/quiz", "monthly", .8], ["/tools/pdf", "monthly", .8], ["/tools/comtrade", "monthly", .8],
  ["/software", "weekly", .8], ["/data", "weekly", .7], ["/news", "daily", .8],
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const service = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const fallback = fallbackRoutes.map(([route,changeFrequency,priority]) => ({ url:absoluteSiteUrl(route), changeFrequency, priority })) as MetadataRoute.Sitemap;
  if (!service) return fallback;
  const [seo, tools, news, pages] = await Promise.all([
    service.from("seo_entries").select("route,change_frequency,priority,updated_at").eq("indexable", true),
    service.from("tools").select("route,updated_at").eq("visible", true).eq("requires_auth", false),
    service.from("news_articles").select("slug,updated_at").eq("status", "published").or(`published_at.is.null,published_at.lte.${now}`),
    service.from("content_pages").select("slug,updated_at").eq("status", "published").eq("requires_auth", false).or(`published_at.is.null,published_at.lte.${now}`),
  ]);
  const rows = new Map<string, MetadataRoute.Sitemap[number]>();
  fallback.forEach((entry) => rows.set(new URL(entry.url).pathname, entry));
  for (const entry of seo.data ?? []) rows.set(entry.route, { url: absoluteSiteUrl(entry.route), lastModified: entry.updated_at, changeFrequency: entry.change_frequency, priority: Number(entry.priority) });
  for (const tool of tools.data ?? []) if (!rows.has(tool.route)) rows.set(tool.route, { url: absoluteSiteUrl(tool.route), lastModified: tool.updated_at, changeFrequency: "monthly", priority: .7 });
  for (const article of news.data ?? []) rows.set(`/news/${article.slug}`, { url: absoluteSiteUrl(`/news/${article.slug}`), lastModified: article.updated_at, changeFrequency: "monthly", priority: .7 });
  for (const page of pages.data ?? []) rows.set(`/p/${page.slug}`, { url:absoluteSiteUrl(`/p/${page.slug}`), lastModified:page.updated_at, changeFrequency:"monthly", priority:.6 });
  return [...rows.values()];
}
