import { supabase, invoke } from "./supabase";

export function assetCode(assetNo) {
  if (!assetNo) return "R2-??????";
  return `R2-${String(assetNo).padStart(6, "0")}`;
}

export async function sha256File(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadToR2(file, { visibility = "public", folder = "assets", usageNote = "", uploadedFrom = "admin", itemId = null, collectionId = null } = {}) {
  const sha256 = await sha256File(file);
  const prep = await invoke("r2-file", {
    action: "prepare-upload",
    original_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    sha256,
    visibility,
    folder,
    usage_note: usageNote,
    usage_type: uploadedFrom,
    item_id: itemId,
    collection_id: collectionId
  });

  if (prep.duplicate && prep.asset) return { ...prep.asset, _deduplicated: true };

  const put = await fetch(prep.url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  if (!put.ok) throw new Error(`Không tải được tệp lên R2 (HTTP ${put.status}). Kiểm tra CORS của bucket và thử lại.`);

  const done = await invoke("r2-file", { action: "complete-upload", media_id: prep.asset.id });
  return done.asset;
}

export async function replaceR2Asset(mediaId, file) {
  if (!mediaId) throw new Error("Chưa có ID R2 để thay file.");
  const sha256 = await sha256File(file);
  const prep = await invoke("r2-file", {
    action: "prepare-replace",
    media_id: mediaId,
    original_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    sha256
  });
  if (prep.duplicate && prep.asset) return { ...prep.asset, _deduplicated: true, _replacedByExisting: true };
  const put = await fetch(prep.url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  if (!put.ok) throw new Error(`Không thể thay file trên R2 (HTTP ${put.status}).`);
  const done = await invoke("r2-file", {
    action: "complete-replace",
    media_id: mediaId,
    original_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    sha256
  });
  return { ...done.asset, _sameId: true };
}

export async function listAssets(kind = "any") {
  let q = supabase.from("media_assets").select("*").eq("status", "ready").order("asset_no", { ascending: false });
  if (kind === "image") q = q.like("mime_type", "image/%");
  if (kind === "pdf") q = q.eq("mime_type", "application/pdf");
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getAsset(id) {
  if (!id) return null;
  const { data, error } = await supabase.from("media_assets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getAssetPreviewUrl(asset) {
  if (!asset) return "";
  if (asset.public_url) return asset.public_url;
  const out = await invoke("r2-file", { action: "presign-download", media_id: asset.id, object_key: asset.object_key });
  return out.url || "";
}

export async function deleteAsset(id, force = false) {
  return invoke("r2-file", { action: "delete", media_id: id, force });
}
