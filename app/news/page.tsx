"use client";
import { useLanguage } from "../../components/LanguageProvider";
import { adminNewsArticles, adminSite } from "../../data/admin-generated";
import styles from "./news.module.css";
export default function NewsPage(){
  const{language}=useLanguage(),vi=language==="vi";
  if(!Boolean(adminSite.news_enabled))return <main><div className="container" style={{padding:"80px 0"}}>{vi?"Mục Tin tức đang tắt.":"The News section is currently disabled."}</div></main>;
  return <main><section className={styles.hero}><div className="container"><p>NEWS / ARTICLES</p><h1>{vi?"Tin tức & ghi chú.":"News & notes."}</h1></div></section><section className={`container ${styles.grid}`}>
    {adminNewsArticles.length?adminNewsArticles.map((x:any)=><a className={`${styles.card} ${x.featured?styles.featured:""}`} href={`/news/${x.slug}`} key={x.id}>{x.cover_image?<img src={x.cover_image} alt={vi?(x.cover_alt_vi||""):(x.cover_alt_en||x.cover_alt_vi||"")}/>:null}<div><span>{x.featured?(vi?"NỔI BẬT":"FEATURED"):"NEWS"}</span><h2>{vi?x.title_vi:(x.title_en||x.title_vi)}</h2><p>{vi?x.excerpt_vi:(x.excerpt_en||x.excerpt_vi)}</p><small>{x.published_at?new Date(x.published_at).toLocaleDateString(vi?"vi-VN":"en-US"):""}</small></div></a>):<p>{vi?"Chưa có bài viết.":"No articles yet."}</p>}
  </section></main>
}
