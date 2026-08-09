import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SafeMarkdown } from "../../../components/SafeMarkdown";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { buildRouteMetadata } from "../../../lib/public/metadata";
import styles from "./page.module.css";

type PageRow = { slug:string;title_vi:string;excerpt_vi:string;content_vi:string;template:string;requires_auth:boolean };

async function loadPage(slug: string): Promise<PageRow | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("content_pages").select("slug,title_vi,excerpt_vi,content_vi,template,requires_auth").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug:string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  return buildRouteMetadata(`/p/${slug}`, { title:page?.title_vi || "Trang nội dung", description:page?.excerpt_vi || "Nội dung từ Nguyễn Lê Khánh Hòa." });
}

export default async function ContentPage({ params }: { params: Promise<{ slug:string }> }) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = supabase ? await supabase.auth.getUser() : { data:{ user:null } };
    if (!auth.user) redirect(`/login?next=${encodeURIComponent(`/p/${slug}`)}`);
    notFound();
  }
  return <main className={styles.page}><article className={`${styles.article} ${page.template === "wide" ? styles.wide : ""}`}><p className={styles.eyebrow}>NLKH / CONTENT</p><h1>{page.title_vi}</h1>{page.excerpt_vi ? <p className={styles.lead}>{page.excerpt_vi}</p> : null}<div className={styles.body}><SafeMarkdown content={page.content_vi}/></div></article></main>;
}
