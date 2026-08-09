"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import styles from "../app/news/news.module.css";

type Article = { id:string; slug:string; title_vi:string; title_en:string; excerpt_vi:string; excerpt_en:string; cover_image?:string; author_name?:string; published_at?:string; tags?:string[]; featured:boolean };

export function NewsIndex() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/public/news", { cache:"no-store" }).then((response) => response.json()).then((payload) => setArticles(payload.articles ?? [])).finally(() => setLoading(false)); }, []);
  return <>
    <section className={styles.hero}><div className="container"><p>NEWS / JOURNAL</p><h1>{vi ? "Tin tức, ghi chép và kiến thức." : "News, notes and knowledge."}</h1><span>{vi ? "Bài viết được biên tập, ghi nguồn và quản lý tập trung từ trang Admin." : "Edited, sourced and managed centrally from the Admin panel."}</span></div></section>
    <section className={`container ${styles.list}`}>
      {loading ? <p className={styles.empty}>{vi ? "Đang tải bài viết…" : "Loading articles…"}</p> : null}
      {!loading && !articles.length ? <p className={styles.empty}>{vi ? "Chưa có bài viết được xuất bản." : "No published articles yet."}</p> : null}
      {articles.map((article, index) => <article className={`${styles.card} ${article.featured && index === 0 ? styles.featured : ""}`} key={article.id}>
        {article.cover_image ? <a href={`/news/${article.slug}`} className={styles.cover}><img src={article.cover_image} alt="" /></a> : <a href={`/news/${article.slug}`} className={styles.coverPlaceholder}>NLKH / {String(index + 1).padStart(2,"0")}</a>}
        <div><div className={styles.meta}><span>{article.published_at ? new Intl.DateTimeFormat(vi ? "vi-VN" : "en-US", { dateStyle:"medium" }).format(new Date(article.published_at)) : ""}</span><span>{article.author_name || "Nguyễn Lê Khánh Hòa"}</span></div><h2><a href={`/news/${article.slug}`}>{vi ? article.title_vi : article.title_en || article.title_vi}</a></h2><p>{vi ? article.excerpt_vi : article.excerpt_en || article.excerpt_vi}</p><a className={styles.read} href={`/news/${article.slug}`}>{vi ? "Đọc bài" : "Read article"} <span>↗</span></a></div>
      </article>)}
    </section>
  </>;
}
