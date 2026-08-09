"use client";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export function AccountActions() {
  const router = useRouter();
  return <button onClick={async () => { await createSupabaseBrowserClient()?.auth.signOut(); router.replace("/"); router.refresh(); }}>Đăng xuất</button>;
}
