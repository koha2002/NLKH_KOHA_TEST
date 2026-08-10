import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { adminClient, caller, hasPermission } from "../_shared/auth.ts";
import { json, corsHeaders } from "../_shared/cors.ts";

const REPO = "koha2002/NLKH_KOHA";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;

function r2() {
  const account = Deno.env.get("R2_ACCOUNT_ID");
  const access = Deno.env.get("R2_ACCESS_KEY_ID");
  const secret = Deno.env.get("R2_SECRET_ACCESS_KEY");
  if (!account || !access || !secret) throw new Error("Thiếu R2 credentials trong Edge Function Secrets.");
  return new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: access, secretAccessKey: secret },
  });
}
const bucket = () => Deno.env.get("R2_BUCKET_NAME") || "";
const code = (n: number) => `R2-${String(n).padStart(6, "0")}`;
const safe = (name: string) => name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "file";
const publicUrl = (key: string) => {
  const base = (Deno.env.get("R2_PUBLIC_BASE_URL") || "").replace(/\/$/, "");
  return base ? `${base}/${key.split("/").map(encodeURIComponent).join("/")}` : null;
};
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || crypto.randomUUID();

async function fetchJson(path: string) {
  const r = await fetch(RAW + path, { headers: { "User-Agent": "NLKH-Legacy-Importer/4.6" } });
  if (!r.ok) throw new Error(`${path}: GitHub HTTP ${r.status}`);
  return r.json();
}
async function fetchBytes(path: string, optional = false) {
  const r = await fetch(RAW + path, { headers: { "User-Agent": "NLKH-Legacy-Importer/4.6" } });
  if (!r.ok) {
    if (optional && r.status === 404) return null;
    throw new Error(`${path}: GitHub HTTP ${r.status}`);
  }
  return { bytes: new Uint8Array(await r.arrayBuffer()), type: r.headers.get("content-type") || mime(path) };
}
function mime(path: string) {
  const p = path.toLowerCase();
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".svg")) return "image/svg+xml";
  if (p.endsWith(".pdf")) return "application/pdf";
  if (p.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}
