import { adminClient, caller, hasPermission } from "../_shared/auth.ts";
import { json, corsHeaders } from "../_shared/cors.ts";

const API = "https://api.cloudflare.com/client/v4";
const RULE_REF = "nlkh_admin_bulk_redirects";

function cfg() {
  const account = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || "";
  const token = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
  const listName = (Deno.env.get("CLOUDFLARE_REDIRECT_LIST_NAME") || "nlkh_admin_redirects").toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 50);
  const allowedHosts = (Deno.env.get("REDIRECT_ALLOWED_HOSTS") || "koha.io.vn,nguyenlekhanhhoa.com,nguyenlekhanhhoa.name.vn").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  const defaultTargetHost = (Deno.env.get("REDIRECT_DEFAULT_TARGET_HOST") || "nguyenlekhanhhoa.com").trim().toLowerCase();
  if (!account || !token) throw new Error("Thiếu CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_API_TOKEN trong Supabase Edge secrets.");
  return { account, token, listName, allowedHosts, defaultTargetHost };
}

async function cf(path: string, init: RequestInit = {}) {
  const { token } = cfg();
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await r.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!r.ok || body.success === false) {
    const msg = body?.errors?.map((x: any) => x.message).filter(Boolean).join("; ") || body?.messages?.map((x: any) => x.message).filter(Boolean).join("; ") || body?.raw || `HTTP ${r.status}`;
    const e: any = new Error(`Cloudflare: ${msg}`); e.status = r.status; throw e;
  }
  return body.result;
}

async function waitOperation(account: string, id?: string) {
  if (!id) return;
  for (let i = 0; i < 30; i++) {
    const result: any = await cf(`/accounts/${account}/rules/lists/bulk_operations/${id}`);
    if (result?.status === "completed") return;
    if (result?.status === "failed") throw new Error("Cloudflare bulk operation failed.");
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error("Cloudflare bulk operation chưa hoàn tất sau 15 giây; thử Đồng bộ lại sau.");
}

function normalizeTarget(target: string, defaultHost: string) {
  const t = String(target || "").trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${defaultHost}${t.startsWith("/") ? t : `/${t}`}`;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Chỉ hỗ trợ POST." }, 405);
  const admin = adminClient();
  try {
    const ctx = await caller(req);
    if (!hasPermission(ctx, "seo.manage")) return json(req, { error: "Bạn không có quyền đồng bộ Redirect." }, 403);
    const { account, listName, allowedHosts, defaultTargetHost } = cfg();
    const { data: rows, error } = await admin.from("redirects").select("*").eq("active", true).order("source_host").order("source_path");
    if (error) throw error;

    const rejected: any[] = [], items: any[] = [];
    for (const row of rows || []) {
      const host = String(row.source_host || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
      const path = String(row.source_path || "/").trim();
      if (!allowedHosts.includes(host)) { rejected.push({ id: row.id, reason: `Host ${host} chưa nằm trong REDIRECT_ALLOWED_HOSTS.` }); continue; }
      if (!path.startsWith("/") || path.includes("..")) { rejected.push({ id: row.id, reason: `Path ${path} không hợp lệ.` }); continue; }
      const target = normalizeTarget(String(row.target_url || ""), defaultTargetHost);
      const source = `${host}${path}`;
      if (target.replace(/^https?:\/\//, "").replace(/\/$/, "") === source.replace(/\/$/, "")) { rejected.push({ id: row.id, reason: "Redirect trỏ về chính nó." }); continue; }
      items.push({
        redirect: {
          source_url: source,
          target_url: target,
          status_code: Number(row.status_code || 301),
          preserve_query_string: row.preserve_query !== false,
          include_subdomains: !!row.include_subdomains,
          subpath_matching: !!row.subpath_matching,
          preserve_path_suffix: !!row.preserve_path_suffix,
        },
        comment: String(row.note || `Admin redirect ${host}${path}`).slice(0, 500),
      });
    }

    const lists: any[] = await cf(`/accounts/${account}/rules/lists`);
    let list = lists.find(x => x.name === listName && x.kind === "redirect");
    if (!list) list = await cf(`/accounts/${account}/rules/lists`, { method: "POST", body: JSON.stringify({ name: listName, description: "NLKH Admin managed cross-domain redirects", kind: "redirect" }) });

    const op: any = await cf(`/accounts/${account}/rules/lists/${list.id}/items`, { method: "PUT", body: JSON.stringify(items) });
    await waitOperation(account, op?.operation_id);

    const ruleSpec = {
      ref: RULE_REF,
      expression: `http.request.full_uri in $${listName}`,
      description: "NLKH Admin managed Bulk Redirects",
      action: "redirect",
      action_parameters: { from_list: { name: listName, key: "http.request.full_uri" } },
      enabled: true,
    };

    let entry: any = null;
    try { entry = await cf(`/accounts/${account}/rulesets/phases/http_request_redirect/entrypoint`); }
    catch (e) { if ((e as any)?.status !== 404) throw e; }
    if (!entry?.id) {
      entry = await cf(`/accounts/${account}/rulesets`, { method: "POST", body: JSON.stringify({ name: "NLKH redirects", kind: "root", phase: "http_request_redirect", rules: [ruleSpec] }) });
    } else {
      const existing = (entry.rules || []).find((r: any) => r.ref === RULE_REF || r.action_parameters?.from_list?.name === listName);
      if (existing?.id) await cf(`/accounts/${account}/rulesets/${entry.id}/rules/${existing.id}`, { method: "PATCH", body: JSON.stringify(ruleSpec) });
      else await cf(`/accounts/${account}/rulesets/${entry.id}/rules`, { method: "POST", body: JSON.stringify(ruleSpec) });
    }

    const ids = (rows || []).map((x: any) => x.id);
    if (ids.length) await admin.from("redirects").update({ cloudflare_synced_at: new Date().toISOString(), cloudflare_error: null }).in("id", ids);
    for (const x of rejected) await admin.from("redirects").update({ cloudflare_error: x.reason }).eq("id", x.id);
    return json(req, { ok: true, message: `Đã đồng bộ ${items.length} redirect lên Cloudflare.`, count: items.length, rejected, list: listName });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    try { await admin.from("redirects").update({ cloudflare_error: message }).eq("active", true); } catch {}
    return json(req, { error: message }, 500);
  }
});
