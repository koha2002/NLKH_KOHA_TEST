import { NextResponse } from "next/server";
import { can, getAdminIdentity } from "../../../../lib/auth/permissions";
import { invokeIntegration, type Integration } from "../../../../lib/integrations/invoke";
import { createSupabaseServerClient, createSupabaseServiceClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
const attempts = new Map<string, { count: number; reset: number }>();

function limited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.reset < now) { attempts.set(key, { count: 1, reset: now + 60000 }); return false; }
  current.count += 1;
  return current.count > 30;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const service = createSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Máy chủ API chưa được cấu hình." }, { status: 503 });
  const { data } = await service.from("api_integrations").select("*").eq("slug", slug).maybeSingle();
  const integration = data as Integration & { scope: "public" | "authenticated" | "admin" } | null;
  if (!integration?.active) return NextResponse.json({ error: "Kết nối API không tồn tại hoặc đang tắt." }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (integration.scope !== "public" && !auth.user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  if (integration.scope === "admin" && !can(await getAdminIdentity(), "api.manage")) return NextResponse.json({ error: "Bạn không có quyền gọi API này." }, { status: 403 });
  const clientKey = auth.user?.id || request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
  if (limited(`${slug}:${clientKey}`)) return NextResponse.json({ error: "Bạn gọi quá nhanh. Hãy thử lại sau một phút." }, { status: 429 });
  try {
    const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
    return NextResponse.json(await invokeIntegration(service, integration, payload));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể gọi API." }, { status: 502 });
  }
}
