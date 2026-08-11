"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase-browser";

function safeNext(raw:string|null){
  if(!raw||!raw.startsWith("/")||raw.startsWith("//"))return "/account";
  return raw;
}

export default function AuthCallbackPage(){
  const[msg,setMsg]=useState("Đang xác thực tài khoản…");

  useEffect(()=>{
    let alive=true;

    (async()=>{
      try{
        const url=new URL(window.location.href);
        const next=safeNext(url.searchParams.get("next"));
        const remoteError=url.searchParams.get("error_description")||url.searchParams.get("error");
        if(remoteError)throw new Error(remoteError);

        // Hỗ trợ token_hash nếu template email được đổi sang kiểu verifyOtp.
        const tokenHash=url.searchParams.get("token_hash");
        const type=url.searchParams.get("type");
        if(tokenHash&&type){
          const{error}=await supabase.auth.verifyOtp({token_hash:tokenHash,type:type as any});
          if(error)throw error;
        }

        // Tương thích link PKCE đã gửi trước hotfix.
        const code=url.searchParams.get("code");
        if(code){
          const{error}=await supabase.auth.exchangeCodeForSession(code);
          if(error){
            const m=String(error.message||error);
            if(/verifier|pkce|code verifier/i.test(m)){
              throw new Error("Liên kết xác nhận cũ thiếu mã PKCE của trình duyệt. Hãy về trang Đăng nhập và bấm “Gửi lại email xác nhận”.");
            }
            throw error;
          }
        }

        // Implicit flow: token nằm trong URL hash. supabase-js thường tự xử lý,
        // nhưng setSession thủ công giúp callback ổn định nếu auto detection chưa kịp chạy.
        const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
        const accessToken=hash.get("access_token");
        const refreshToken=hash.get("refresh_token");
        if(accessToken&&refreshToken){
          const{error}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
          if(error)throw error;
        }

        let session=(await supabase.auth.getSession()).data.session;
        for(let i=0;!session&&i<15;i++){
          await new Promise(resolve=>setTimeout(resolve,100));
          session=(await supabase.auth.getSession()).data.session;
        }

        if(!session)throw new Error("Không tạo được phiên đăng nhập. Liên kết có thể đã hết hạn; hãy gửi lại email xác nhận.");

        window.history.replaceState({},document.title,"/auth/callback");
        if(!alive)return;
        setMsg("Xác thực thành công. Đang chuyển sang tài khoản…");
        setTimeout(()=>window.location.replace(next),500);
      }catch(e){
        if(alive)setMsg(`Xác thực thất bại: ${e instanceof Error?e.message:String(e)}`);
      }
    })();

    return()=>{alive=false};
  },[]);

  return <main><div className="container" style={{padding:"90px 0",minHeight:"55vh"}}>
    <p>{msg}</p>
    {msg.startsWith("Xác thực thất bại")?<p style={{marginTop:18}}><a href="/login">← Về trang đăng nhập</a></p>:null}
  </div></main>
}
