import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  if (supabaseUrl && anonKey && !path.startsWith("/api/") && !path.startsWith("/admin")) {
    try {
      const query = new URL(`${supabaseUrl}/rest/v1/redirects`);
      query.searchParams.set("source_path", `eq.${path}`);
      query.searchParams.set("active", "eq.true");
      query.searchParams.set("select", "target_url,status_code,preserve_query");
      query.searchParams.set("limit", "1");
      const response = await fetch(query, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, cache: "no-store" });
      const [redirect] = response.ok ? await response.json() as Array<{ target_url: string; status_code: number; preserve_query: boolean }> : [];
      if (redirect) {
        const target = new URL(redirect.target_url, request.url);
        if (redirect.preserve_query) request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
        if (target.href !== request.nextUrl.href) return NextResponse.redirect(target, redirect.status_code);
      }
    } catch { /* Nếu DB tạm thời không phản hồi, website vẫn tiếp tục tải bình thường. */ }
  }
  return updateSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
