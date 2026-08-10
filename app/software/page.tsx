"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { invokeEdge, supabase } from "../../lib/supabase-browser";
import styles from "./software.module.css";

type SoftwareItem = {
  id: string;
  name: string;
  icon: string;
  cover?: string;
  description: string;
  descriptionEn?: string;
  price: string;
  priceEn?: string;
  category: string;
  categoryLabel?: string;
  categoryLabelEn?: string;
  downloadAccess: "public" | "authenticated";
  downloadSource: "link" | "r2";
  downloadUrl?: string;
  downloadMediaId?: string;
  featured?: boolean;
};

type DbCategory = { id:string; slug:string; name_vi:string; name_en?:string | null };
type DbSoftware = {
  id:string; name:string; slug:string; category_id?:string | null;
  description_vi?:string | null; description_en?:string | null;
  icon_media_id?:string | null; cover_media_id?:string | null;
  price_label_vi?:string | null; price_label_en?:string | null;
  download_access?:"public"|"authenticated" | null;
  download_source?:"link"|"r2" | null; download_url?:string | null; download_media_id?:string | null;
  featured?:boolean | null; sort_order?:number | null;
};

async function signedMedia(mediaId?: string | null) {
  if (!mediaId) return "";
  try {
    const out:any = await invokeEdge("r2-file", { action:"presign-download", media_id:mediaId });
    return out?.url || "";
  } catch {
    return "";
  }
}

