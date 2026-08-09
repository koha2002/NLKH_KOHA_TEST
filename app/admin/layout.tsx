import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "../../components/admin/AdminShell";
import { getAdminIdentity } from "../../lib/auth/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quản trị website", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/login?next=/admin");
  if (identity.status !== "active" || identity.roleId === "member") {
    return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f4f7fb",color:"#111827"}}><section style={{maxWidth:620,padding:42,border:"1px solid #d9e0e9",borderRadius:20,background:"white"}}><p style={{color:"#1769e0",fontWeight:800}}>ACCOUNT / PENDING</p><h1 style={{fontSize:48,lineHeight:1,letterSpacing:"-.05em"}}>Chưa có quyền quản trị</h1><p>Tài khoản đã xác thực email nhưng đang chờ chủ sở hữu kích hoạt hoặc chưa được gán vai trò quản trị.</p><a href="/account" style={{display:"inline-block",marginTop:16,padding:"12px 16px",borderRadius:10,background:"#1769e0",color:"white",fontWeight:800}}>Về tài khoản</a></section></main>;
  }
  return <AdminShell identity={{ displayName: identity.displayName, roleId: identity.roleId }}>{children}</AdminShell>;
}
