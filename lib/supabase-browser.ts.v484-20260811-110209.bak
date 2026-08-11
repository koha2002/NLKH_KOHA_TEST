"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const supabase = createClient(url, key, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type MyAccess = {
  authenticated: boolean;
  id?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  role_id?: string;
  status?: string;
  permissions?: string[];
};

export async function getMyAccess(): Promise<MyAccess> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { authenticated: false, permissions: [] };
  const { data, error } = await supabase.rpc("get_my_access");
  if (error) {
    return { authenticated: true, id: session.user.id, email: session.user.email, status: "error", permissions: [] };
  }
  return { permissions: [], ...(data || {}) } as MyAccess;
}

export async function invokeEdge<T = any>(name: string, body: any = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: any = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { message: text }; }
  if (!response.ok) throw new Error(parsed.error || parsed.message || `HTTP ${response.status}`);
  return parsed as T;
}

export async function sha256File(file: File) {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function uploadR2(file: File, options: {
  usageType?: "avatar" | "data";
  folder?: string;
  visibility?: "public" | "authenticated" | "private";
  usageNote?: string;
  itemId?: string;
  collectionId?: string;
} = {}) {
  const sha256 = await sha256File(file);
  const prepared = await invokeEdge<any>("r2-file", {
    action: "prepare-upload",
    usage_type: options.usageType || "data",
    folder: options.folder || (options.usageType === "avatar" ? "avatars" : "data"),
    visibility: options.visibility || (options.usageType === "avatar" ? "public" : "private"),
    usage_note: options.usageNote || "",
    item_id: options.itemId || null,
    collection_id: options.collectionId || null,
    original_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    sha256,
  });
  if (prepared.duplicate) return prepared.asset;
  const put = await fetch(prepared.url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload R2 thất bại ở bước PUT: HTTP ${put.status}`);
  const completed = await invokeEdge<any>("r2-file", { action: "complete-upload", media_id: prepared.asset.id });
  return completed.asset;
}

export function initials(name?: string, email?: string) {
  const source = (name || email?.split("@")[0] || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}
