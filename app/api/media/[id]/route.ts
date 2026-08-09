import { NextResponse } from "next/server";
import { createDownloadUrl, readR2Object } from "../../../../lib/r2/client";
import { createSupabaseServerClient, createSupabaseServiceClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const service = createSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Máy chủ chưa cấu hình." }, { status: 503 });
  const { data: media } = await service.from("media_assets").select("id,object_key,original_name,mime_type,size_bytes,visibility,owner_id,public_url").eq("id", id).maybeSingle();
  if (!media) return NextResponse.json({ error: "Tệp không tồn tại." }, { status: 404 });
  if (media.visibility !== "public") {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!auth.user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    const { data: allowed } = await supabase!.from("media_assets").select("id").eq("id", id).maybeSingle();
    if (!allowed) return NextResponse.json({ error: "Bạn không có quyền tải tệp." }, { status: 403 });
  }
  const inlineContent = new URL(request.url).searchParams.get("content") === "1";
  if (inlineContent) {
    const isJson = media.mime_type === "application/json" || media.original_name.toLowerCase().endsWith(".json");
    if (!isJson) return NextResponse.json({ error: "Chỉ hỗ trợ đọc trực tiếp file JSON." }, { status: 415 });
    if (Number(media.size_bytes ?? 0) > 10 * 1024 * 1024) return NextResponse.json({ error: "File JSON vượt quá giới hạn 10 MB." }, { status: 413 });
    try {
      const content = await readR2Object(media.object_key);
      return new NextResponse(content, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return NextResponse.json({ error: "Không thể đọc file từ kho lưu trữ." }, { status: 502 });
    }
  }
  if (media.visibility === "public" && media.public_url) return NextResponse.redirect(media.public_url);
  return NextResponse.redirect(await createDownloadUrl(media.object_key, media.original_name));
}
