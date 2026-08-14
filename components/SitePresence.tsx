"use client";
import { useEffect } from "react";
import { supabase } from "../lib/supabase-browser";

const KEY="nlkh-visitor-id-v1";
function visitorId(){
 try{
  let id=localStorage.getItem(KEY)||"";
  if(!/^[0-9a-f-]{36}$/i.test(id)){id=crypto.randomUUID();localStorage.setItem(KEY,id)}
  return id;
 }catch{return crypto.randomUUID()}
}
export function SitePresence(){
 useEffect(()=>{
  let stopped=false,timer:number|undefined;
  const id=visitorId();
  const ping=async()=>{
   if(stopped||document.visibilityState==="hidden")return;
   const path=(location.pathname+location.search).slice(0,300);
   try{await supabase.rpc("touch_site_presence",{p_visitor_id:id,p_path:path})}catch{}
  };
  const schedule=()=>{window.clearInterval(timer);timer=window.setInterval(ping,60000)};
  const visible=()=>{if(document.visibilityState==="visible")ping()};
  if("requestIdleCallback"in window)(window as any).requestIdleCallback(ping,{timeout:1800});else setTimeout(ping,500);
  schedule();document.addEventListener("visibilitychange",visible);window.addEventListener("focus",ping);
  return()=>{stopped=true;window.clearInterval(timer);document.removeEventListener("visibilitychange",visible);window.removeEventListener("focus",ping)};
 },[]);
 return null;
}