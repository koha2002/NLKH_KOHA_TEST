import { createSupabaseServerClient } from "../supabase/server";

export type AdminIdentity = {
  id: string;
  email: string;
  displayName: string;
  roleId: string;
  status: "pending" | "active" | "suspended";
  permissions: string[];
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id,email,display_name,role_id,status,roles(permissions)")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!data) return null;

  const relation = data.roles as unknown as { permissions?: string[] } | { permissions?: string[] }[] | null;
  const permissions = Array.isArray(relation)
    ? relation[0]?.permissions ?? []
    : relation?.permissions ?? [];

  return {
    id: data.id as string,
    email: data.email as string,
    displayName: (data.display_name as string) || (data.email as string),
    roleId: data.role_id as string,
    status: data.status as AdminIdentity["status"],
    permissions,
  };
}

export function can(identity: AdminIdentity | null, permission: string) {
  return Boolean(
    identity &&
    identity.status === "active" &&
    (identity.permissions.includes("*") || identity.permissions.includes(permission)),
  );
}
