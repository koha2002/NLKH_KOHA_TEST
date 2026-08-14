"use client";

import {
  useEffect,
} from "react";

import {
  supabase,
} from "../lib/supabase-browser";

const VISITOR_KEY =
  "nlkh-visitor-id-v1";

const STATUS_KEY =
  "nlkh-site-traffic-v5";

const EDGE =
  `${String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")}/functions/v1/site-traffic`;

function visitorId() {
  try {
    let id =
      localStorage.getItem(VISITOR_KEY) || "";

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }

    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function pixelPing(
  visitorId: string,
  path: string,
) {
  if (!EDGE.startsWith("https://")) return;

  const url =
    `${EDGE}?action=ping` +
    `&visitor_id=${encodeURIComponent(visitorId)}` +
    `&path=${encodeURIComponent(path)}` +
    `&_=${Date.now()}`;

  // Image requests do not require CORS permission.
  // The endpoint returns 204; the request itself is what matters.
  const image = new Image();
  image.referrerPolicy = "strict-origin-when-cross-origin";
  image.src = url;
}

export function SitePresence() {
  useEffect(() => {
    let stopped = false;
    let busy = false;

    const id = visitorId();

    const ping = async () => {
      if (
        stopped ||
        busy ||
        document.visibilityState === "hidden"
      ) return;

      busy = true;

      const path =
        (
          location.pathname +
          location.search
        ).slice(0, 300);

      // Guaranteed guest heartbeat first.
      pixelPing(id, path);

      try {
        const invokePromise =
          supabase.functions.invoke(
            "site-traffic",
            {
              body: {
                action: "ping",
                visitor_id: id,
                path,
              },
            },
          );

        const timeoutPromise =
          new Promise<never>((_, reject) => {
            window.setTimeout(
              () => reject(
                new Error("site-traffic POST timeout"),
              ),
              4500,
            );
          });

        const { data, error } =
          await Promise.race([
            invokePromise,
            timeoutPromise,
          ]);

        if (error) throw error;

        try {
          localStorage.setItem(
            STATUS_KEY,
            JSON.stringify({
              ok: true,
              at: new Date().toISOString(),
              path,
              server:
                data?.server_time || null,
              version:
                data?.version || null,
            }),
          );
        } catch {}
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.warn(
          "[NLKH site-traffic v5]",
          message,
        );

        try {
          localStorage.setItem(
            STATUS_KEY,
            JSON.stringify({
              ok: false,
              at: new Date().toISOString(),
              error: message,
            }),
          );
        } catch {}
      } finally {
        busy = false;
      }
    };

    void ping();

    const timer =
      window.setInterval(
        () => void ping(),
        30000,
      );

    const visible = () => {
      if (document.visibilityState === "visible") {
        void ping();
      }
    };

    const focus = () => void ping();
    const pageshow = () => void ping();

    document.addEventListener(
      "visibilitychange",
      visible,
    );
    window.addEventListener("focus", focus);
    window.addEventListener("pageshow", pageshow);

    return () => {
      stopped = true;
      window.clearInterval(timer);

      document.removeEventListener(
        "visibilitychange",
        visible,
      );
      window.removeEventListener("focus", focus);
      window.removeEventListener("pageshow", pageshow);
    };
  }, []);

  return null;
}