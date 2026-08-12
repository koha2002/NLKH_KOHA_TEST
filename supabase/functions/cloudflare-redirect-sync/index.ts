import { adminClient, caller, hasPermission } from "../_shared/auth.ts";
import { json, corsHeaders } from "../_shared/cors.ts";

const API = "https://api.cloudflare.com/client/v4";
const BULK_RULE_REF = "nlkh_admin_bulk_redirects";
const SINGLE_REF_PREFIX = "nlkh_admin_single_";
const SINGLE_PHASE = "http_request_dynamic_redirect";

function cfg() {
  const account = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || "";
  const token = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
  const zoneId = (Deno.env.get("CLOUDFLARE_ZONE_ID") || "").trim();
  const listName = (Deno.env.get("CLOUDFLARE_REDIRECT_LIST_NAME") || "nlkh_admin_redirects")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .slice(0, 50);

  const allowedHosts = (
    Deno.env.get("REDIRECT_ALLOWED_HOSTS") ||
    "koha.io.vn,nguyenlekhanhhoa.com,nguyenlekhanhhoa.name.vn"
  )
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const defaultTargetHost = (
    Deno.env.get("REDIRECT_DEFAULT_TARGET_HOST") || "nguyenlekhanhhoa.com"
  )
    .trim()
    .toLowerCase();

  if (!account || !token) {
    throw new Error(
      "Thiếu CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_API_TOKEN trong Supabase Edge secrets.",
    );
  }

  return { account, token, zoneId, listName, allowedHosts, defaultTargetHost };
}

async function cf(path: string, init: RequestInit = {}) {
  const { token } = cfg();

  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await r.text();
  let body: any = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!r.ok || body.success === false) {
    const msg =
      body?.errors?.map((x: any) => x.message).filter(Boolean).join("; ") ||
      body?.messages?.map((x: any) => x.message).filter(Boolean).join("; ") ||
      body?.raw ||
      `HTTP ${r.status}`;

    const e: any = new Error(`Cloudflare: ${msg}`);
    e.status = r.status;
    throw e;
  }

  return body.result;
}

async function waitOperation(account: string, id?: string) {
  if (!id) return;

  for (let i = 0; i < 30; i++) {
    const result: any = await cf(
      `/accounts/${account}/rules/lists/bulk_operations/${id}`,
    );

    if (result?.status === "completed") return;
    if (result?.status === "failed") {
      throw new Error("Cloudflare bulk operation failed.");
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(
    "Cloudflare bulk operation chưa hoàn tất sau 15 giây; thử đồng bộ lại sau.",
  );
}

function normalizeTarget(target: string, defaultHost: string) {
  const t = String(target || "").trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${defaultHost}${t.startsWith("/") ? t : `/${t}`}`;
}

function normalizeHost(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function normalizePath(value: unknown) {
  return String(value || "/").trim() || "/";
}

function cfString(value: string) {
  return JSON.stringify(value);
}

function stableRef(id: unknown) {
  return `${SINGLE_REF_PREFIX}${String(id || "row")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .slice(0, 100)}`;
}

function writableRule(rule: any) {
  const out: any = {
    action: rule.action,
    expression: rule.expression,
  };

  if (rule.ref) out.ref = rule.ref;
  if (rule.description) out.description = rule.description;
  if (rule.action_parameters) out.action_parameters = rule.action_parameters;
  if (typeof rule.enabled === "boolean") out.enabled = rule.enabled;
  if (rule.logging) out.logging = rule.logging;

  return out;
}

async function findZoneId(host: string, account: string) {
  let zones: any[];

  try {
    zones = await cf(`/zones?name=${encodeURIComponent(host)}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `${msg}. Để Admin tự tìm Zone ID, CLOUDFLARE_API_TOKEN cần quyền Zone → Zone → Read cho ${host}.`,
    );
  }

  const zone = (zones || []).find(
    (z: any) =>
      String(z?.name || "").toLowerCase() === host &&
      (!z?.account?.id || z.account.id === account),
  );

  if (!zone?.id) {
    throw new Error(
      `Không tìm thấy Cloudflare Zone ID cho ${host}. Hãy cấp Zone → Zone → Read cho API token.`,
    );
  }

  return zone.id as string;
}

