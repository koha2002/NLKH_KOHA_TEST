"use client";

import { useEffect, useState } from "react";
import { ToolFrame } from "./ToolFrame";
import { useLanguage } from "./LanguageProvider";
import { getMyAccess, type MyAccess } from "../lib/supabase-browser";
import styles from "../app/tools/tool-page.module.css";

type Tool = {id:string;slug:string;href:string;code:string;title:{vi:string;en:string};description:{vi:string;en:string};requiresAuth:boolean;allowedRoles:readonly string[];hasInlineHtml:boolean};

export function AdminToolRoute({tool}:{tool:Tool}){
  const{language}=useLanguage(),vi=language==="vi";
  const[access,setAccess]=useState<MyAccess|null>(tool.requiresAuth?null:{authenticated:false});
  useEffect(()=>{if(tool.requiresAuth)getMyAccess().then(setAccess)},[tool.requiresAuth]);
  if(tool.requiresAuth&&access===null)return <main><div className="container" style={{padding:"80px 0"}}>{vi?"Đang kiểm tra quyền truy cập…":"Checking access…"}</div></main>;
  if(tool.requiresAuth){const roles=tool.allowedRoles||[];const ok=!!access?.authenticated&&access.status==="active"&&(!roles.length||(!!access.role_id&&roles.includes(access.role_id)));if(!ok)return <main><section className={styles.hero}><div className="container"><p>{tool.code} / PRIVATE</p><h1>{vi?"Công cụ cần tài khoản được cấp quyền.":"This tool requires an approved account."}</h1><a href="/login">{vi?"Đăng nhập":"Sign in"}</a></div></section></main>}
  const src=tool.hasInlineHtml?`/tool-modules/_admin/${tool.slug}/index.html`:`/tool-modules/${tool.slug}/index.html`;
  return <main><section className={styles.hero}><div className="container"><p>{tool.code} / TOOL</p><h1>{tool.title[language]}</h1><span>{tool.description[language]}</span></div></section><section className={styles.fullWorkspace}><ToolFrame src={src} title={tool.title[language]} tall flush /></section></main>
}
