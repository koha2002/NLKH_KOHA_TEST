import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { invokeIntegration, type Integration } from "../../../../lib/integrations/invoke";
import { createSupabaseServiceClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSecret(request: Request) {
  const expected = process.env.SCHEDULER_SECRET || "";
  const received = request.headers.get("x-scheduler-secret") || "";
  if (!expected || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(request: Request) {
  if (!validSecret(request)) return NextResponse.json({ error: "Scheduler secret không hợp lệ." }, { status: 401 });
  const service = createSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Supabase service role chưa cấu hình." }, { status: 503 });
  const { data: jobs, error } = await service.from("scheduled_api_jobs").select("*,api_integrations(*)").eq("enabled", true).lte("next_run_at", new Date().toISOString()).order("next_run_at").limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: Array<{ id: string; ok: boolean; message: string }> = [];
  for (const job of jobs ?? []) {
    let ok = false;
    let message = "OK";
    try {
      if (job.handler === "supabase_keepalive") {
        const ping = await service.from("site_settings").select("id").limit(1);
        if (ping.error) throw ping.error;
      } else {
        if (!job.api_integrations) throw new Error("Lịch chưa gắn kết nối API.");
        await invokeIntegration(service, job.api_integrations as Integration, (job.request_payload || {}) as Record<string, unknown>, job.endpoint_path || "");
      }
      ok = true;
    } catch (jobError) {
      message = jobError instanceof Error ? jobError.message : "Tác vụ thất bại.";
    }
    const nextRun = new Date(Date.now() + Math.max(job.interval_minutes, 15) * 60000).toISOString();
    await service.from("scheduled_api_jobs").update({ last_run_at: new Date().toISOString(), last_status: ok ? "success" : "failed", last_message: message.slice(0, 500), next_run_at: nextRun }).eq("id", job.id);
    results.push({ id: job.id, ok, message });
  }
  return NextResponse.json({ checked: jobs?.length ?? 0, results });
}
