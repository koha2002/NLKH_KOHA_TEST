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
  "nlkh-site-traffic-v4";

function visitorId() {
  try {
    let id =
      localStorage.getItem(
        VISITOR_KEY,
      ) || "";

    if (
      !/^[0-9a-f-]{36}$/i.test(
        id,
      )
    ) {
      id =
        crypto.randomUUID();

      localStorage.setItem(
        VISITOR_KEY,
        id,
      );
    }

    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function SitePresence() {
  useEffect(
    () => {
      let stopped =
        false;

      let busy =
        false;

      const id =
        visitorId();

      const ping =
        async () => {
          if (
            stopped ||
            busy ||
            document.visibilityState ===
              "hidden"
          ) {
            return;
          }

          busy = true;

          try {
            const path =
              (
                location.pathname +
                location.search
              ).slice(
                0,
                300,
              );

            const {
              data,
              error,
            } =
              await supabase
                .functions
                .invoke(
                  "site-traffic",
                  {
                    body: {
                      action:
                        "ping",
                      visitor_id:
                        id,
                      path,
                    },
                  },
                );

            if (error) {
              throw error;
            }

            try {
              localStorage.setItem(
                STATUS_KEY,
                JSON.stringify({
                  ok: true,
                  at:
                    new Date()
                      .toISOString(),
                  path,
                  server:
                    data?.server_time ||
                    null,
                  source:
                    data?.source ||
                    null,
                }),
              );
            } catch {}
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : String(error);

            console.warn(
              "[NLKH site-traffic]",
              message,
            );

            try {
              localStorage.setItem(
                STATUS_KEY,
                JSON.stringify({
                  ok: false,
                  at:
                    new Date()
                      .toISOString(),
                  error:
                    message,
                }),
              );
            } catch {}
          } finally {
            busy = false;
          }
        };

      // Send immediately. A short visit must still be counted.
      void ping();

      const timer =
        window.setInterval(
          () => {
            void ping();
          },
          30000,
        );

      const visible =
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            void ping();
          }
        };

      const focus =
        () => {
          void ping();
        };

      const pageshow =
        () => {
          void ping();
        };

      document.addEventListener(
        "visibilitychange",
        visible,
      );

      window.addEventListener(
        "focus",
        focus,
      );

      window.addEventListener(
        "pageshow",
        pageshow,
      );

      return () => {
        stopped = true;

        window.clearInterval(
          timer,
        );

        document.removeEventListener(
          "visibilitychange",
          visible,
        );

        window.removeEventListener(
          "focus",
          focus,
        );

        window.removeEventListener(
          "pageshow",
          pageshow,
        );
      };
    },
    [],
  );

  return null;
}