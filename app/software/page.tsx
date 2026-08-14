"use client";

import { useEffect,useMemo,useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { adminSoftwareCategories,adminSoftwareItems } from "../../data/admin-generated";
import { getMyAccess,invokeEdge } from "../../lib/supabase-browser";
import styles from "./software.module.css";

const PAGE_SIZE=10;

type AccessState={
  authenticated?:boolean;
  role_id?:string;
  status?:string;
};

type SoftwareItem={
  id:string;name:string;icon:string;description:string;descriptionEn?:string;
  price:string;priceEn?:string;category:string;categoryLabel?:string;categoryLabelEn?:string;
  downloadAccess:"public"|"authenticated";downloadSource:"link"|"r2";
  allowedRoles:string[];featured?:boolean;
};

export default function SoftwarePage(){
  const{language,t}=useLanguage(),copy=t.software,vi=language==="vi";
  const[query,setQuery]=useState("");
  const[category,setCategory]=useState("all");
  const[page,setPage]=useState(1);
  const[access,setAccess]=useState<AccessState>({authenticated:false});
  const[accessReady,setAccessReady]=useState(false);
  const[message,setMessage]=useState("");
  const[busyId,setBusyId]=useState("");

  const categoryRows=adminSoftwareCategories as readonly any[];
  const rowData=adminSoftwareItems as readonly any[];

  useEffect(()=>{
    let alive=true;
    getMyAccess()
      .then((a:any)=>{if(alive)setAccess(a||{authenticated:false})})
      .catch(()=>{if(alive)setAccess({authenticated:false})})
      .finally(()=>{if(alive)setAccessReady(true)});
    return()=>{alive=false};
  },[]);

  const catMap=useMemo(
    ()=>new Map(categoryRows.map((c:any)=>[String(c.id),c])),
    [categoryRows]
  );

  const software=useMemo<SoftwareItem[]>(()=>rowData.map((x:any)=>{
    const c=x.category_id?catMap.get(String(x.category_id)):null;
    return{
      id:String(x.id),
      name:String(x.name||x.slug||"Software"),
      icon:String(x.icon_url||""),
      description:String(x.description_vi||""),
      descriptionEn:String(x.description_en||x.description_vi||""),
      price:String(x.price_label_vi||"Miễn phí"),
      priceEn:String(x.price_label_en||x.price_label_vi||"Free"),
      category:String(c?.slug||"other"),
      categoryLabel:String(c?.name_vi||"Khác"),
      categoryLabelEn:String(c?.name_en||c?.name_vi||"Other"),
      downloadAccess:x.download_access==="authenticated"?"authenticated":"public",
      downloadSource:x.download_source==="r2"?"r2":"link",
      allowedRoles:Array.isArray(x.download_allowed_roles)?x.download_allowed_roles.map(String):[],
      featured:!!x.featured
    };
  }),[rowData,catMap]);

  const cats=useMemo(()=>[
    {id:"all",label:copy.all},
    ...categoryRows
      .filter((x:any)=>x?.visible!==false)
      .map((x:any)=>({id:String(x.slug),label:vi?(x.name_vi||x.slug):(x.name_en||x.name_vi||x.slug)}))
  ],[categoryRows,copy.all,vi]);

  const visible=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase(language);
    return software.filter(x=>
      (category==="all"||x.category===category)&&
      (!q||`${x.name} ${language==="en"?(x.descriptionEn||x.description):x.description}`
        .toLocaleLowerCase(language).includes(q))
    );
  },[software,category,query,language]);

  useEffect(()=>setPage(1),[query,category]);
  const totalPages=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
  useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);
  const pageRows=visible.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  function canDownload(item:SoftwareItem){
    if(item.downloadAccess==="public")return true;
    if(!accessReady||!access.authenticated)return false;
    if(access.status&&access.status!=="active")return false;
    if(item.allowedRoles.length&&(!access.role_id||!item.allowedRoles.includes(access.role_id)))return false;
    return true;
  }

  function buttonLabel(item:SoftwareItem){
    if(busyId===item.id)return vi?"Đang tạo link…":"Preparing…";
    if(item.downloadAccess==="public")return vi?"Tải xuống":"Download";
    if(!accessReady)return vi?"Đang kiểm tra quyền…":"Checking access…";
    if(!access.authenticated)return vi?"Đăng nhập để tải":"Login to download";
    return canDownload(item)?(vi?"Tải xuống":"Download"):(vi?"Liên hệ ADMIN":"Contact ADMIN");
  }

  async function download(item:SoftwareItem){
    setMessage("");
    if(item.downloadAccess==="authenticated"&&!access.authenticated){
      window.location.href="/login?next=/software";
      return;
    }
    if(!canDownload(item)){
      setMessage(vi
        ?`Tài khoản của bạn chưa được cấp quyền tải “${item.name}”. Vui lòng liên hệ ADMIN.`
        :`Your account is not allowed to download “${item.name}”. Please contact ADMIN.`);
      return;
    }
    try{
      setBusyId(item.id);
      const out:any=await invokeEdge("r2-file",{action:"software-download",software_id:item.id});
      if(!out?.url)throw new Error(vi?"Không tạo được liên kết tải.":"Could not create the download link.");
      window.open(out.url,"_blank","noopener,noreferrer");
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
    finally{setBusyId("")}
  }

  return <main>
    <section className={styles.hero}><div className="container">
      <p>{copy.eyebrow}</p><h1>{copy.title}</h1>
      <div className={styles.searchWrap}><span>⌕</span>
        <label className="sr-only" htmlFor="software-search">{copy.search}</label>
        <input id="software-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={copy.search}/>
        <kbd>{visible.length} {copy.found}</kbd>
      </div>
    </div></section>

    <section className={`container ${styles.catalog}`}>
      <div className={styles.filters}>
        {cats.map(x=><button key={x.id} className={category===x.id?styles.active:""} onClick={()=>setCategory(x.id)}>{x.label}</button>)}
      </div>

      {message?<p className={styles.notice}>{message}</p>:null}

      {!visible.length?<div className={styles.noResult}>{copy.noResult}</div>:<>
        <div className={styles.grid}>
          {pageRows.map(item=><article className={styles.card} key={item.id}>
            <div className={styles.cardTop}>
              <span className={styles.mark}>{item.icon?<img src={item.icon} alt="" width={56} height={56} loading="lazy"/>:<b>{item.name.slice(0,2).toUpperCase()}</b>}</span>
              <span className={styles.category}>{item.featured?(vi?"Nổi bật · ":"Featured · "):""}{vi?(item.categoryLabel||item.category):(item.categoryLabelEn||item.categoryLabel||item.category)}</span>
            </div>
            <div><h2>{item.name}</h2><p>{language==="en"?(item.descriptionEn||item.description):item.description}</p></div>
            <div className={styles.cardFooter}>
              <span>{language==="en"?(item.priceEn||item.price):item.price}</span>
              <button disabled={busyId===item.id} onClick={()=>download(item)}>{buttonLabel(item)} <i>↗</i></button>
            </div>
          </article>)}
        </div>
        {totalPages>1?<nav className={styles.pagination} aria-label={vi?"Phân trang phần mềm":"Software pagination"}>
          <button disabled={page===1} onClick={()=>setPage(x=>Math.max(1,x-1))}>{vi?"← Trước":"← Previous"}</button>
          <span>{vi?`Trang ${page} / ${totalPages}`:`Page ${page} / ${totalPages}`}</span>
          <button disabled={page===totalPages} onClick={()=>setPage(x=>Math.min(totalPages,x+1))}>{vi?"Sau →":"Next →"}</button>
        </nav>:null}
      </>}
    </section>

    <section className={styles.policy}><div className={`container ${styles.policyInner}`}>
      <span>!</span><div><h2>{copy.noteTitle}</h2><p>{copy.note}</p></div>
    </div></section>
  </main>;
}