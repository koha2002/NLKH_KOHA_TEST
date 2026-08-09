import type { Metadata } from "next";
import { NewsArticle } from "../../../components/NewsArticle";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug:string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { title:"Tin tức" };
  const { data } = await supabase.from("news_articles").select("title_vi,excerpt_vi,cover_image").eq("slug", slug).eq("status", "published").maybeSingle();
  return data ? { title:data.title_vi, description:data.excerpt_vi, openGraph:{ title:data.title_vi, description:data.excerpt_vi, images:data.cover_image ? [data.cover_image] : [] } } : { title:"Không tìm thấy bài viết" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug:string }> }) { const { slug } = await params; return <NewsArticle slug={slug} />; }
