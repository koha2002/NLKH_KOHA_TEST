"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { getMyAccess, initials, supabase, uploadR2, type MyAccess } from "../../lib/supabase-browser";
import styles from "./account.module.css";

export default function AccountPage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [access, setAccess] = useState<MyAccess | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  async function load() { const a = await getMyAccess(); setAccess(a); setName(a.display_name || ""); }
  useEffect(() => { load(); }, []);

  async function saveName() {
    if (!access?.id) return;
    setMessage("");
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", access.id);
    if (error) setMessage(error.message);
    else { setMessage(vi ? "Đã lưu tên hiển thị." : "Display name saved."); load(); }
  }

  async function avatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !access?.id) return;
    if (!file.type.startsWith("image/")) { setMessage(vi ? "Ảnh đại diện phải là file ảnh." : "The profile picture must be an image file."); return; }
    setBusy(true); setMessage("");
    try {
      const asset: any = await uploadR2(file, { usageType: "avatar", folder: "avatars", visibility: "public", usageNote: "User avatar" });
      const { error } = await supabase.from("profiles").update({ avatar_media_id: asset.id, avatar_url: asset.public_url }).eq("id", access.id);
      if (error) throw error;
      const id = `R2-${String(asset.asset_no || "").padStart(6, "0")}`;
      setMessage(vi ? `Đã đổi ảnh đại diện. ID R2: ${id}` : `Profile picture updated. R2 ID: ${id}`);
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); e.target.value = ""; }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault(); setPasswordMessage("");
    if (!access?.email) { setPasswordMessage(vi ? "Không xác định được email của phiên đăng nhập." : "The email for this session could not be determined."); return; }
    if (currentPassword.length < 1) { setPasswordMessage(vi ? "Vui lòng nhập mật khẩu hiện tại." : "Enter your current password."); return; }
    if (newPassword.length < 8) { setPasswordMessage(vi ? "Mật khẩu mới cần ít nhất 8 ký tự." : "The new password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage(vi ? "Hai ô mật khẩu mới không khớp." : "The new passwords do not match."); return; }
    if (newPassword === currentPassword) { setPasswordMessage(vi ? "Mật khẩu mới phải khác mật khẩu hiện tại." : "The new password must be different from the current password."); return; }

    setPasswordBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: access.email, password: currentPassword });
      if (verifyError) throw new Error(vi ? "Mật khẩu hiện tại không đúng." : "The current password is incorrect.");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordMessage(vi ? "Đã đổi mật khẩu thành công." : "Password changed successfully.");
    } catch (e) { setPasswordMessage(e instanceof Error ? e.message : String(e)); }
    finally { setPasswordBusy(false); }
  }

  async function logout() { await supabase.auth.signOut(); window.location.href = "/"; }

  if (access === null) return <main><div className="container" style={{ padding: "80px 0" }}>{vi ? "Đang tải tài khoản…" : "Loading account…"}</div></main>;
  if (!access.authenticated) return <main><div className="container" style={{ padding: "80px 0" }}><p>{vi ? "Bạn chưa đăng nhập." : "You are not signed in."}</p><a href="/login">{vi ? "Đăng nhập" : "Sign in"} →</a></div></main>;

  const statusLabel = access.status === "active" ? (vi ? "Đang hoạt động" : "Active") : access.status === "pending" ? (vi ? "Chờ duyệt" : "Pending") : access.status === "suspended" ? (vi ? "Tạm khóa" : "Suspended") : access.status;

  return <main>
    <section className={styles.hero}><div className="container"><p>ACCOUNT / PROFILE</p><h1>{vi ? "Tài khoản của bạn." : "Your account."}</h1></div></section>
    <section className={`container ${styles.wrap}`}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>{access.avatar_url ? <img src={access.avatar_url} alt={vi ? "Ảnh đại diện" : "Profile picture"} /> : <span>{initials(access.display_name, access.email)}</span>}</div>
        <div className={styles.info}><strong>{access.display_name || access.email}</strong><span>{access.email}</span><small>{access.role_id} · {statusLabel}</small></div>
        <label className={styles.upload}>{busy ? (vi ? "Đang tải…" : "Uploading…") : (vi ? "Đổi ảnh đại diện" : "Change profile picture")}<input type="file" accept="image/*" onChange={avatar} disabled={busy} /></label>
      </div>

      <div className={styles.panel}>
        <h2>{vi ? "Thông tin cá nhân" : "Personal information"}</h2>
        <label>{vi ? "Tên hiển thị" : "Display name"}<input value={name} onChange={(e) => setName(e.target.value)} placeholder={vi ? "Họ và tên" : "Full name"} /></label>
        <div className={styles.actions}><button onClick={saveName}>{vi ? "Lưu thay đổi" : "Save changes"}</button><button onClick={logout}>{vi ? "Đăng xuất" : "Sign out"}</button></div>
        {access.status === "pending" ? <p className={styles.note}>{vi ? "Tài khoản đã xác nhận email nhưng đang chờ Admin duyệt quyền sử dụng." : "Your email is confirmed, but the account is waiting for admin approval."}</p> : null}
        {message ? <p className={styles.note}>{message}</p> : null}
      </div>

      <form className={styles.panel} onSubmit={changePassword}>
        <div className={styles.panelHeading}><div><h2>{vi ? "Đổi mật khẩu" : "Change password"}</h2><p>{vi ? "Nhập mật khẩu hiện tại để xác minh trước khi đặt mật khẩu mới." : "Enter your current password before setting a new one."}</p></div><a href="/login?mode=forgot">{vi ? "Quên mật khẩu?" : "Forgot password?"}</a></div>
        <label>{vi ? "Mật khẩu hiện tại" : "Current password"} <span className={styles.required}>*</span><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
        <label>{vi ? "Mật khẩu mới" : "New password"} <span className={styles.required}>*</span><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required placeholder={vi ? "Tối thiểu 8 ký tự" : "At least 8 characters"} /></label>
        <label>{vi ? "Nhập lại mật khẩu mới" : "Confirm new password"} <span className={styles.required}>*</span><input type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></label>
        <div className={styles.passwordActions}><button type="submit" disabled={passwordBusy}>{passwordBusy ? (vi ? "Đang đổi…" : "Changing…") : (vi ? "Đổi mật khẩu" : "Change password")}</button></div>
        {passwordMessage ? <p className={styles.note}>{passwordMessage}</p> : null}
      </form>
    </section>
  </main>;
}
