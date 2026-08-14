import {
  adminClient,
  caller,
  hasPermission,
} from "../_shared/auth.ts";

import {
  corsHeaders,
  json,
} from "../_shared/cors.ts";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bearer(req: Request): string {
  const raw =
    req.headers.get("Authorization") || "";

  return raw.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
}

async function optionalProfileId(
  req: Request,
): Promise<string | null> {
  const token = bearer(req);

  if (!token) return null;

  try {
    const admin = adminClient();

    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token);

    if (error || !user?.id) return null;

    const { data } =
      await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    return data?.id || null;
  } catch {
    return null;
  }
}

async function touch(
  visitorId: string,
  pagePath: string,
  userId: string | null,
) {
  if (!UUID.test(visitorId)) {
    throw new Error("visitor_id không hợp lệ");
  }

  const path =
    String(pagePath || "/")
      .trim()
      .slice(0, 300) || "/";

  const admin = adminClient();

  const { data: existing, error: readError } =
    await admin
      .from("site_presence")
      .select(
        "visitor_id,user_id,first_seen_at,last_seen_at,current_path,page_views",
      )
      .eq("visitor_id", visitorId)
      .maybeSingle();

  if (readError) throw readError;

  const now = new Date();
  const nowIso = now.toISOString();

  let bump = 1;

  if (existing?.last_seen_at) {
    const age =
      now.getTime() -
      new Date(existing.last_seen_at).getTime();

    bump =
      age > 10000 ||
      String(existing.current_path || "/") !== path
        ? 1
        : 0;
  }

  const payload = {
    visitor_id: visitorId,
    user_id:
      userId ||
      existing?.user_id ||
      null,
    first_seen_at:
      existing?.first_seen_at ||
      nowIso,
    last_seen_at: nowIso,
    current_path: path,
    page_views:
      Number(existing?.page_views || 0) +
      bump,
    updated_at: nowIso,
  };

  const { error: writeError } =
    await admin
      .from("site_presence")
      .upsert(payload, {
        onConflict: "visitor_id",
      });

  if (writeError) throw writeError;

  return {
    visitor_id: visitorId,
    user_id: payload.user_id,
    path,
    server_time: nowIso,
  };
}

async function adminSummary(req: Request) {
  const ctx = await caller(req);

  if (!hasPermission(ctx, "users.manage")) {
    return json(req, { error: "Forbidden" }, 403);
  }

  const admin = adminClient();

  const { data, error } =
    await admin
      .from("site_presence")
      .select(
        "visitor_id,user_id,first_seen_at,last_seen_at,current_path,page_views,profiles(email,display_name,status,role_id)",
      )
      .order("last_seen_at", { ascending: false })
      .limit(300);

  if (error) throw error;

  const rows = data || [];
  const now = Date.now();

  return json(req, {
    ok: true,
    version: "presence-v5-pixel",
    checked_at: new Date().toISOString(),
    online:
      rows.filter(
        (row: any) =>
          now -
            new Date(row.last_seen_at).getTime()
          <= 90000,
      ).length,
    rows,
  });
}

async function cleanup(req: Request, body: any) {
  const ctx = await caller(req);

  if (!hasPermission(ctx, "users.manage")) {
    return json(req, { error: "Forbidden" }, 403);
  }

  const days =
    Math.min(
      365,
      Math.max(1, Number(body?.days || 30)),
    );

  const cut =
    new Date(
      Date.now() -
      days * 86400000,
    ).toISOString();

  const admin = adminClient();

  const { error } =
    await admin
      .from("site_presence")
      .delete()
      .lt("last_seen_at", cut);

  if (error) throw error;

  return json(req, {
    ok: true,
    deleted_before: cut,
  });
}

// NLKH_SITE_TRAFFIC_V5_PIXEL
Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders(req),
      });
    }

    // Public no-CORS heartbeat. This is intentionally a GET endpoint:
    // <img>/fetch no-cors can hit it even when JS CORS/auth fails.
    if (req.method === "GET") {
      const url = new URL(req.url);

      if (url.searchParams.get("action") !== "ping") {
        return new Response(null, { status: 404 });
      }

      const visitorId =
        String(url.searchParams.get("visitor_id") || "");

      const pagePath =
        String(url.searchParams.get("path") || "/");

      await touch(
        visitorId,
        pagePath,
        null,
      );

      return new Response(null, {
        status: 204,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
          "Access-Control-Allow-Origin":
            "*",
        },
      });
    }

    if (req.method !== "POST") {
      return json(
        req,
        { error: "Method not allowed" },
        405,
      );
    }

    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "ping") {
      const userId =
        await optionalProfileId(req);

      const result =
        await touch(
          String(body?.visitor_id || ""),
          String(body?.path || "/"),
          userId,
        );

      return json(req, {
        ok: true,
        version: "presence-v5-pixel",
        source: "edge-service-role",
        ...result,
      });
    }

    if (action === "summary") {
      return await adminSummary(req);
    }

    if (action === "cleanup") {
      return await cleanup(req, body);
    }

    return json(
      req,
      { error: "Unsupported action" },
      400,
    );
  } catch (error) {
    return json(
      req,
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500,
    );
  }
});