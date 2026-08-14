"use client";

import { useEffect,useMemo,useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { adminToolCategories,adminTools } from "../../data/admin-generated";
import styles from "./tools.module.css";

const PAGE_SIZE=6;

export default function ToolsPage(){
 const{language}=useLanguage(),vi=language==="vi";
 const[query,setQuery]=useState("");
 const[category,setCategory]=useState("all");
 const[page,setPage]=useState(1);
 const groups=adminToolCategories as readonly any[];
 const tools=adminTools as readonly any[];

 const groupById=useMemo(()=>new Map(groups.map((g:any)=>[String(g.id),g])),[groups]);
 const rows=useMemo(()=>{
   const q=query.trim().toLocaleLowerCase(vi?"vi-VN":"en-US");
   return tools.filter((tool:any)=>{
     const group=tool.categoryId?groupById.get(String(tool.categoryId)):null;
     const slug=String(group?.slug||"other");
     if(category!=="all"&&slug!==category)return false;
     if(!q)return true;
     const title=vi?(tool.title?.vi||""):(tool.title?.en||tool.title?.vi||"");
     const desc=vi?(tool.description?.vi||""):(tool.description?.en||tool.description?.vi||"");
     return `${title} ${desc} ${tool.code||""}`.toLocaleLowerCase(vi?"vi-VN":"en-US").includes(q);
   });
 },[tools,groupById,category,query,vi]);

 useEffect(()=>setPage(1),[query,category]);
 const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
 useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);
 const pageRows=rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

 return <main>
   <section className={styles.hero}><div className="container">
     <p>TOOLS / {String(tools.length).padStart(2,"0")}</p>
     <h1>{vi?"Bộ công cụ tôi dùng hằng ngày.":"Tools I use every day."}</h1>
     <label className={styles.search}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={vi?"Tìm theo tên hoặc công dụng…":"Search by name or purpose…"}/></label>
   </div></section>

   <section className={`container ${styles.catalog}`}>
     <div className={styles.filters}>
       <button className={category==="all"?styles.active:""} onClick={()=>setCategory("all")}>{vi?"Tất cả":"All"}</button>
       {groups.filter((g:any)=>g.visible!==false).map((g:any)=><button key={g.id} className={category===g.slug?styles.active:""} onClick={()=>setCategory(String(g.slug))}>{vi?(g.name_vi||g.slug):(g.name_en||g.name_vi||g.slug)}</button>)}
     </div>
     <div className={styles.grid}>
       {pageRows.map((tool:any,index:number)=>{
         const global=(page-1)*PAGE_SIZE+index+1;
         const href=tool.href||`/tools/${tool.slug}`;
         return <a href={href} className={styles.card} key={tool.id||tool.slug}>
           <div className={styles.cardTop}><span>{String(global).padStart(2,"0")}</span><strong>{tool.code||"TOOL"}</strong></div>
           <div><h2>{vi?(tool.title?.vi||tool.slug):(tool.title?.en||tool.title?.vi||tool.slug)}</h2><p>{vi?(tool.description?.vi||""):(tool.description?.en||tool.description?.vi||"")}</p></div>
           <span className={styles.open}>{vi?(tool.requiresAuth?"Mở / kiểm tra quyền":"Mở công cụ"):(tool.requiresAuth?"Open / check access":"Open tool")}<i>↗</i></span>
         </a>;
       })}
     </div>
     {!rows.length?<p className={styles.empty}>{vi?"Không có Tool phù hợp.":"No matching tools."}</p>:null}
     {totalPages>1?<nav className={styles.pagination}><button disabled={page===1} onClick={()=>setPage(x=>Math.max(1,x-1))}>{vi?"← Trước":"← Previous"}</button><span>{vi?`Trang ${page} / ${totalPages}`:`Page ${page} / ${totalPages}`}</span><button disabled={page===totalPages} onClick={()=>setPage(x=>Math.min(totalPages,x+1))}>{vi?"Sau →":"Next →"}</button></nav>:null}
   </section>
 </main>;
}