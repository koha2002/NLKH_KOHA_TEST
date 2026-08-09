import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ articles: [], article: null });
  const slug = new URL(request.url).searchParams.get("slug");
  const fields = "id,slug,category_id,title_vi,title_en,subtitle_vi,subtitle_en,excerpt_vi,excerpt_en,content_vi,content_en,cover_image,cover_alt_vi,cover_alt_en,author_name,translator_name,editor_name,source_name,source_url,tags,status,featured,published_at,updated_at";
  if (slug) {
    const { data, error } = await supabase.from("news_articles").select(fields).eq("slug", slug).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
    if (error) return NextResponse.json({ error: "Không thể tải bài viết." }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Bài viết không tồn tại." }, { status: 404 });
    return NextResponse.json({ article: data });
  }
  const { data, error } = await supabase.from("news_articles").select(fields).eq("status", "published").lte("published_at", new Date().toISOString()).order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Không thể tải tin tức." }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}
