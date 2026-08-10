"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { invokeEdge, supabase } from "../lib/supabase-browser";
import styles from "./NewsComments.module.css";

type CommentRow={id:string;display_name:string;body:string;created_at:string};

export function NewsComments({articleId,allow}:{articleId:string;allow:boolean}){
  const{language}=useLanguage(),vi=language==="vi";
  const[rows,setRows]=useState<CommentRow[]>([]),[name,setName]=useState(""),[email,setEmail]=useState(""),[body,setBody]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function load(){const{data}=await supabase.from("approved_news_comments").select("id,display_name,body,created_at").eq("article_id",articleId).order("created_at",{ascending:true});setRows((data||[]) as CommentRow[])}
  useEffect(()=>{load();supabase.auth.getUser().then(({data})=>{const u=data.user;if(u){setEmail(u.email||"");setName(String(u.user_metadata?.display_name||""))}})},[articleId]);
  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{const r:any=await invokeEdge("news-comment",{action:"submit",article_id:articleId,display_name:name,email,body});setMessage(vi?(r.message||"Bình luận đang chờ duyệt."):"Your comment has been submitted and is awaiting moderation.");setBody("")}
    catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }
  return <section className={styles.comments}>
    <div className={styles.head}><h2>{vi?"Bình luận":"Comments"}</h2><span>{rows.length} {vi?"đã duyệt":"approved"}</span></div>
    {rows.length?<div className={styles.list}>{rows.map(x=><article key={x.id}><div><strong>{x.display_name}</strong><small>{new Date(x.created_at).toLocaleString(vi?"vi-VN":"en-US")}</small></div><p>{x.body}</p></article>)}</div>:<p className={styles.empty}>{vi?"Chưa có bình luận đã được duyệt.":"No approved comments yet."}</p>}
    {allow?<form onSubmit={submit} className={styles.form}>
      <h3>{vi?"Gửi bình luận":"Post a comment"}</h3><p>{vi?"Bình luận mới vào hàng chờ kiểm duyệt. Sau khi Admin duyệt, bình luận mới được hiển thị công khai.":"New comments enter the moderation queue and become public only after admin approval."}</p>
      <label>{vi?"Tên hiển thị":"Display name"} *<input value={name} onChange={e=>setName(e.target.value)} required minLength={2}/></label>
      <label>{vi?"Email (không hiển thị công khai)":"Email (not shown publicly)"}<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>{vi?"Nội dung":"Comment"} *<textarea value={body} onChange={e=>setBody(e.target.value)} required minLength={2} maxLength={3000} rows={5}/></label>
      {message?<p className={styles.message}>{message}</p>:null}<button disabled={busy}>{busy?(vi?"Đang gửi…":"Sending…"):(vi?"Gửi để Admin duyệt":"Send for moderation")}</button>
    </form>:<p className={styles.empty}>{vi?"Bài viết này đang tắt nhận bình luận mới.":"New comments are disabled for this article."}</p>}
  </section>
}
