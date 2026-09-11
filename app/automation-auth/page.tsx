"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase-browser";

const AUTOMATION_ORIGIN = "https://automation.nguyenlekhanhhoa.com";

export default function AutomationAuthPage() {
  const [message, setMessage] = useState("Đang kiểm tra phiên đăng nhập...");

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessage("Bạn chưa đăng nhập website.");
        return;
      }

      // NLKH_AUTH_V1_FORM_HANDOFF
      // Không phụ thuộc window.opener/postMessage: COOP có thể cắt opener
      // giữa website và subdomain Automation.
      setMessage("Đang chuyển phiên đăng nhập sang NLKH Automation...");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = `${AUTOMATION_ORIGIN}/session`;
      form.target = "_self";
      form.style.display = "none";

      const token = document.createElement("input");
      token.type = "hidden";
      token.name = "access_token";
      token.value = session.access_token;

      form.appendChild(token);
      document.body.appendChild(form);
      form.submit();
    })();
  }, []);

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "80px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>NLKH Automation</h1>
      <p>{message}</p>

      <p>
        Nếu chưa đăng nhập, <a href="/login">đăng nhập tại đây</a>.
      </p>
    </main>
  );
}