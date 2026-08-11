"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "../../../components/LanguageProvider";
import { supabase } from "../../../lib/supabase-browser";

export default function AuthCallbackPage(){
  const{language}=useLanguage(),vi=language==="vi";
  const[state,setState]=useState<"checking"|"success"|"error">("checking"),[detail,setDetail]=useState("");
  useEffect(()=>{(async()=>{
    try{
      const u=new URL(window.location.href);const err=u.searchParams.get("error_description");if(err)throw new Error(err);
      const code=u.searchParams.get("code");if(code){const{error}=await supabase.auth.exchangeCodeForSession(code);if(error)throw error}
      setState("success");setTimeout(()=>window.location.replace("/account"),600);
    }catch(e){setDetail(e instanceof Error?e.message:String(e));setState("error")}
  })()},[]);
  const msg=state==="checking"?(vi?"Đang xác thực tài khoản…":"Verifying your account…"):state==="success"?(vi?"Xác thực thành công. Đang chuyển sang tài khoản…":"Verification successful. Redirecting to your account…"):(vi?`Xác thực thất bại: ${detail}`:`Verification failed: ${detail}`);
  return <main><div className="container" style={{padding:"90px 0",minHeight:"55vh"}}>{msg}</div></main>
}
