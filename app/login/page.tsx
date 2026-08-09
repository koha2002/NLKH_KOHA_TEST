"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import { usePublicShell } from "../../components/PublicShellProvider";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { site } = usePublicShell();
  const registrationEnabled = site.registration_enabled !== false;
  const [mode, setMode] = useState<"login" | "register">("login");
  const activeMode = registrationEnabled ? mode : "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("registered")) setMessage("Email đã được xác thực. Bạn có thể đăng nhập.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase chưa được cấu hình trên máy chủ.");
      return;
    }
    setBusy(true);
    setMessage("");
    if (activeMode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      });
      setBusy(false);
      setMessage(error?.message ?? "Đã gửi email xác thực. Hãy mở hộp thư rồi bấm liên kết xác nhận.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.replace(new URLSearchParams(window.location.search).get("next") || "/account");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>NLKH / ACCOUNT</p>
        <h1>{activeMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
        <p className={styles.lead}>{activeMode === "login" ? "Mở dữ liệu và chức năng được cấp cho bạn." : "Xác thực email trước; quản trị viên sẽ duyệt và phân quyền sau."}</p>
        <form onSubmit={submit}>
          {activeMode === "register" ? <label>Họ tên<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label> : null}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label>Mật khẩu<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={activeMode === "login" ? "current-password" : "new-password"} required /></label>
          {message ? <p className={styles.message} role="status">{message}</p> : null}
          <button type="submit" disabled={busy}>{busy ? "Đang xử lý…" : activeMode === "login" ? "Đăng nhập" : "Đăng ký và gửi email"}<span>→</span></button>
        </form>
        {registrationEnabled ? <button className={styles.switcher} onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
          {activeMode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button> : <p className={styles.message}>Website hiện tạm đóng đăng ký tài khoản mới.</p>}
      </section>
    </main>
  );
}
