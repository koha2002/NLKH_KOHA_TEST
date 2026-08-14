"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase-browser";

const KEY = "nlkh-visitor-id-v1";
const LAST_OK_KEY = "nlkh-presence-last-ok-v3";
const LAST_ERROR_KEY = "nlkh-presence-last-error-v3";

function visitorId() {
  try {
    let id = localStorage.getItem(KEY) || "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function SitePresence() {
  useEffect(() => {
    let stopped = false;
    let busy = false;
    const id = visitorId();

    const ping = async () => {
      if (stopped || busy || document.visibilityState === "hidden") return;

      busy = true;
      try {
        const path = (location.pathname + location.search).slice(0, 300);
        const { data, error } = await supabase.rpc("touch_site_presence_v3", {
          p_visitor_id: id,
          p_path: path,
        });

        if (error) {
          const message = `${error.code || "RPC"}: ${error.message || "presence failed"}`;
          try { localStorage.setItem(LAST_ERROR_KEY, message); } catch {}
          console.warn("[NLKH presence]", message);
          return;
        }

        try {
          localStorage.setItem(
            LAST_OK_KEY,
            JSON.stringify({
              at: new Date().toISOString(),
              path,
              server: data?.server_time || null,
            }),
          );
          localStorage.removeItem(LAST_ERROR_KEY);
        } catch {}
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        try { localStorage.setItem(LAST_ERROR_KEY, message); } catch {}
        console.warn("[NLKH presence]", message);
      } finally {
        busy = false;
      }
    };

    // Ping immediately. Do not wait for requestIdleCallback:
    // a short visit still needs to appear in Admin.
    void ping();

    const timer = window.setInterval(() => {
      void ping();
    }, 30000);

    const visible = () => {
      if (document.visibilityState === "visible") void ping();
    };
    const focus = () => void ping();
    const pageshow = () => void ping();

    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", focus);
    window.addEventListener("pageshow", pageshow);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", focus);
      window.removeEventListener("pageshow", pageshow);
    };
  }, []);

  return null;
}