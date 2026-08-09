import { can, getAdminIdentity } from "../auth/permissions";
import { getResourceDefinition } from "../admin/resource-definitions";
import { AdminRepository } from "../repositories/admin-repository";
import { createSupabaseServerClient, createSupabaseServiceClient } from "../supabase/server";

function sanitize(fields: readonly string[], input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Dữ liệu gửi lên không hợp lệ.");
  const source = input as Record<string, unknown>;
  return Object.fromEntries(fields.filter((field) => field in source).map((field) => [field, source[field] === "" && field.endsWith("_at") ? null : source[field]]));
}

async function context(resource: string) {
  const definition = getResourceDefinition(resource);
  if (!definition) throw new Error("Mục quản trị không tồn tại.");
  const identity = await getAdminIdentity();
  if (!can(identity, definition.permission)) throw new Error("Bạn không có quyền thực hiện thao tác này.");
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase chưa được cấu hình.");
  return { definition, identity: identity!, repository: new AdminRepository(client) };
}

async function audit(actorId: string, action: string, resource: string, id?: string) {
  const service = createSupabaseServiceClient();
  if (!service) return;
  await service.from("audit_logs").insert({ actor_id: actorId, action, resource_type: resource, resource_id: id ?? null });
}

export class AdminResourceService {
  static async list(resource: string) {
    const { definition, repository } = await context(resource);
    return repository.list(definition);
  }

  static async create(resource: string, input: unknown) {
    const { definition, repository, identity } = await context(resource);
    const data = await repository.create(definition, sanitize(definition.fields, input));
    await audit(identity.id, "create", resource, String((data as { id?: unknown })?.id ?? ""));
    return data;
  }

  static async update(resource: string, id: string, input: unknown) {
    const { definition, repository, identity } = await context(resource);
    const data = await repository.update(definition, id, sanitize(definition.fields, input));
    await audit(identity.id, "update", resource, id);
    return data;
  }

  static async remove(resource: string, id: string) {
    const { definition, repository, identity } = await context(resource);
    await repository.remove(definition, id);
    await audit(identity.id, "delete", resource, id);
  }
}
