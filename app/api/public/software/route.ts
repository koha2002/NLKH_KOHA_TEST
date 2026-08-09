import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ categories: [], items: [] });
  const [categories, items] = await Promise.all([
    supabase.from("software_categories").select("*").eq("visible", true).order("sort_order"),
    supabase.from("software_items").select("*").eq("visible", true).order("sort_order"),
  ]);
  return NextResponse.json({ categories: categories.data ?? [], items: items.data ?? [] });
}
