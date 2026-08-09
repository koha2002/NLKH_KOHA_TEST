import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { fallbackSite, getPublicSiteSettings } from "../../../../lib/public/site-content";

export const dynamic = "force-dynamic";

const fallbackMenu = [
  ["Trang chủ", "Home", "/"],
  ["Hồ sơ", "Profile", "/cv"],
  ["Công cụ", "Tools", "/tools"],
  ["Phần mềm", "Software", "/software"],
  ["Dữ liệu", "Data", "/data"],
  ["Tin tức", "News", "/news"],
].map(([label_vi, label_en, href], index) => ({
  id: href,
  label_vi,
  label_en,
  href,
  location: "both",
  parent_id: null,
  sort_order: index * 10,
  requires_auth: false,
  allowed_roles: [] as string[],
  open_new_tab: false,
}));

const fallbackSocials = [
  ["email", "Email", "mailto:khanhhoa2002.hh@gmail.com"],
  ["facebook", "Facebook", "https://www.facebook.com/koha2002/"],
  ["youtube", "YouTube", "https://www.youtube.com/channel/UCH-j549S-5EHFTchh0deQmQ"],
  ["instagram", "Instagram", "https://www.instagram.com/koha__2002/"],
  ["linkedin", "LinkedIn", "https://www.linkedin.com/in/koha2002/"],
  ["tiktok", "TikTok", "https://www.tiktok.com/@koha_2002"],
].map(([platform, label, url], index) => ({ id: platform, platform, label, url, sort_order: index * 10 }));

export async function GET() {
  const site = await getPublicSiteSettings();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ site: { ...fallbackSite, ...site }, menu: fallbackMenu, socials: fallbackSocials, blocks: [] });

  const [{ data: auth }, menuResult, socialResult, blockResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("navigation_items").select("id,label_vi,label_en,href,location,parent_id,sort_order,requires_auth,allowed_roles,open_new_tab").eq("visible", true).order("sort_order"),
    supabase.from("social_links").select("id,platform,label,url,icon,sort_order").eq("visible", true).order("sort_order"),
    supabase.from("content_blocks").select("id,page_key,block_key,label,content,sort_order").eq("visible", true).order("sort_order"),
  ]);

  let role = "guest";
  if (auth.user) {
    const { data: profile } = await supabase.from("profiles").select("role_id,status").eq("id", auth.user.id).maybeSingle();
    if (profile?.status === "active") role = profile.role_id;
  }
  const menu = (menuResult.data ?? fallbackMenu).filter((item) => {
    if (!item.requires_auth) return true;
    if (role === "guest") return false;
    return !item.allowed_roles?.length || item.allowed_roles.includes(role);
  });
  return NextResponse.json({ site, menu, socials: socialResult.data ?? fallbackSocials, blocks: blockResult.data ?? [], account: { authenticated: Boolean(auth.user), role } });
}
