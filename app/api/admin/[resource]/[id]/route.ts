import { NextResponse } from "next/server";
import { AdminResourceService } from "../../../../../lib/services/admin-resource-service";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Yêu cầu thất bại.";
  return NextResponse.json({ error: message }, { status: /quyền/.test(message) ? 403 : 400 });
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id } = await context.params;
    return NextResponse.json({ data: await AdminResourceService.update(resource, id, await request.json()) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id } = await context.params;
    await AdminResourceService.remove(resource, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
