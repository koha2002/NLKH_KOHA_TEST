"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "../../../components/LanguageProvider";
import { supabase } from "../../../lib/supabase-browser";
import styles from "./reset-password.module.css";

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"checking"|"ready"|"error"|"success">("checking");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) { setReady(true); setState("ready"); setDetail(""); }
    });
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session) { setReady(true); setState("ready"); return; }
        const code = new URL(window.location.href).searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) throw error;
          if (active) { setReady(true); setState("ready"); }
          return;
        }
        setState("error");
      } catch (e) { if (active) { setState("error"); setDetail(e instanceof Error ? e.message : String(e)); } }
    })();
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setDetail("");
    if (newPassword.length < 8) { setDetail(vi ? "Mật khẩu mới cần ít nhất 8 ký tự." : "The new password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setDetail(vi ? "Hai ô mật khẩu mới không khớp." : "The new passwords do not match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) throw error;
      setState("success"); setDetail("");
      setTimeout(() => window.location.replace("/account"), 900);
    } catch (e) { setDetail(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const statusText = state === "checking" ? (vi ? "Đang xác thực liên kết khôi phục…" : "Verifying recovery link…")
    : state === "error" ? (detail || (vi ? "Liên kết khôi phục không hợp lệ, đã hết hạn hoặc phiên xác thực chưa được tạo. Hãy yêu cầu một liên kết mới." : "This recovery link is invalid, expired, or no recovery session was created. Request a new link."))
    : state === "success" ? (vi ? "Đã đặt mật khẩu mới thành công. Đang chuyển tới tài khoản…" : "Your password has been updated. Redirecting to your account…")
    : detail;

  return <main>
    <section className={styles.hero}><div className="container"><p>ACCOUNT / RECOVERY</p><h1>{vi ? "Đặt lại mật khẩu." : "Reset your password."}</h1></div></section>
    <section className={`container ${styles.wrap}`}>
      <form className={styles.card} onSubmit={submit}>
        {!ready ? <p className={styles.message}>{statusText}</p> : <>
          <label>{vi ? "Mật khẩu mới" : "New password"} <span>*</span><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" placeholder={vi ? "Tối thiểu 8 ký tự" : "At least 8 characters"} /></label>
          <label>{vi ? "Nhập lại mật khẩu mới" : "Confirm new password"} <span>*</span><input type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" /></label>
          {statusText ? <p className={styles.message}>{statusText}</p> : null}
          <button className={styles.submit} disabled={busy}>{busy ? (vi ? "Đang cập nhật…" : "Updating…") : (vi ? "Đặt mật khẩu mới" : "Set new password")}</button>
        </>}
        {state === "error" ? <a href="/login?mode=forgot">{vi ? "Yêu cầu liên kết mới" : "Request a new link"} →</a> : null}
      </form>
    </section>
  </main>;
}
