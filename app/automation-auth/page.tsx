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

      if (!window.opener) {
        setMessage("Hãy mở trang này từ NLKH Automation.");
        return;
      }

      window.opener.postMessage(
        {
          type: "nlkh-automation-auth",
          accessToken: session.access_token,
        },
        AUTOMATION_ORIGIN,
      );

      setMessage("Xác thực thành công. Cửa sổ sẽ tự đóng.");

      window.setTimeout(() => {
        window.close();
      }, 500);
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