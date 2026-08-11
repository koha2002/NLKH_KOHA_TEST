"use client";

import { FormEvent,useEffect,useState } from "react";
import { supabase } from "../../lib/supabase-browser";
import { adminSite } from "../../data/admin-generated";
import styles from "./login.module.css";

type Mode="login"|"signup"|"forgot";

export default function LoginPage(){
  const[mode,setMode]=useState<Mode>("login");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[displayName,setDisplayName]=useState("");
  const[message,setMessage]=useState("");
  const[busy,setBusy]=useState(false);

  useEffect(()=>{
    const q=new URLSearchParams(window.location.search);
    if(q.get("mode")==="forgot")setMode("forgot");
  },[]);

  function switchMode(next:Mode){
    setMode(next);setMessage("");setPassword("");
  }

  function callbackUrl(){
    return `${window.location.origin}/auth/callback?next=/account`;
  }

  async function resendConfirmation(){
    const normalizedEmail=email.trim().toLowerCase();
    if(!normalizedEmail){setMessage("Nhập email cần gửi lại xác nhận.");return}
    setBusy(true);setMessage("");
    try{
      const{error}=await supabase.auth.resend({
        type:"signup",
        email:normalizedEmail,
        options:{emailRedirectTo:callbackUrl()}
      });
      if(error)throw error;
      setMessage("Đã gửi lại email xác nhận. Hãy dùng email MỚI NHẤT; link cũ có thể đã hết hạn.");
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  }

  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{
      const normalizedEmail=email.trim().toLowerCase();
      if(!normalizedEmail)throw new Error("Vui lòng nhập email.");

      if(mode==="forgot"){
        const{error}=await supabase.auth.resetPasswordForEmail(normalizedEmail,{
          redirectTo:`${window.location.origin}/account/reset-password`
        });
        if(error)throw error;
        setMessage("Nếu email thuộc một tài khoản hợp lệ, hệ thống đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra Hộp thư đến và Spam.");
        return;
      }

      if(mode==="login"){
        const{error}=await supabase.auth.signInWithPassword({email:normalizedEmail,password});
        if(error)throw error;
        const next=new URLSearchParams(window.location.search).get("next");
        window.location.href=next&&next.startsWith("/")&&!next.startsWith("//")?next:"/account";
        return;
      }

      if(!Boolean(adminSite.registration_enabled))throw new Error("Website hiện đang tắt đăng ký tài khoản mới.");
      if(displayName.trim().length<2)throw new Error("Họ tên cần ít nhất 2 ký tự.");

      const{error}=await supabase.auth.signUp({
        email:normalizedEmail,password,
        options:{
          data:{display_name:displayName.trim()},
          emailRedirectTo:callbackUrl()
        }
      });
      if(error)throw error;
      setMessage("Đã tạo yêu cầu đăng ký. Hãy kiểm tra email xác nhận. Nếu link lỗi hoặc đã cũ, dùng nút “Gửi lại email xác nhận” bên dưới.");
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  }

  const title=mode==="login"?"Đăng nhập tài khoản.":mode==="signup"?"Tạo tài khoản mới.":"Khôi phục mật khẩu.";

  return <main>
    <section className={styles.hero}><div className="container"><p>ACCOUNT / AUTH</p><h1>{title}</h1></div></section>
    <section className={`container ${styles.wrap}`}>
      <form className={styles.card} onSubmit={submit}>
        {mode!=="forgot"?<div className={styles.tabs}>
          <button type="button" className={mode==="login"?styles.active:""} onClick={()=>switchMode("login")}>Đăng nhập</button>
          <button type="button" className={mode==="signup"?styles.active:""} onClick={()=>switchMode("signup")}>Đăng ký</button>
        </div>:<button type="button" className={styles.backButton} onClick={()=>switchMode("login")}>← Quay lại đăng nhập</button>}

        {mode==="signup"?<label>Họ và tên <span>*</span><input value={displayName} onChange={e=>setDisplayName(e.target.value)} required placeholder="Nguyễn Văn A"/></label>:null}

        <label>Email <span>*</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="email@example.com"/></label>

        {mode!=="forgot"?<label>Mật khẩu <span>*</span><input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete={mode==="login"?"current-password":"new-password"} placeholder="Tối thiểu 8 ký tự"/></label>:
          <p className={styles.help}>Nhập email đã đăng ký. Hệ thống sẽ gửi liên kết an toàn để bạn đặt mật khẩu mới.</p>}

        {mode==="login"?<button type="button" className={styles.forgotButton} onClick={()=>switchMode("forgot")}>Quên mật khẩu?</button>:null}

        {message?<p className={styles.message}>{message}</p>:null}

        <button className={styles.submit} disabled={busy}>
          {busy?"Đang xử lý…":mode==="login"?"Đăng nhập":mode==="signup"?"Tạo tài khoản":"Gửi liên kết đặt lại mật khẩu"}
        </button>

        {mode==="signup"?<button type="button" className={styles.forgotButton} disabled={busy} onClick={resendConfirmation}>
          Gửi lại email xác nhận
        </button>:null}
      </form>
    </section>
  </main>
}
