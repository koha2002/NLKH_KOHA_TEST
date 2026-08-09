import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResourceDefinition } from "../admin/resource-definitions";

export class AdminRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(definition: ResourceDefinition) {
    let query = this.client.from(definition.table).select("*");
    if (definition.orderBy) {
      query = query.order(definition.orderBy, { ascending: definition.ascending ?? true });
    }
    const { data, error } = await query.limit(500);
    if (error) throw error;
    return data ?? [];
  }

  async create(definition: ResourceDefinition, values: Record<string, unknown>) {
    const { data, error } = await this.client.from(definition.table).insert(values).select("*").single();
    if (error) throw error;
    return data;
  }

  async update(definition: ResourceDefinition, id: string, values: Record<string, unknown>) {
    const { data, error } = await this.client.from(definition.table).update(values).eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  }

  async remove(definition: ResourceDefinition, id: string) {
    const { error } = await this.client.from(definition.table).delete().eq("id", id);
    if (error) throw error;
  }
}
