import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseServiceClient } from "../supabase/server";

export async function enforceToolAccess(slug: string, returnTo: string) {
  const service = createSupabaseServiceClient();
  if (!service) return;

  const { data: tool } = await service
    .from("tools")
    .select("visible,requires_auth,allowed_roles")
    .eq("slug", slug)
    .maybeSingle();

  // Source vẫn chạy được trước khi Admin/Supabase được cấu hình.
  if (!tool) return;
  if (!tool.visible) notFound();
  if (!tool.requires_auth && !(tool.allowed_roles?.length)) return;

  const client = await createSupabaseServerClient();
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  if (!auth.user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);

  const { data: profile } = await service
    .from("profiles")
    .select("status,role_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!profile || profile.status !== "active") redirect(`/account?blocked=1`);
  if (tool.allowed_roles?.length && !tool.allowed_roles.includes(profile.role_id)) redirect(`/account?denied=1`);
}
