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

function bearer(
  req: Request,
): string {
  const raw =
    req.headers.get(
      "Authorization",
    ) || "";

  const match =
    raw.match(
      /^Bearer\s+(.+)$/i,
    );

  return match?.[1]?.trim() || "";
}

async function optionalProfileId(
  req: Request,
): Promise<string | null> {
  const token =
    bearer(req);

  if (!token) {
    return null;
  }

  try {
    const admin =
      adminClient();

    const {
      data: { user },
      error,
    } =
      await admin.auth.getUser(
        token,
      );

    if (
      error ||
      !user?.id
    ) {
      return null;
    }

    const {
      data: profile,
    } =
      await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    return profile?.id || null;
  } catch {
    return null;
  }
}

async function ping(
  req: Request,
  body: any,
) {
  const visitorId =
    String(
      body?.visitor_id || "",
    ).trim();

  if (
    !UUID.test(
      visitorId,
    )
  ) {
    return json(
      req,
      {
        error:
          "visitor_id không hợp lệ",
      },
      400,
    );
  }

  const pagePath =
    String(
      body?.path || "/",
    )
      .trim()
      .slice(0, 300) ||
    "/";

  const now =
    new Date().toISOString();

  const admin =
    adminClient();

  const profileId =
    await optionalProfileId(
      req,
    );

  const {
    data: existing,
    error: readError,
  } =
    await admin
      .from("site_presence")
      .select(
        "visitor_id,first_seen_at,page_views,user_id",
      )
      .eq(
        "visitor_id",
        visitorId,
      )
      .maybeSingle();

  if (readError) {
    throw readError;
  }

  const payload = {
    visitor_id:
      visitorId,
    user_id:
      profileId ||
      existing?.user_id ||
      null,
    first_seen_at:
      existing?.first_seen_at ||
      now,
    last_seen_at:
      now,
    current_path:
      pagePath,
    page_views:
      Number(
        existing?.page_views ||
        0,
      ) + 1,
    updated_at:
      now,
  };

  const {
    error: writeError,
  } =
    await admin
      .from("site_presence")
      .upsert(
        payload,
        {
          onConflict:
            "visitor_id",
        },
      );

  if (writeError) {
    throw writeError;
  }

  return json(
    req,
    {
      ok: true,
      source:
        "edge-service-role",
      visitor_id:
        visitorId,
      user_id:
        payload.user_id,
      path:
        pagePath,
      server_time:
        now,
    },
  );
}

async function requireUsersManage(
  req: Request,
) {
  const ctx =
    await caller(req);

  if (
    !hasPermission(
      ctx,
      "users.manage",
    )
  ) {
    return null;
  }

  return ctx;
}

async function summary(
  req: Request,
) {
  const ctx =
    await requireUsersManage(
      req,
    );

  if (!ctx) {
    return json(
      req,
      {
        error:
          "Forbidden",
      },
      403,
    );
  }

  const admin =
    adminClient();

  const {
    data,
    error,
  } =
    await admin
      .from("site_presence")
      .select(
        "visitor_id,user_id,first_seen_at,last_seen_at,current_path,page_views,profiles(email,display_name,status,role_id)",
      )
      .order(
        "last_seen_at",
        {
          ascending: false,
        },
      )
      .limit(300);

  if (error) {
    throw error;
  }

  const rows =
    data || [];

  const now =
    Date.now();

  const online =
    rows.filter(
      (row: any) =>
        now -
          new Date(
            row.last_seen_at,
          ).getTime() <=
        90000,
    ).length;

  return json(
    req,
    {
      ok: true,
      source:
        "edge-service-role",
      checked_at:
        new Date().toISOString(),
      online,
      rows,
    },
  );
}

async function cleanup(
  req: Request,
  body: any,
) {
  const ctx =
    await requireUsersManage(
      req,
    );

  if (!ctx) {
    return json(
      req,
      {
        error:
          "Forbidden",
      },
      403,
    );
  }

  const days =
    Math.min(
      365,
      Math.max(
        1,
        Number(
          body?.days || 30,
        ),
      ),
    );

  const cut =
    new Date(
      Date.now() -
      days *
        86400000,
    ).toISOString();

  const admin =
    adminClient();

  const {
    error,
  } =
    await admin
      .from("site_presence")
      .delete()
      .lt(
        "last_seen_at",
        cut,
      );

  if (error) {
    throw error;
  }

  return json(
    req,
    {
      ok: true,
      deleted_before:
        cut,
    },
  );
}

// NLKH_SITE_TRAFFIC_V4_EDGE_SERVICE_ROLE
Deno.serve(
  async (
    req: Request,
  ) => {
    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders(req),
        },
      );
    }

    if (
      req.method !==
      "POST"
    ) {
      return json(
        req,
        {
          error:
            "Method not allowed",
        },
        405,
      );
    }

    try {
      const body =
        await req.json();

      const action =
        String(
          body?.action || "",
        );

      if (
        action ===
        "ping"
      ) {
        return await ping(
          req,
          body,
        );
      }

      if (
        action ===
        "summary"
      ) {
        return await summary(
          req,
        );
      }

      if (
        action ===
        "cleanup"
      ) {
        return await cleanup(
          req,
          body,
        );
      }

      return json(
        req,
        {
          error:
            "Unsupported action",
        },
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
  },
);