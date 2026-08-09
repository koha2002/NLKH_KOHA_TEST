import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ profile: null, sections: [] });
  const { data: profile } = await supabase.from("cv_profiles").select("*").eq("published", true).limit(1).maybeSingle();
  if (!profile) return NextResponse.json({ profile: null, sections: [] });
  const { data: sections } = await supabase.from("cv_sections").select("*").eq("profile_id", profile.id).eq("visible", true).order("sort_order");
  return NextResponse.json({ profile, sections: sections ?? [] });
}
