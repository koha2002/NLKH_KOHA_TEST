import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ collections: [], items: [], authenticated: false });
  const { data: auth } = await supabase.auth.getUser();
  const type = new URL(request.url).searchParams.get("type");
  const collectionsPromise = supabase.from("data_collections").select("*").eq("visible", true).order("sort_order");
  let itemQuery = supabase.from("data_items").select("id,collection_id,title_vi,title_en,description_vi,description_en,item_type,external_url,media_id,visibility,sort_order,metadata").eq("visible", true).order("sort_order");
  if (type) itemQuery = itemQuery.eq("item_type", type);
  const [collections, items] = await Promise.all([collectionsPromise, itemQuery]);
  const mapped = (items.data ?? []).map((item) => ({
    ...item,
    access_url: item.media_id
      ? `/api/media/${item.media_id}${item.item_type === "quiz_json" ? "?content=1" : ""}`
      : item.external_url,
  }));
  return NextResponse.json({ collections: collections.data ?? [], items: mapped, authenticated: Boolean(auth.user) });
}
