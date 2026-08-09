import { NextResponse } from "next/server";
import { AdminResourceService } from "../../../../lib/services/admin-resource-service";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Yêu cầu thất bại.";
  const status = /quyền/.test(message) ? 403 : /chưa được cấu hình/.test(message) ? 503 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params;
    return NextResponse.json({ data: await AdminResourceService.list(resource) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params;
    return NextResponse.json({ data: await AdminResourceService.create(resource, await request.json()) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
