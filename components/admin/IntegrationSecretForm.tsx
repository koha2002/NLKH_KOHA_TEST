"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./admin.module.css";

export function IntegrationSecretForm() {
  const [integrations, setIntegrations] = useState<Array<{ id:string; name:string; slug:string }>>([]);
  const [id, setId] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/admin/integrations", { cache:"no-store" }).then((response) => response.json() as Promise<{ data?: { id: string; name: string; slug: string }[] }>).then((body) => setIntegrations(body.data ?? [])).catch(() => undefined); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("Đang lưu…");
    const response = await fetch(`/api/admin/integrations/${encodeURIComponent(id)}/secret`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret }) });
    const body = await response.json() as { error?: string };
    if (!response.ok) return setMessage(body.error || "Không thể lưu khóa.");
    setSecret(""); setMessage("Đã mã hóa khóa trong Supabase Vault. Khóa không được gửi lại trình duyệt.");
  }
  return <form className={styles.secretForm} onSubmit={submit}><div><p>SECRET VAULT</p><h2>Cập nhật khóa bí mật</h2><span>Chọn API đã tạo. Khóa được mã hóa trong Supabase Vault, không lưu trong Git và không được hiển thị lại.</span></div><label><span>Kết nối API</span><select value={id} onChange={(event) => setId(event.target.value)} required><option value="">— Chọn API —</option>{integrations.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.slug})</option>)}</select></label><label><span>API key / secret</span><input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="new-password" required /></label><button>Lưu khóa an toàn</button>{message ? <strong>{message}</strong> : null}</form>;
}