export default function SoftwarePage(){
  const {language,t}=useLanguage(),copy=t.software;
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [software,setSoftware]=useState<SoftwareItem[]>([]);
  const [loggedIn,setLoggedIn]=useState(false);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    (async()=>{
      setLoading(true);setMessage("");
      const [{data:cats,error:catError},{data:rows,error:rowError}] = await Promise.all([
        supabase.from("software_categories").select("id,slug,name_vi,name_en").eq("visible",true).order("sort_order",{ascending:true}),
        supabase.from("software_items").select("id,name,slug,category_id,description_vi,description_en,icon_media_id,cover_media_id,price_label_vi,price_label_en,download_access,download_source,download_url,download_media_id,featured,sort_order").eq("visible",true).order("featured",{ascending:false}).order("sort_order",{ascending:true})
      ]);
      if(catError)throw catError;if(rowError)throw rowError;
      const catMap=new Map((cats||[]).map((c:DbCategory)=>[c.id,c]));
      const hydrated=await Promise.all((rows||[]).map(async(x:DbSoftware)=>{
        const c=x.category_id?catMap.get(x.category_id):undefined;
        const [icon,cover]=await Promise.all([signedMedia(x.icon_media_id),signedMedia(x.cover_media_id)]);
        return {
          id:x.id,name:x.name,icon,cover,
          description:x.description_vi||"",descriptionEn:x.description_en||x.description_vi||"",
          price:x.price_label_vi||"Miễn phí",priceEn:x.price_label_en||x.price_label_vi||"Free",
          category:c?.slug||"other",categoryLabel:c?.name_vi||"Khác",categoryLabelEn:c?.name_en||c?.name_vi||"Other",
          downloadAccess:x.download_access||"public",downloadSource:x.download_source||"link",
          downloadUrl:x.download_url||"",downloadMediaId:x.download_media_id||"",featured:!!x.featured,
        } satisfies SoftwareItem;
      }));
      if(alive)setSoftware(hydrated);
    })().catch(e=>alive&&setMessage(e instanceof Error?e.message:String(e))).finally(()=>alive&&setLoading(false));

    supabase.auth.getSession().then(({data})=>alive&&setLoggedIn(!!data.session));
    const{data:l}=supabase.auth.onAuthStateChange((_e,s)=>alive&&setLoggedIn(!!s));
    return()=>{alive=false;l.subscription.unsubscribe()};
  },[]);

  const cats=useMemo(()=>{
    const seen=new Map<string,string>();
    software.forEach(x=>seen.set(x.category,language==="en"?(x.categoryLabelEn||x.categoryLabel||x.category):(x.categoryLabel||x.category)));
    return[{id:"all",label:copy.all},...[...seen].map(([id,label])=>({id,label}))];
  },[software,language,copy.all]);

  const visible=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase(language);
    return software.filter(x=>(category==="all"||x.category===category)&&(!q||`${x.name} ${language==="en"?(x.descriptionEn||x.description):x.description}`.toLocaleLowerCase(language).includes(q)));
  },[software,category,query,language]);

  async function download(item:SoftwareItem){
    if(item.downloadAccess==="authenticated"&&!loggedIn){setMessage(language==="en"?`“${item.name}” requires sign-in before downloading.`:`“${item.name}” yêu cầu đăng nhập trước khi tải.`);window.location.href="/login?next=/software";return}
    try{
      if(item.downloadSource==="link"){
        if(!item.downloadUrl)throw new Error(language==="en"?"This software does not have a download link in Admin yet.":"Phần mềm này chưa có link tải trong Admin.");
        window.open(item.downloadUrl,"_blank","noopener,noreferrer");
        return;
      }
      if(!item.downloadMediaId)throw new Error(language==="en"?"This software does not have an R2 file in Admin yet.":"Phần mềm này chưa có file R2 trong Admin.");
      const out:any=await invokeEdge("r2-file",{action:"presign-download",media_id:item.downloadMediaId});
      if(!out?.url)throw new Error(language==="en"?"Could not create an R2 download link.":"Không tạo được liên kết tải R2.");
      window.open(out.url,"_blank","noopener,noreferrer");
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
  }

  return <main>
    <section className={styles.hero}><div className="container"><p>{copy.eyebrow}</p><h1>{copy.title}</h1><div className={styles.searchWrap}><span>⌕</span><label className="sr-only" htmlFor="software-search">{copy.search}</label><input id="software-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={copy.search}/><kbd>{visible.length} {copy.found}</kbd></div></div></section>
    <section className={`container ${styles.catalog}`}>
      <div className={styles.filters}>{cats.map(x=><button key={x.id} className={category===x.id?styles.active:""} onClick={()=>setCategory(x.id)}>{x.label}</button>)}</div>
      {message?<p style={{padding:"12px",border:"1px solid var(--line)",color:"var(--muted)"}}>{message}</p>:null}
      {loading?<div className={styles.noResult}>{language==="en"?"Loading software from Admin…":"Đang tải kho phần mềm từ Admin…"}</div>:!visible.length?<div className={styles.noResult}>{copy.noResult}</div>:<div className={styles.grid}>
        {visible.map(item=><article className={styles.card} key={item.id}>
          <div className={styles.cardTop}><span className={styles.mark}>{item.icon?<img src={item.icon} alt="" width={600} height={600}/>:<b>{item.name.slice(0,2).toUpperCase()}</b>}</span><span className={styles.category}>{item.featured?(language==="en"?"Featured · ":"Nổi bật · "):""}{language==="en"?(item.categoryLabelEn||item.categoryLabel||item.category):(item.categoryLabel||item.category)}</span></div>
          <div><h2>{item.name}</h2><p>{language==="en"?(item.descriptionEn||item.description):item.description}</p></div>
          <div className={styles.cardFooter}><span>{language==="en"?(item.priceEn||item.price):item.price}</span><button onClick={()=>download(item)} style={{border:0,background:"transparent",color:"inherit",font:"inherit",cursor:"pointer",fontWeight:700}}>{item.downloadAccess==="authenticated"?(language==="en"?"Login to download":"Đăng nhập để tải"):(language==="en"?"Download":"Tải xuống")} <i>↗</i></button></div>
        </article>)}
      </div>}
    </section>
    <section className={styles.policy}><div className={`container ${styles.policyInner}`}><span>!</span><div><h2>{copy.noteTitle}</h2><p>{copy.note}</p></div></div></section>
  </main>
}
