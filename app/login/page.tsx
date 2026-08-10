"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { supabase } from "../../lib/supabase-browser";
import { adminSite } from "../../data/admin-generated";
import styles from "./login.module.css";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "forgot") setMode("forgot");
  }, []);

  function switchMode(next: Mode) {
    setMode(next); setMessage(""); setPassword("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) throw new Error(vi ? "Vui lòng nhập email." : "Please enter your email.");

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/account/reset-password`,
        });
        if (error) throw error;
        setMessage(vi
          ? "Nếu email thuộc một tài khoản hợp lệ, hệ thống đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra Hộp thư đến và Spam."
          : "If the email belongs to a valid account, a password-reset link has been sent. Check your inbox and spam folder.");
        return;
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        const next = new URLSearchParams(window.location.search).get("next");
        window.location.href = next && next.startsWith("/") ? next : "/account";
        return;
      }

      if (!Boolean(adminSite.registration_enabled)) throw new Error(vi ? "Website hiện đang tắt đăng ký tài khoản mới." : "New account registration is currently disabled.");
      if (displayName.trim().length < 2) throw new Error(vi ? "Họ tên cần ít nhất 2 ký tự." : "Your name must contain at least 2 characters.");

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { display_name: displayName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMessage(vi
        ? "Đã tạo yêu cầu đăng ký. Hãy kiểm tra email xác nhận; sau đó tài khoản có thể cần Admin duyệt trước khi dùng dữ liệu riêng."
        : "Registration submitted. Confirm your email; your account may then require admin approval before accessing private data.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  const title = mode === "login"
    ? (vi ? "Đăng nhập tài khoản." : "Sign in to your account.")
    : mode === "signup"
      ? (vi ? "Tạo tài khoản mới." : "Create a new account.")
      : (vi ? "Khôi phục mật khẩu." : "Recover your password.");

  return <main>
    <section className={styles.hero}><div className="container"><p>ACCOUNT / AUTH</p><h1>{title}</h1></div></section>
    <section className={`container ${styles.wrap}`}>
      <form className={styles.card} onSubmit={submit}>
        {mode !== "forgot" ? <div className={styles.tabs}>
          <button type="button" className={mode === "login" ? styles.active : ""} onClick={() => switchMode("login")}>{vi ? "Đăng nhập" : "Sign in"}</button>
          <button type="button" className={mode === "signup" ? styles.active : ""} onClick={() => switchMode("signup")}>{vi ? "Đăng ký" : "Register"}</button>
        </div> : <button type="button" className={styles.backButton} onClick={() => switchMode("login")}>← {vi ? "Quay lại đăng nhập" : "Back to sign in"}</button>}

        {mode === "signup" ? <label>{vi ? "Họ và tên" : "Full name"} <span>*</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder={vi ? "Nguyễn Văn A" : "Your name"} /></label> : null}
        <label>Email <span>*</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="email@example.com" /></label>
        {mode !== "forgot" ? <label>{vi ? "Mật khẩu" : "Password"} <span>*</span><input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={vi ? "Tối thiểu 8 ký tự" : "At least 8 characters"} /></label>
          : <p className={styles.help}>{vi ? "Nhập email đã đăng ký. Hệ thống sẽ gửi liên kết an toàn để bạn đặt mật khẩu mới." : "Enter your registered email. We will send a secure link to set a new password."}</p>}
        {mode === "login" ? <button type="button" className={styles.forgotButton} onClick={() => switchMode("forgot")}>{vi ? "Quên mật khẩu?" : "Forgot password?"}</button> : null}
        {message ? <p className={styles.message} role="status">{message}</p> : null}
        <button className={styles.submit} disabled={busy}>{busy ? (vi ? "Đang xử lý…" : "Processing…") : mode === "login" ? (vi ? "Đăng nhập" : "Sign in") : mode === "signup" ? (vi ? "Tạo tài khoản" : "Create account") : (vi ? "Gửi liên kết đặt lại mật khẩu" : "Send password-reset link")}</button>
      </form>
    </section>
  </main>;
}
