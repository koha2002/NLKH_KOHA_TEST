import { NextResponse } from "next/server";
import { can, getAdminIdentity } from "../../../../../../lib/auth/permissions";
import { createSupabaseServiceClient } from "../../../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const identity = await getAdminIdentity();
  if (!can(identity, "api.manage")) return NextResponse.json({ error: "Bạn không có quyền quản lý API." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json() as { secret?: string };
  if (!body.secret || body.secret.trim().length < 4) return NextResponse.json({ error: "Khóa API quá ngắn." }, { status: 400 });
  const service = createSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Supabase service role chưa được cấu hình." }, { status: 503 });
  const { error } = await service.rpc("service_store_api_secret", { integration_uuid: id, secret_value: body.secret.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await service.from("audit_logs").insert({ actor_id: identity!.id, action: "integration.secret.update", resource_type: "api_integrations", resource_id: id });
  return NextResponse.json({ ok: true });
}
