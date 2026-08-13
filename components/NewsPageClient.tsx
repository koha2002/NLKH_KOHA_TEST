"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import styles from "../app/news/news.module.css";

function timeOf(article:any){
  const value=article.published_at||article.created_at||article.updated_at||"";
  const time=value?new Date(value).getTime():0;
  return Number.isFinite(time)?time:0;
}

export function NewsPageClient({
  articles,
  categories,
}:{articles:any[];categories:any[]}) {
  const {language}=useLanguage();
  const vi=language==="vi";
  const [category,setCategory]=useState("all");
  const [query,setQuery]=useState("");

  const visibleCategories=useMemo(
    ()=>[...(categories||[])]
      .filter((x:any)=>x?.visible!==false)
      .sort((a:any,b:any)=>Number(a.sort_order||0)-Number(b.sort_order||0)),
    [categories]
  );

  const categoryById=useMemo(
    ()=>new Map(visibleCategories.map((x:any)=>[String(x.id),x])),
    [visibleCategories]
  );

  const rows=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase(vi?"vi-VN":"en-US");
    return [...(articles||[])]
      .sort((a:any,b:any)=>timeOf(b)-timeOf(a))
      .filter((article:any)=>{
        if(category!=="all"&&String(article.category_id||"")!==category)return false;
        if(!q)return true;
        const haystack=[
          article.title_vi,article.title_en,
          article.excerpt_vi,article.excerpt_en,
          ...(Array.isArray(article.tags)?article.tags:[])
        ].filter(Boolean).join(" ").toLocaleLowerCase(vi?"vi-VN":"en-US");
        return haystack.includes(q);
      });
  },[articles,category,query,vi]);

  return <>
    <section className={styles.v53Hero}>
      <div className={styles.v53Shell}>
        <p>NEWS / ARTICLES</p>
        <h1>{vi?"Tin tức & ghi chú.":"News & notes."}</h1>
        <span>{vi
          ?"Bài mới nhất được xếp trước. Lọc theo danh mục hoặc tìm nhanh theo từ khóa."
          :"Newest articles appear first. Filter by category or search by keyword."}</span>
      </div>
    </section>

    <section className={styles.v53Tools}>
      <div className={styles.v53Shell}>
        <div className={styles.v53Categories} role="group" aria-label={vi?"Danh mục tin":"News categories"}>
          <button
            type="button"
            className={category==="all"?styles.v53Active:""}
            onClick={()=>setCategory("all")}
          >
            {vi?"Tất cả":"All"}
          </button>
          {visibleCategories.map((cat:any)=>(
            <button
              type="button"
              key={cat.id}
              className={category===String(cat.id)?styles.v53Active:""}
              onClick={()=>setCategory(String(cat.id))}
            >
              {vi?(cat.name_vi||cat.slug):(cat.name_en||cat.name_vi||cat.slug)}
            </button>
          ))}
        </div>

        <label className={styles.v53Search}>
          <span className="sr-only">{vi?"Tìm bài viết":"Search articles"}</span>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder={vi?"Tìm tiêu đề, nội dung, tag…":"Search title, summary, tags…"}
          />
        </label>
      </div>
    </section>

    <section className={styles.v53List}>
      <div className={styles.v53Shell}>
        <div className={styles.v53Count}>
          {vi?`${rows.length} bài viết`:`${rows.length} article${rows.length===1?"":"s"}`}
        </div>

        {rows.length
          ? <div className={styles.v53Grid}>
              {rows.map((article:any)=>{
                const cat=categoryById.get(String(article.category_id||""));
                const date=article.published_at||article.created_at||"";
                return <article className={styles.v53Card} key={article.id||article.slug}>
                  <a href={`/news/${article.slug}`} className={styles.v53Cover}>
                    {article.cover_image
                      ? <img
                          src={article.cover_image}
                          alt={vi?(article.cover_alt_vi||article.title_vi||""):(article.cover_alt_en||article.cover_alt_vi||article.title_en||article.title_vi||"")}
                          loading="lazy"
                        />
                      : <span>NLKH / NEWS</span>}
                  </a>

                  <div className={styles.v53CardBody}>
                    <div className={styles.v53Meta}>
                      <span>{cat?(vi?(cat.name_vi||cat.slug):(cat.name_en||cat.name_vi||cat.slug)):"NEWS"}</span>
                      {date?<time>{new Intl.DateTimeFormat(vi?"vi-VN":"en-US",{dateStyle:"medium"}).format(new Date(date))}</time>:null}
                    </div>

                    <h2>
                      <a href={`/news/${article.slug}`}>
                        {vi?article.title_vi:(article.title_en||article.title_vi)}
                      </a>
                    </h2>

                    <p>{vi?article.excerpt_vi:(article.excerpt_en||article.excerpt_vi)}</p>
                    <a className={styles.v53Read} href={`/news/${article.slug}`}>
                      {vi?"Đọc bài":"Read article"} <span>↗</span>
                    </a>
                  </div>
                </article>
              })}
            </div>
          : <p className={styles.v53Empty}>{vi?"Không có bài phù hợp.":"No matching articles."}</p>}
      </div>
    </section>
  </>;
}