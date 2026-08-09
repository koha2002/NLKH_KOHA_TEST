import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptIntegrationSecret } from "./secrets";

type Integration = {
  id: string;
  slug: string;
  base_url: string;
  allowed_host: string;
  endpoint_template: string;
  method: string;
  headers_template: unknown;
  query_template: unknown;
  body_template: unknown;
  key_placeholder: string;
  secret_ciphertext: string | null;
  timeout_ms: number;
  active: boolean;
};

function lookup(payload: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, payload);
}

function renderString(value: string, payload: Record<string, unknown>, secret: string, placeholder: string) {
  let output = value.split(placeholder || "{{API_KEY}}").join(secret);
  output = output.replace(/\{\{\s*(?:payload\.)?([\w.-]+)\s*\}\}/g, (_, key: string) => {
    const replacement = lookup(payload, key);
    return replacement === undefined || replacement === null ? "" : String(replacement);
  });
  return output;
}

function renderTemplate(value: unknown, payload: Record<string, unknown>, secret: string, placeholder: string): unknown {
  if (typeof value === "string") return renderString(value, payload, secret, placeholder);
  if (Array.isArray(value)) return value.map((item) => renderTemplate(item, payload, secret, placeholder));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, renderTemplate(child, payload, secret, placeholder)]));
  }
  return value;
}

export async function invokeIntegration(client: SupabaseClient, integration: Integration, payload: Record<string, unknown>, endpointOverride = "") {
  if (!integration.active) throw new Error("Kết nối API đang bị tắt.");
  void client;
  if (!integration.secret_ciphertext) throw new Error("API chưa có khóa bí mật.");
  const secret = decryptIntegrationSecret(integration.secret_ciphertext);

  const endpoint = endpointOverride || renderString(integration.endpoint_template || "/", payload, "", integration.key_placeholder);
  const target = new URL(endpoint, integration.base_url.endsWith("/") ? integration.base_url : `${integration.base_url}/`);
  if (target.protocol !== "https:" && target.hostname !== "localhost") throw new Error("API chỉ được gọi qua HTTPS.");
  if (target.hostname.toLowerCase() !== integration.allowed_host.trim().toLowerCase()) throw new Error("Host API không khớp danh sách cho phép.");

  const query = renderTemplate(integration.query_template || {}, payload, String(secret), integration.key_placeholder) as Record<string, unknown>;
  for (const [key, value] of Object.entries(query)) if (value !== "" && value !== null && value !== undefined) target.searchParams.set(key, String(value));
  const headers = renderTemplate(integration.headers_template || {}, payload, String(secret), integration.key_placeholder) as Record<string, string>;
  const bodyTemplate = renderTemplate(integration.body_template || {}, payload, String(secret), integration.key_placeholder);
  const body = ["GET", "DELETE"].includes(integration.method) ? undefined : JSON.stringify({ ...(bodyTemplate as Record<string, unknown>), ...payload });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(Math.max(integration.timeout_ms || 30000, 1000), 120000));
  try {
    const response = await fetch(target, { method: integration.method, headers, body, signal: controller.signal, cache: "no-store" });
    const type = response.headers.get("content-type") || "";
    const responseBody = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) throw new Error(`API trả về HTTP ${response.status}.`);
    return { status: response.status, data: responseBody };
  } finally {
    clearTimeout(timeout);
  }
}

export type { Integration };
