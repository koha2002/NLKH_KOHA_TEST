import { createSupabaseServiceClient } from "../supabase/server";

export const fallbackSite = {
  site_name: "Nguyễn Lê Khánh Hòa",
  site_url: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://nguyenlekhanhhoa.com",
  default_title_vi: "Nguyễn Lê Khánh Hòa | Kỹ sư điện",
  default_title_en: "Nguyen Le Khanh Hoa | Electrical Engineer",
  title_template: "%s | Nguyễn Lê Khánh Hòa",
  description_vi: "Website cá nhân của Nguyễn Lê Khánh Hòa - kỹ sư điện, sản phẩm số và công cụ làm việc.",
  description_en: "The personal website of Nguyen Le Khanh Hoa - electrical engineer and digital product builder.",
  default_og_image: null as string | null,
  contact_email: "khanhhoa2002.hh@gmail.com",
  footer_intro_vi: "Kỹ sư điện, người xây dựng các công cụ số phục vụ công việc và học tập.",
  footer_intro_en: "Electrical engineer building practical digital tools for work and learning.",
  copyright_text: "© 2025 Nguyễn Lê Khánh Hòa",
  news_enabled: true,
  registration_enabled: true,
  maintenance_mode: false,
  extra: {} as Record<string, unknown>,
};

export async function getPublicSiteSettings() {
  const service = createSupabaseServiceClient();
  if (!service) return fallbackSite;
  const { data } = await service.from("site_settings").select("*").limit(1).maybeSingle();
  return data ? { ...fallbackSite, ...data } : fallbackSite;
}

export async function getSeoEntry(route: string) {
  const service = createSupabaseServiceClient();
  if (!service) return null;
  const { data } = await service.from("seo_entries").select("*").eq("route", route).maybeSingle();
  return data;
}

export function absoluteSiteUrl(path = "") {
  const base = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://nguyenlekhanhhoa.com").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
