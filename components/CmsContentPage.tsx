"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { supabase } from "../lib/supabase-browser";

export function CmsContentPage({slug}:{slug:string}){
  const{language}=useLanguage(),vi=language==="vi";const[page,setPage]=useState<any>(undefined),[denied,setDenied]=useState<"login"|"role"|"error"|"">(""),[detail,setDetail]=useState("");
  useEffect(()=>{(async()=>{
    const{data,error}=await supabase.from("content_pages").select("*").eq("slug",slug).eq("status","published").maybeSingle();
    if(error){setDetail(error.message);setDenied("error");setPage(null);return}
    if(!data){const{data:{session}}=await supabase.auth.getSession();setDenied(session?"role":"login");setPage(null);return}
    setPage(data);
  })()},[slug]);
  if(page===undefined)return <main><div className="container" style={{padding:"80px 0"}}>{vi?"Đang tải nội dung…":"Loading content…"}</div></main>;
  if(!page){const msg=denied==="role"?(vi?"Bạn không có vai trò/quyền xem trang này.":"Your account does not have permission to view this page."):denied==="login"?(vi?"Trang này cần đăng nhập hoặc bạn chưa có quyền truy cập.":"This page requires sign-in or additional access."):detail;return <main><div className="container" style={{padding:"80px 0"}}><p>{msg}</p>{denied!=="error"?<a href="/login">{vi?"Đăng nhập":"Sign in"} →</a>:null}</div></main>}
  const title=vi?page.title_vi:(page.title_en||page.title_vi),excerpt=vi?page.excerpt_vi:(page.excerpt_en||page.excerpt_vi),content=vi?page.content_vi:(page.content_en||page.content_vi);
  return <main><article className="container" style={{maxWidth:900,paddingTop:70,paddingBottom:100}}>
    <p style={{color:"var(--cyan-400)",font:"800 10px var(--font-mono), monospace",letterSpacing:".15em"}}>CONTENT / PAGE</p>
    <h1 style={{fontSize:"clamp(42px,6vw,72px)",letterSpacing:"-.05em"}}>{title}</h1>
    {excerpt?<div style={{fontSize:20,color:"var(--muted)",lineHeight:1.6,borderBottom:"1px solid var(--line)",paddingBottom:20}}>{excerpt}</div>:null}
    <div style={{fontSize:17,lineHeight:1.85,whiteSpace:"pre-wrap",paddingTop:20}}>{content}</div>
  </article></main>
}
