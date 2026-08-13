"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { getMyAccess, invokeEdge, supabase } from "../lib/supabase-browser";
import styles from "./QuizDataPicker.module.css";

type Media={
  id:string;object_key:string;original_name?:string|null;mime_type?:string|null;
  public_url?:string|null;visibility?:string|null
};
type DataItem={
  id:string;title_vi:string;title_en?:string;description_vi?:string;description_en?:string;
  storage_mode:"link"|"r2";external_url?:string|null;item_type?:string|null;
  media_id?:string|null;media_assets?:Media|null
};

function looksQuiz(x:DataItem){
  const n=(x.media_assets?.original_name||x.external_url||"").toLowerCase();
  return x.item_type==="quiz_json"||n.endsWith(".json")||(x.media_assets?.mime_type||"").includes("json");
}

export function QuizDataPicker(){
  const{language}=useLanguage(),vi=language==="vi";
  const[open,setOpen]=useState(false);
  const[items,setItems]=useState<DataItem[]>([]);
  const[authenticated,setAuthenticated]=useState(false);
  const[selectedId,setSelectedId]=useState("");
  const[status,setStatus]=useState("");
  const[loading,setLoading]=useState(false);
  const[importing,setImporting]=useState(false);

  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin)return;
      if(event.data?.type==="nlkh-quiz-data-picker-open")setOpen(true);
    };
    window.addEventListener("message",receive);
    return()=>window.removeEventListener("message",receive);
  },[]);

  useEffect(()=>{
    if(!open)return;
    let alive=true;
    setLoading(true);setStatus("");
    (async()=>{
      const a=await getMyAccess();
      if(!alive)return;
      setAuthenticated(a.authenticated);
      if(!a.authenticated){setItems([]);setLoading(false);return}
      const{data,error}=await supabase.from("data_items")
        .select("id,title_vi,title_en,description_vi,description_en,storage_mode,external_url,item_type,media_id,media_assets(id,object_key,original_name,mime_type,public_url,visibility)")
        .eq("visible",true).order("sort_order");
      if(!alive)return;
      if(error)setStatus(error.message);
      else setItems(((data||[]) as unknown as DataItem[]).filter(looksQuiz));
      setLoading(false);
    })().catch(e=>{
      if(alive){setStatus(e instanceof Error?e.message:String(e));setLoading(false)}
    });
    return()=>{alive=false};
  },[open]);

  const selected=useMemo(()=>items.find(x=>x.id===selectedId),[items,selectedId]);

  async function importSelected(){
    if(!selected)return;
    setImporting(true);
    setStatus(vi?"Đang lấy JSON từ dữ liệu…":"Loading JSON from data…");
    try{
      let url=selected.external_url||"";
      if(selected.storage_mode==="r2"){
        const m=selected.media_assets;
        if(!m)throw new Error(vi?"Mục này chưa có file R2.":"This item has no R2 file.");
        const out:any=await invokeEdge("r2-file",{
          action:"presign-download",item_id:selected.id,media_id:m.id,object_key:m.object_key
        });
        url=out.url;
      }
      if(!url)throw new Error(vi?"Không tìm thấy nguồn JSON.":"JSON source not found.");
      const r=await fetch(url,{cache:"no-store"});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json() as any;

      window.dispatchEvent(new CustomEvent("nlkh-tool-import",{
        detail:{
          target:"quiz",data,
          sourceName:vi?selected.title_vi:(selected.title_en||selected.title_vi)
        }
      }));

      setStatus(vi?"Đã nhập Quiz từ dữ liệu.":"Quiz imported from data.");
      setTimeout(()=>setOpen(false),450);
    }catch(e){
      setStatus(e instanceof Error?e.message:String(e));
    }finally{
      setImporting(false);
    }
  }

  if(!open)return null;

  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={vi?"Nhập Quiz từ dữ liệu":"Import Quiz from data"}>
    <section className={styles.modal}>
      <div className={styles.head}>
        <div>
          <span>QUIZ / DATA</span>
          <h2>{vi?"Nhập Quiz từ dữ liệu":"Import Quiz from data"}</h2>
          <p>{vi?"Chọn một file JSON trong các thư mục dữ liệu bạn được quyền xem.":"Choose a JSON file from data folders you can access."}</p>
        </div>
        <button type="button" className={styles.close} onClick={()=>setOpen(false)} aria-label={vi?"Đóng":"Close"}>×</button>
      </div>

      {loading?<p className={styles.notice}>{vi?"Đang tải dữ liệu…":"Loading data…"}</p>:
        authenticated?(
          items.length?<div className={styles.controls}>
            <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
              <option value="">{vi?"Chọn file JSON…":"Choose a JSON file…"}</option>
              {items.map(x=><option key={x.id} value={x.id}>{vi?x.title_vi:(x.title_en||x.title_vi)}</option>)}
            </select>
            <button type="button" disabled={!selected||importing} onClick={importSelected}>
              {importing?(vi?"Đang nhập…":"Importing…"):(vi?"Nhập vào Quiz":"Import into Quiz")}
            </button>
          </div>:<p className={styles.notice}>{vi?"Chưa có file JSON nào trong dữ liệu bạn được xem.":"No JSON files are available in your accessible data."}</p>
        ):<a className={styles.login} href="/login?next=/tools/quiz">{vi?"Đăng nhập để xem dữ liệu":"Sign in to view data"} →</a>
      }

      {status?<p className={styles.status}>{status}</p>:null}
    </section>
  </div>
}
