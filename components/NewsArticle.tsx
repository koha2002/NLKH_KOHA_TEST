"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { SafeMarkdown } from "./SafeMarkdown";
import styles from "../app/news/news.module.css";

type Article = { slug:string; title_vi:string; title_en:string; subtitle_vi:string; subtitle_en:string; content_vi:string; content_en:string; cover_image?:string; cover_alt_vi?:string; cover_alt_en?:string; author_name?:string; translator_name?:string; editor_name?:string; source_name?:string; source_url?:string; published_at?:string; tags?:string[] };

export function NewsArticle({ slug }: { slug: string }) {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/public/news?slug=${encodeURIComponent(slug)}`, { cache:"no-store" }).then(async (response) => { const payload = await response.json() as { error?: string; article?: Article }; if (!response.ok) throw new Error(payload.error); setArticle(payload.article ?? null); }).catch((reason) => setError(reason.message || "Không thể tải bài viết.")); }, [slug]);
  if (error) return <main className={`container ${styles.articleState}`}><h1>{error}</h1><Link href="/news">← {vi ? "Về Tin tức" : "Back to News"}</Link></main>;
  if (!article) return <main className={`container ${styles.articleState}`}>{vi ? "Đang tải bài viết…" : "Loading article…"}</main>;
  return <main className={styles.article}>
    <header className="container"><Link href="/news" className={styles.back}>← {vi ? "Tin tức" : "News"}</Link><p className={styles.kicker}>NEWS / ARTICLE</p><h1>{vi ? article.title_vi : article.title_en || article.title_vi}</h1><p className={styles.subtitle}>{vi ? article.subtitle_vi : article.subtitle_en || article.subtitle_vi}</p><div className={styles.byline}><span>{vi ? "Tác giả" : "Author"}: <strong>{article.author_name || "Nguyễn Lê Khánh Hòa"}</strong></span>{article.translator_name ? <span>{vi ? "Dịch" : "Translator"}: {article.translator_name}</span> : null}{article.editor_name ? <span>{vi ? "Biên tập" : "Editor"}: {article.editor_name}</span> : null}{article.published_at ? <time>{new Intl.DateTimeFormat(vi ? "vi-VN" : "en-US", { dateStyle:"long" }).format(new Date(article.published_at))}</time> : null}</div></header>
    {article.cover_image ? <figure className={`container ${styles.articleCover}`}><img src={article.cover_image} alt={vi ? article.cover_alt_vi : article.cover_alt_en || article.cover_alt_vi || ""} /></figure> : null}
    <div className={`container ${styles.articleGrid}`}><article className={styles.prose}><SafeMarkdown content={vi ? article.content_vi : article.content_en || article.content_vi} /></article><aside>{article.tags?.length ? <div><span>TAGS</span>{article.tags.map((tag) => <i key={tag}>{tag}</i>)}</div> : null}{article.source_url ? <a href={article.source_url} target="_blank" rel="noreferrer">{vi ? "Nguồn" : "Source"}: {article.source_name || article.source_url} ↗</a> : null}</aside></div>
  </main>;
}
