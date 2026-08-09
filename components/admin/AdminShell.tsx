"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import styles from "./admin.module.css";

const groups = [
  { label: "Tổng quan", links: [["/admin", "Bảng điều khiển"]] },
  { label: "Website", links: [["/admin/site", "Cấu hình chung"], ["/admin/pages", "Trang nội dung"], ["/admin/menu", "Menu & footer"], ["/admin/seo", "SEO"], ["/admin/redirects", "Redirect"]] },
  { label: "Nội dung", links: [["/admin/cv", "CV"], ["/admin/news", "Tin tức"], ["/admin/software", "Phần mềm"], ["/admin/data", "Dữ liệu"], ["/admin/media", "Ảnh & tệp R2"]] },
  { label: "Công cụ", links: [["/admin/tools", "Danh sách tool"], ["/admin/tools/quiz", "Quiz"], ["/admin/tools/pdf", "PDF"], ["/admin/tools/comtrade", "COMTRADE"], ["/admin/orbit", "Quỹ đạo"]] },
  { label: "Hệ thống", links: [["/admin/users", "Người dùng & quyền"], ["/admin/api", "API & lịch chạy"]] },
] as const;

export function AdminShell({ children, identity }: { children: React.ReactNode; identity: { displayName: string; roleId: string } }) {
  const path = usePathname();
  const router = useRouter();
  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.brand}>NLKH<span>/ADMIN</span></Link>
      <div className={styles.identity}><strong>{identity.displayName}</strong><span>{identity.roleId}</span></div>
      <nav>{groups.map((group) => <section key={group.label}><p>{group.label}</p>{group.links.map(([href,label]) => <Link key={href} href={href} className={path === href || (href !== "/admin" && path.startsWith(`${href}/`)) ? styles.active : ""}>{label}</Link>)}</section>)}</nav>
      <div className={styles.sideActions}><Link href="/" target="_blank">Xem website ↗</Link><button onClick={async () => { await createSupabaseBrowserClient()?.auth.signOut(); router.replace("/login"); router.refresh(); }}>Đăng xuất</button></div>
    </aside>
    <div className={styles.content}>{children}</div>
  </div>;
}