async function sha256(bytes: Uint8Array) {
  const out = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(out)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function uploadMedia(admin: any, s3: S3Client, path: string, folder: string, visibility = "public", optional = false) {
  const payload = await fetchBytes(path, optional);
  if (!payload) return null;
  const original = path.split("/").pop() || "file";
  const hash = await sha256(payload.bytes);
  const { data: dupe } = await admin.from("media_assets").select("*").eq("sha256", hash).eq("visibility", visibility).eq("status", "ready").maybeSingle();
  if (dupe) return { ...dupe, asset_code: code(dupe.asset_no), duplicate: true };

  const { data: asset, error } = await admin.from("media_assets").insert({
    object_key: `pending/${crypto.randomUUID()}`,
    original_name: original,
    mime_type: payload.type,
    size_bytes: payload.bytes.byteLength,
    title: original,
    folder,
    visibility,
    sha256: hash,
    status: "pending",
    usage_note: `Legacy import: ${path}`,
    uploaded_from: "legacy-import",
  }).select("*").single();
  if (error) throw error;

  const objectKey = `${safe(folder)}/${code(asset.asset_no)}/${safe(original)}`;
  const pub = visibility === "public" ? publicUrl(objectKey) : null;
  const b = bucket();
  if (!b) throw new Error("Thiếu R2_BUCKET_NAME.");
  await s3.send(new PutObjectCommand({ Bucket: b, Key: objectKey, Body: payload.bytes, ContentType: payload.type }));
  const { data: ready, error: readyErr } = await admin.from("media_assets").update({ object_key: objectKey, public_url: pub, status: "ready" }).eq("id", asset.id).select("*").single();
  if (readyErr) throw readyErr;
  return { ...ready, asset_code: code(ready.asset_no), duplicate: false };
}

async function preview() {
  const [software, cv, resources, accounts] = await Promise.all([
    fetchJson("public/content/software.json"),
    fetchJson("public/content/cv/profile.json"),
    fetchJson("public/content/access/resources.json"),
    fetchJson("public/content/access/accounts.json"),
  ]);
  const icons = [...new Set((software || []).map((x: any) => String(x.icon || "")).filter(Boolean))];
  return {
    source: REPO,
    software: { items: software.length, icons: icons.length, categories: [...new Set(software.map((x: any) => x.category))] },
    cv: { profiles: cv?.name ? 1 : 0, jobs: cv?.jobs?.vi?.length || 0, certificates: cv?.certificates?.vi?.length || 0, skills: cv?.skills?.vi?.length || 0 },
    data: { resources: resources?.resources?.length || 0, categories: [...new Set((resources?.resources || []).map((x: any) => x.category))] },
    legacyAccounts: { count: accounts?.accounts?.length || 0, action: "SKIP_PASSWORDS" },
    mediaToR2: icons.length + 7,
    staysInGit: ["app/", "components/", "lib/", "styles/", "scripts/", "public/tool-modules/**", "vendor libraries", "Next/Vite/Supabase function code"],
  };
}

async function importSoftware(admin: any, s3: S3Client, report: any) {
  const software = await fetchJson("public/content/software.json");
  const categoryNames: Record<string, [string, string]> = {
    engineering: ["Kỹ thuật", "Engineering"], office: ["Văn phòng", "Office"], utility: ["Tiện ích", "Utilities"], media: ["Đa phương tiện", "Media"],
  };
  const categoryIds = new Map<string, string>();
  let order = 1;
  for (const slug of [...new Set(software.map((x: any) => String(x.category || "utility")))]) {
    const names = categoryNames[slug] || [slug, slug];
    const { data, error } = await admin.from("software_categories").upsert({ slug, name_vi: names[0], name_en: names[1], visible: true, sort_order: order++ }, { onConflict: "slug" }).select("id,slug").single();
    if (error) throw error;
    categoryIds.set(slug, data.id);
  }

  let imported = 0, iconCount = 0, duplicates = 0;
  for (let i = 0; i < software.length; i++) {
    const item: any = software[i];
    let iconMedia: any = null;
    if (item.icon) {
      const iconPath = `public${String(item.icon).startsWith("/") ? item.icon : `/${item.icon}`}`;
      iconMedia = await uploadMedia(admin, s3, iconPath, "legacy/software-icons", "public", true);
      if (iconMedia) { iconCount++; if (iconMedia.duplicate) duplicates++; }
    }
    const slug = String(item.id || `legacy-software-${i + 1}`);
    const row = {
      name: String(item.name || slug), slug,
      category_id: categoryIds.get(String(item.category || "utility")) || null,
      description_vi: String(item.description || ""), description_en: "",
      icon_media_id: iconMedia?.id || null, icon_url: iconMedia?.public_url || null,
      download_source: "link", download_url: String(item.url || ""), download_media_id: null,
      download_access: "public", price_label_vi: String(item.price || ""), price_label_en: String(item.price || ""),
      visible: true, featured: false, sort_order: i + 1,
    };
    const { error } = await admin.from("software_items").upsert(row, { onConflict: "slug" });
    if (error) throw error;
    imported++;
  }
  report.software = { imported, icons: iconCount, mediaDuplicates: duplicates, downloadFilesCopiedToR2: 0, note: "Link tải cũ được giữ dạng external link; không tải installer lớn vào R2." };
}

async function importCv(admin: any, s3: S3Client, report: any) {
  const cv: any = await fetchJson("public/content/cv/profile.json");
  const photo = await uploadMedia(admin, s3, "public/profile.jpg", "legacy/cv", "public", true);
  let pdf = await uploadMedia(admin, s3, "public/content/cv/current.pdf", "legacy/cv", "public", true);
  if (!pdf) pdf = await uploadMedia(admin, s3, "public/cv-nguyen-le-khanh-hoa.pdf", "legacy/cv", "public", true);

  const { data: existing } = await admin.from("cv_profiles").select("id").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const profileRow: any = {
    name: cv.name || "Nguyễn Lê Khánh Hòa",
    role_vi: cv.role?.vi || "", role_en: cv.role?.en || "",
    headline_vi: cv.headline?.vi || "", headline_en: cv.headline?.en || "",
    summary_vi: cv.summary?.vi || "", summary_en: cv.summary?.en || "",
    birth_date: cv.born || null,
    address_vi: cv.address?.vi || "", address_en: cv.address?.en || "",
    phone: cv.phone || null, email: cv.email || null,
    photo_media_id: photo?.id || null, photo_url: photo?.public_url || null,
    pdf_media_id: pdf?.id || null, pdf_url: pdf?.public_url || null, pdf_access: "public",
    published: true,
    theme: { layout: "source-default", accent: "blue", show_photo: true, show_contact: true, show_download_pdf: true },
  };
  let profileId: string;
  if (existing?.id) {
    const { error } = await admin.from("cv_profiles").update(profileRow).eq("id", existing.id); if (error) throw error; profileId = existing.id;
  } else {
    const { data, error } = await admin.from("cv_profiles").insert(profileRow).select("id").single(); if (error) throw error; profileId = data.id;
  }

  await admin.from("cv_sections").delete().eq("profile_id", profileId);
  const rows: any[] = [];
  if (cv.education) rows.push({ profile_id: profileId, section_type: "education", title_vi: cv.education.major?.vi || "", title_en: cv.education.major?.en || "", period: cv.education.period || "", organization: cv.education.school?.vi || "", organization_en: cv.education.school?.en || "", sort_order: 1, visible: true, data: {} });
  (cv.certificates?.vi || []).forEach((x: string, i: number) => rows.push({ profile_id: profileId, section_type: "certificate", title_vi: x, title_en: cv.certificates?.en?.[i] || x, sort_order: rows.length + 1, visible: true, data: {} }));
  (cv.jobs?.vi || []).forEach((x: any, i: number) => {
    const en = cv.jobs?.en?.[i] || {};
    rows.push({ profile_id: profileId, section_type: "experience", title_vi: x.role || "", title_en: en.role || x.role || "", period: x.time || "", organization: x.company || "", organization_en: en.company || x.company || "", description_vi: x.description || "", description_en: en.description || x.description || "", sort_order: rows.length + 1, visible: true, data: {} });
  });
  (cv.skills?.vi || []).forEach((x: string, i: number) => rows.push({ profile_id: profileId, section_type: "skill", title_vi: x, title_en: cv.skills?.en?.[i] || x, sort_order: rows.length + 1, visible: true, data: {} }));
  if (rows.length) { const { error } = await admin.from("cv_sections").insert(rows); if (error) throw error; }
  report.cv = { profile: 1, sections: rows.length, photoR2: photo?.asset_code || null, pdfR2: pdf?.asset_code || null };
}

async function importData(admin: any, report: any) {
  const legacy: any = await fetchJson("public/content/access/resources.json");
  const resources = legacy.resources || [];
  const categories = [...new Set(resources.map((x: any) => String(x.category || "Tài liệu")))];
  const groupIds = new Map<string, string>();
  for (let i = 0; i < categories.length; i++) {
    const name = categories[i]; const slug = slugify(name);
    const { data, error } = await admin.from("data_collections").upsert({ slug, name_vi: name, name_en: "", visibility: "private", visible: true, sort_order: i + 1 }, { onConflict: "slug" }).select("id").single();
    if (error) throw error; groupIds.set(name, data.id);
  }
  for (let i = 0; i < resources.length; i++) {
    const x: any = resources[i];
    const meta = { legacy_id: x.id, source_repo: REPO };
    const { data: existing } = await admin.from("data_items").select("id").contains("metadata", { legacy_id: x.id }).maybeSingle();
    const row = { collection_id: groupIds.get(String(x.category || "Tài liệu")) || null, title_vi: x.title || x.id, title_en: "", description_vi: x.description || "", description_en: "", item_type: "link", storage_mode: "link", external_url: x.url || null, media_id: null, object_key: null, visibility: "private", visible: true, sort_order: i + 1, metadata: meta };
    if (existing?.id) await admin.from("data_items").update(row).eq("id", existing.id); else await admin.from("data_items").insert(row);
  }
  report.data = { resources: resources.length, collections: categories.length, accessGrants: 0, note: "Không nhập account/password cũ; quyền gán lại bằng Supabase Auth trong Admin." };
}

async function importBrandMedia(admin: any, s3: S3Client, report: any) {
  const files = ["public/favicon.png", "public/favicon.svg", "public/koha-logo.png", "public/koha-mark.png", "public/cv-preview.webp"];
  const assets: any[] = [];
  for (const path of files) {
    const a = await uploadMedia(admin, s3, path, "legacy/brand", "public", true);
    if (a) assets.push({ file: path, mediaId: a.id, asset: a.asset_code, publicUrl: a.public_url || null });
  }
  // Chỉ gắn favicon tự động khi R2 đã có public delivery URL; nếu bucket private thì giữ asset trong thư viện để không làm hỏng head HTML.
  const fav = assets.find(x => x.file === "public/favicon.png" && x.publicUrl);
  if (fav) await admin.from("site_settings").update({ favicon_media_id: fav.mediaId, favicon_url: fav.publicUrl });
  report.brandMedia = assets;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Chỉ hỗ trợ POST." }, 405);
  try {
    const ctx = await caller(req);
    const owner = ctx?.profile?.status === "active" && (ctx.permissions?.includes("*") || (hasPermission(ctx, "site.manage") && hasPermission(ctx, "media.manage")));
    if (!owner) return json(req, { error: "Chỉ Owner/quản trị có quyền nhập dữ liệu legacy." }, 403);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "preview");
    if (action === "preview") return json(req, { ok: true, preview: await preview() });
    if (action !== "run") return json(req, { error: "Action không hợp lệ." }, 400);

    const admin = adminClient(), s3 = r2();
    const report: any = { source: REPO, startedAt: new Date().toISOString(), warnings: [], skipped: { legacyAccounts: "Không nhập mật khẩu plaintext từ accounts.json.", toolCode: "Tool HTML/CSS/JS/vendor vẫn ở Git/source." } };
    if (body.software !== false) await importSoftware(admin, s3, report);
    if (body.cv !== false) await importCv(admin, s3, report);
    if (body.data !== false) await importData(admin, report);
    if (body.brandMedia !== false) await importBrandMedia(admin, s3, report);
    report.finishedAt = new Date().toISOString();
    await admin.from("legacy_import_runs").insert({ status: "completed", report, created_by: ctx.user?.id || null });
    return json(req, { ok: true, report });
  } catch (e) {
    return json(req, { error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