async function syncBulkRedirects(
  account: string,
  listName: string,
  items: any[],
) {
  const lists: any[] = await cf(`/accounts/${account}/rules/lists`);

  let list = lists.find(
    (x: any) => x.name === listName && x.kind === "redirect",
  );

  if (!list) {
    list = await cf(`/accounts/${account}/rules/lists`, {
      method: "POST",
      body: JSON.stringify({
        name: listName,
        description: "NLKH Admin managed cross-domain redirects",
        kind: "redirect",
      }),
    });
  }

  const op: any = await cf(
    `/accounts/${account}/rules/lists/${list.id}/items`,
    {
      method: "PUT",
      body: JSON.stringify(items),
    },
  );

  await waitOperation(account, op?.operation_id);

  const ruleSpec = {
    ref: BULK_RULE_REF,
    expression: `http.request.full_uri in $${listName}`,
    description: "NLKH Admin managed cross-domain Bulk Redirects",
    action: "redirect",
    action_parameters: {
      from_list: {
        name: listName,
        key: "http.request.full_uri",
      },
    },
    enabled: true,
  };

  let entry: any = null;

  try {
    entry = await cf(
      `/accounts/${account}/rulesets/phases/http_request_redirect/entrypoint`,
    );
  } catch (e) {
    if ((e as any)?.status !== 404) throw e;
  }

  if (!entry?.id) {
    await cf(`/accounts/${account}/rulesets`, {
      method: "POST",
      body: JSON.stringify({
        name: "NLKH redirects",
        kind: "root",
        phase: "http_request_redirect",
        rules: [ruleSpec],
      }),
    });
    return;
  }

  const existing = (entry.rules || []).find(
    (r: any) =>
      r.ref === BULK_RULE_REF ||
      r.action_parameters?.from_list?.name === listName,
  );

  if (existing?.id) {
    await cf(
      `/accounts/${account}/rulesets/${entry.id}/rules/${existing.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(ruleSpec),
      },
    );
  } else {
    await cf(`/accounts/${account}/rulesets/${entry.id}/rules`, {
      method: "POST",
      body: JSON.stringify(ruleSpec),
    });
  }
}

async function syncSingleRedirects(
  zoneId: string,
  rules: any[],
) {
  let entry: any = null;

  try {
    entry = await cf(
      `/zones/${zoneId}/rulesets/phases/${SINGLE_PHASE}/entrypoint`,
    );
  } catch (e) {
    if ((e as any)?.status !== 404) throw e;
  }

  if (!entry?.id) {
    if (!rules.length) return;

    await cf(`/zones/${zoneId}/rulesets`, {
      method: "POST",
      body: JSON.stringify({
        name: "NLKH Admin Single Redirects",
        description:
          "NLKH Admin managed same-domain canonical redirects",
        kind: "zone",
        phase: SINGLE_PHASE,
        rules,
      }),
    });

    return;
  }

  // Giữ nguyên các Single Redirect không do NLKH Admin quản lý.
  const foreignRules = (entry.rules || [])
    .filter(
      (r: any) =>
        !String(r?.ref || "").startsWith(SINGLE_REF_PREFIX),
    )
    .map(writableRule);

  await cf(`/zones/${zoneId}/rulesets/${entry.id}`, {
    method: "PUT",
    body: JSON.stringify({
      description:
        entry.description ||
        "NLKH Admin managed same-domain canonical redirects",
      rules: [...foreignRules, ...rules],
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Chỉ hỗ trợ POST." }, 405);
  }

  const admin = adminClient();

  try {
    const ctx = await caller(req);

    if (!hasPermission(ctx, "seo.manage")) {
      return json(
        req,
        { error: "Bạn không có quyền đồng bộ Redirect." },
        403,
      );
    }

    const {
      account,
      zoneId,
      listName,
      allowedHosts,
      defaultTargetHost,
    } = cfg();

    const { data: rows, error } = await admin
      .from("redirects")
      .select("*")
      .eq("active", true)
      .order("source_host")
      .order("source_path");

    if (error) throw error;

    const rejected: any[] = [];
    const bulkItems: any[] = [];
    const bulkRows: any[] = [];
    const singleRules: any[] = [];
    const singleRows: any[] = [];

    for (const row of rows || []) {
      const host = normalizeHost(row.source_host);
      const path = normalizePath(row.source_path);

      if (!allowedHosts.includes(host)) {
        rejected.push({
          id: row.id,
          reason: `Host ${host} chưa nằm trong REDIRECT_ALLOWED_HOSTS.`,
        });
        continue;
      }

      if (!path.startsWith("/") || path.includes("..")) {
        rejected.push({
          id: row.id,
          reason: `Path ${path} không hợp lệ.`,
        });
        continue;
      }

      const target = normalizeTarget(
        String(row.target_url || ""),
        defaultTargetHost,
      );

      if (!target) {
        rejected.push({
          id: row.id,
          reason: "Thiếu target URL.",
        });
        continue;
      }

      const sourceUrl = `https://${host}${path}`;

      if (target.toLowerCase() === sourceUrl.toLowerCase()) {
        rejected.push({
          id: row.id,
          reason: "Redirect trỏ về chính nó.",
        });
        continue;
      }

      if (host !== defaultTargetHost) {
        bulkItems.push({
          redirect: {
            source_url: sourceUrl,
            target_url: target,
            status_code: Number(row.status_code || 301),
            preserve_query_string: row.preserve_query !== false,
            include_subdomains: !!row.include_subdomains,
            subpath_matching: !!row.subpath_matching,
            preserve_path_suffix: !!row.preserve_path_suffix,
          },
          comment: String(
            row.note || `Admin redirect ${host}${path}`,
          ).slice(0, 500),
        });

        bulkRows.push(row);
        continue;
      }

      // Same-domain canonical redirect: quản lý bằng Single Redirect.
      // Hiện hỗ trợ exact path, đúng với nhóm /cv/, /software/, /tools/.../
      if (row.subpath_matching || row.preserve_path_suffix) {
        rejected.push({
          id: row.id,
          reason:
            "Same-domain Single Redirect hiện chỉ hỗ trợ exact path; hãy tắt Khớp mọi path con và Giữ phần path phía sau.",
        });
        continue;
      }

      singleRules.push({
        ref: stableRef(row.id),
        expression:
          `(http.host eq ${cfString(host)} and ` +
          `http.request.uri.path eq ${cfString(path)})`,
        description: String(
          row.note || `NLKH Admin same-domain ${path} -> ${target}`,
        ).slice(0, 500),
        action: "redirect",
        action_parameters: {
          from_value: {
            target_url: {
              value: target,
            },
            status_code: Number(row.status_code || 301),
            preserve_query_string: row.preserve_query !== false,
          },
        },
        enabled: true,
      });

      singleRows.push(row);
    }

    // 1) Chỉ redirect khác domain vào Bulk Redirects.
    await syncBulkRedirects(account, listName, bulkItems);

    // 2) Redirect cùng domain vào zone-level Single Redirects.
    const resolvedZoneId =
      zoneId || await findZoneId(defaultTargetHost, account);
    await syncSingleRedirects(resolvedZoneId, singleRules);

    const syncedRows = [...bulkRows, ...singleRows];
    const syncedIds = syncedRows.map((x: any) => x.id);

    if (syncedIds.length) {
      await admin
        .from("redirects")
        .update({
          cloudflare_synced_at: new Date().toISOString(),
          cloudflare_error: null,
        })
        .in("id", syncedIds);
    }

    for (const x of rejected) {
      await admin
        .from("redirects")
        .update({ cloudflare_error: x.reason })
        .eq("id", x.id);
    }

    return json(req, {
      ok: true,
      message:
        `Đã đồng bộ ${bulkItems.length} Bulk + ` +
        `${singleRules.length} Single Redirect lên Cloudflare.`,
      bulk_count: bulkItems.length,
      single_count: singleRules.length,
      rejected,
      list: listName,
      zone_id: resolvedZoneId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    try {
      await admin
        .from("redirects")
        .update({ cloudflare_error: message })
        .eq("active", true);
    } catch {
      // Không che lỗi gốc nếu việc ghi trạng thái lỗi thất bại.
    }

    return json(req, { error: message }, 500);
  }
});