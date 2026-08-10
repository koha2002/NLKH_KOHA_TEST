"use client";

import { useLanguage } from "./LanguageProvider";
import { NewsComments } from "./NewsComments";
import styles from "../app/news/[slug]/article.module.css";

export function NewsArticleClient({article}:{article:any}){
  const{language}=useLanguage(),vi=language==="vi";
  const title=vi?article.title_vi:(article.title_en||article.title_vi);
  const subtitle=vi?article.subtitle_vi:(article.subtitle_en||article.subtitle_vi);
  const content=vi?article.content_vi:(article.content_en||article.content_vi);
  const coverAlt=vi?(article.cover_alt_vi||""):(article.cover_alt_en||article.cover_alt_vi||"");
  return <main><article className={`container ${styles.article}`}>
    <p className={styles.eyebrow}>{article.featured?(vi?"NỔI BẬT / TIN TỨC":"FEATURED / NEWS"):"NEWS"}</p>
    <h1>{title}</h1>{subtitle?<p className={styles.lead}>{subtitle}</p>:null}
    {article.cover_image?<img className={styles.cover} src={article.cover_image} alt={coverAlt}/>:null}
    <div className={styles.meta}>{article.author_name||"Nguyễn Lê Khánh Hòa"} · {article.published_at?new Date(article.published_at).toLocaleDateString(vi?"vi-VN":"en-US"):""}</div>
    <div className={styles.body}>{String(content||"").split(/\n{2,}/).map((p:string,i:number)=><p key={i}>{p}</p>)}</div>
    {article.source_url?<a className={styles.source} href={article.source_url} target="_blank" rel="noreferrer">{vi?"Nguồn":"Source"} ↗</a>:null}
    <NewsComments articleId={article.id} allow={!!article.allow_comments}/>
  </article></main>
}
