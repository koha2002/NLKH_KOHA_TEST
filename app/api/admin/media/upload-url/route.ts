import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { can, getAdminIdentity } from "../../../../../lib/auth/permissions";
import { createUploadUrl, publicR2Url } from "../../../../../lib/r2/client";

export const runtime = "nodejs";

function safeName(name: string) { return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "file"; }

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!can(identity, "media.manage")) return NextResponse.json({ error: "Bạn không có quyền tải tệp." }, { status: 403 });
  const body = await request.json() as { name?: string; type?: string; folder?: string };
  if (!body.name || !body.type) return NextResponse.json({ error: "Thiếu tên hoặc loại tệp." }, { status: 400 });
  const folder = safeName(body.folder || "uploads").replace(/\./g, "-");
  const key = `${folder}/${new Date().toISOString().slice(0,10)}/${randomUUID()}-${safeName(body.name)}`;
  try { return NextResponse.json({ key, uploadUrl: await createUploadUrl(key, body.type), publicUrl: publicR2Url(key) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo URL tải lên." }, { status: 503 }); }
}
