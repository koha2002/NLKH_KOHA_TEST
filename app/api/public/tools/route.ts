import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ tools: [], rings: [] });
  const [{ data: auth }, toolResult, ringResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("tools").select("*").eq("visible", true).order("sort_order"),
    supabase.from("orbit_rings").select("*").eq("visible", true).order("sort_order"),
  ]);
  let role = "guest";
  if (auth.user) {
    const { data: profile } = await supabase.from("profiles").select("role_id,status").eq("id", auth.user.id).maybeSingle();
    if (profile?.status === "active") role = profile.role_id;
  }
  const tools = (toolResult.data ?? []).filter((tool) => !tool.requires_auth || (role !== "guest" && (!tool.allowed_roles?.length || tool.allowed_roles.includes(role))));
  return NextResponse.json({ tools, rings: ringResult.data ?? [], role });
}
