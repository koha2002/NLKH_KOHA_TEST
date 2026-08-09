import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { AccountActions } from "./AccountActions";
import styles from "./account.module.css";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <main className={styles.page}><section><h1>Chưa cấu hình Supabase</h1><p>Hãy thêm biến môi trường theo README.</p></section></main>;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account");
  const { data: profile } = await supabase.from("profiles").select("display_name,email,status,role_id").eq("id", auth.user.id).maybeSingle();
  return <main className={styles.page}><section><p className={styles.eyebrow}>ACCOUNT</p><h1>{profile?.display_name || auth.user.email}</h1><dl><div><dt>Email</dt><dd>{auth.user.email}</dd></div><div><dt>Trạng thái</dt><dd>{profile?.status === "active" ? "Đã kích hoạt" : profile?.status === "suspended" ? "Đã tạm khóa" : "Chờ quản trị viên duyệt"}</dd></div><div><dt>Vai trò</dt><dd>{profile?.role_id || "member"}</dd></div></dl><div className={styles.actions}><a href="/data">Mở dữ liệu được cấp</a>{profile?.role_id !== "member" ? <a href="/admin">Mở Admin</a> : null}<AccountActions /></div></section></main>;
}
