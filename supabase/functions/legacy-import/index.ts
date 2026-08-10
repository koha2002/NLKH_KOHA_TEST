import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { adminClient, caller, hasPermission } from "../_shared/auth.ts";
import { json, corsHeaders } from "../_shared/cors.ts";

const REPO = "koha2002/NLKH_KOHA";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;

function errorText(e: any) {
  if (!e) return "Lỗi không xác định";
  if (e instanceof Error) return e.message || String(e);
  if (typeof e === "string") return e;
  if (typeof e === "object") {
    const parts = [e.message, e.details, e.hint, e.code].filter(Boolean).map(String);
    if (parts.length) return parts.join(" | ");
    try { return JSON.stringify(e); } catch { return String(e); }
  }
  return String(e);
}
function must(error: any, context: string) {
  if (error) throw new Error(`${context}: ${errorText(error)}`);
}
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
  const r = await fetch(RAW + path, { headers: { "User-Agent": "NLKH-Legacy-Importer/4.6.1" } });
  if (!r.ok) throw new Error(`${path}: GitHub HTTP ${r.status}`);
  return r.json();
}
async function fetchBytes(path: string, optional = false) {
  const r = await fetch(RAW + path, { headers: { "User-Agent": "NLKH-Legacy-Importer/4.6.1" } });
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
  const dupeQ = await admin.from("media_assets").select("*").eq("sha256", hash).eq("visibility", visibility).eq("status", "ready").maybeSingle();
  must(dupeQ.error, `Kiểm tra file trùng ${path}`);
  if (dupeQ.data) return { ...dupeQ.data, asset_code: code(dupeQ.data.asset_no), duplicate: true };

  const insertQ = await admin.from("media_assets").insert({
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
  must(insertQ.error, `Tạo media_assets cho ${path}`);
  const asset = insertQ.data;

  const objectKey = `${safe(folder)}/${code(asset.asset_no)}/${safe(original)}`;
  const pub = visibility === "public" ? publicUrl(objectKey) : null;
  const b = bucket();
  if (!b) throw new Error("Thiếu R2_BUCKET_NAME.");
  try {
    await s3.send(new PutObjectCommand({ Bucket: b, Key: objectKey, Body: payload.bytes, ContentType: payload.type }));
  } catch (e) {
    await admin.from("media_assets").update({ status: "failed", usage_note: `Legacy import failed: ${path} | ${errorText(e)}` }).eq("id", asset.id);
    throw new Error(`Upload R2 ${path}: ${errorText(e)}`);
  }
  const readyQ = await admin.from("media_assets").update({ object_key: objectKey, public_url: pub, status: "ready" }).eq("id", asset.id).select("*").single();
  must(readyQ.error, `Hoàn tất media_assets cho ${path}`);
  return { ...readyQ.data, asset_code: code(readyQ.data.asset_no), duplicate: false };
}
async function optionalMedia(admin: any, s3: S3Client, path: string, folder: string, warnings: string[]) {
  try { return await uploadMedia(admin, s3, path, folder, "public", true); }
  catch (e) { warnings.push(errorText(e)); return null; }
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
    const q = await admin.from("software_categories").upsert({ slug, name_vi: names[0], name_en: names[1], visible: true, sort_order: order++ }, { onConflict: "slug" }).select("id,slug").single();
    must(q.error, `Lưu nhóm phần mềm ${slug}`);
    categoryIds.set(slug, q.data.id);
  }

  let imported = 0, iconCount = 0, duplicates = 0, failed = 0;
  const errors: any[] = [];
  for (let i = 0; i < software.length; i++) {
    const item: any = software[i];
    const slug = String(item.id || `legacy-software-${i + 1}`);
    try {
      let iconMedia: any = null;
      if (item.icon) {
        const iconPath = `public${String(item.icon).startsWith("/") ? item.icon : `/${item.icon}`}`;
        try {
          iconMedia = await uploadMedia(admin, s3, iconPath, "legacy/software-icons", "public", true);
          if (iconMedia) { iconCount++; if (iconMedia.duplicate) duplicates++; }
        } catch (e) {
          report.warnings.push(`Icon ${slug}: ${errorText(e)}`);
        }
      }
      const row: any = {
        name: String(item.name || slug), slug,
        category_id: categoryIds.get(String(item.category || "utility")) || null,
        description_vi: String(item.description || ""), description_en: "",
        download_source: "link", download_url: String(item.url || ""), download_media_id: null,
        download_access: "public", price_label_vi: String(item.price || ""), price_label_en: String(item.price || ""),
        visible: true, featured: false, sort_order: i + 1,
      };
      if (iconMedia?.id) { row.icon_media_id = iconMedia.id; row.icon_url = iconMedia.public_url || null; }
      const q = await admin.from("software_items").upsert(row, { onConflict: "slug" });
      must(q.error, `Lưu software ${slug}`);
      imported++;
    } catch (e) {
      failed++;
      errors.push({ slug, name: item.name || slug, error: errorText(e) });
    }
  }
  report.software = { imported, failed, total: software.length, icons: iconCount, mediaDuplicates: duplicates, errors, downloadFilesCopiedToR2: 0, note: "Link tải cũ được giữ dạng external link; không tải installer lớn vào R2." };
  if (failed) report.warnings.push(`Software: ${failed}/${software.length} mục lỗi. Xem report.software.errors.`);
}

async function importCv(admin: any, s3: S3Client, report: any) {
  const cv: any = await fetchJson("public/content/cv/profile.json");
  const mediaWarnings: string[] = [];
  const photo = await optionalMedia(admin, s3, "public/profile.jpg", "legacy/cv", mediaWarnings);
  let pdf = await optionalMedia(admin, s3, "public/content/cv/current.pdf", "legacy/cv", mediaWarnings);
  if (!pdf) pdf = await optionalMedia(admin, s3, "public/cv-nguyen-le-khanh-hoa.pdf", "legacy/cv", mediaWarnings);
  report.warnings.push(...mediaWarnings.map(x => `CV media: ${x}`));

  const existingQ = await admin.from("cv_profiles").select("id,published").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  must(existingQ.error, "Đọc CV hiện tại");
  const existing = existingQ.data;
  const profileRow: any = {
    name: cv.name || "Nguyễn Lê Khánh Hòa",
    role_vi: cv.role?.vi || "", role_en: cv.role?.en || "",
    headline_vi: cv.headline?.vi || "", headline_en: cv.headline?.en || "",
    summary_vi: cv.summary?.vi || "", summary_en: cv.summary?.en || "",
    birth_date: cv.born || null,
    address_vi: cv.address?.vi || "", address_en: cv.address?.en || "",
    phone: cv.phone || null, email: cv.email || null,
    pdf_access: "public", published: true,
    theme: { layout: "source-default", accent: "blue", show_photo: true, show_contact: true, show_download_pdf: true },
  };
  if (photo?.id) { profileRow.photo_media_id = photo.id; profileRow.photo_url = photo.public_url || null; }
  if (pdf?.id) { profileRow.pdf_media_id = pdf.id; profileRow.pdf_url = pdf.public_url || null; }
  let profileId: string;
  if (existing?.id) {
    const off = await admin.from("cv_profiles").update({ published: false }).neq("id", existing.id).eq("published", true); must(off.error, "Tắt CV published khác");
    const q = await admin.from("cv_profiles").update(profileRow).eq("id", existing.id); must(q.error, "Cập nhật CV legacy"); profileId = existing.id;
  } else {
    const off = await admin.from("cv_profiles").update({ published: false }).eq("published", true); must(off.error, "Tắt CV published cũ");
    const q = await admin.from("cv_profiles").insert(profileRow).select("id").single(); must(q.error, "Tạo CV legacy"); profileId = q.data.id;
  }

  const del = await admin.from("cv_sections").delete().eq("profile_id", profileId); must(del.error, "Xóa section CV cũ");

  // PostgREST bulk insert can turn keys omitted from some objects into NULL for the
  // whole INSERT column set. cv_sections has several NOT NULL text columns, so every
  // legacy section is normalized to a complete row instead of relying on DB defaults.
  const cvSection = (input: any) => ({
    profile_id: profileId,
    section_type: String(input.section_type || "custom"),
    title_vi: String(input.title_vi || ""),
    title_en: String(input.title_en || ""),
    subtitle_vi: String(input.subtitle_vi || ""),
    subtitle_en: String(input.subtitle_en || ""),
    period: String(input.period || ""),
    description_vi: String(input.description_vi || ""),
    description_en: String(input.description_en || ""),
    organization: String(input.organization || ""),
    organization_en: String(input.organization_en || ""),
    url: input.url ? String(input.url) : null,
    sort_order: Number(input.sort_order || 0),
    visible: input.visible !== false,
    data: input.data && typeof input.data === "object" ? input.data : {},
  });

  const rows: any[] = [];
  if (cv.education) rows.push(cvSection({
    section_type: "education",
    title_vi: cv.education.major?.vi || "",
    title_en: cv.education.major?.en || "",
    period: cv.education.period || "",
    organization: cv.education.school?.vi || "",
    organization_en: cv.education.school?.en || "",
    sort_order: 1,
  }));
  (cv.certificates?.vi || []).forEach((x: string, i: number) => rows.push(cvSection({
    section_type: "certificate",
    title_vi: x,
    title_en: cv.certificates?.en?.[i] || x,
    sort_order: rows.length + 1,
  })));
  (cv.jobs?.vi || []).forEach((x: any, i: number) => {
    const en = cv.jobs?.en?.[i] || {};
    rows.push(cvSection({
      section_type: "experience",
      title_vi: x.role || "",
      title_en: en.role || x.role || "",
      period: x.time || "",
      organization: x.company || "",
      organization_en: en.company || x.company || "",
      description_vi: x.description || "",
      description_en: en.description || x.description || "",
      sort_order: rows.length + 1,
    }));
  });
  (cv.skills?.vi || []).forEach((x: string, i: number) => rows.push(cvSection({
    section_type: "skill",
    title_vi: x,
    title_en: cv.skills?.en?.[i] || x,
    sort_order: rows.length + 1,
  })));
  if (rows.length) { const q = await admin.from("cv_sections").insert(rows); must(q.error, "Lưu section CV legacy"); }
  report.cv = { profile: 1, sections: rows.length, photoR2: photo?.asset_code || null, pdfR2: pdf?.asset_code || null, mediaWarnings };
}

async function importData(admin: any, report: any) {
  const legacy: any = await fetchJson("public/content/access/resources.json");
  const resources = legacy.resources || [];
  const categories = [...new Set(resources.map((x: any) => String(x.category || "Tài liệu")))];
  const groupIds = new Map<string, string>();
  for (let i = 0; i < categories.length; i++) {
    const name = categories[i]; const slug = slugify(name);
    const q = await admin.from("data_collections").upsert({ slug, name_vi: name, name_en: "", visibility: "private", visible: true, sort_order: i + 1 }, { onConflict: "slug" }).select("id").single();
    must(q.error, `Lưu nhóm dữ liệu ${name}`); groupIds.set(name, q.data.id);
  }
  let imported = 0, failed = 0; const errors: any[] = [];
  for (let i = 0; i < resources.length; i++) {
    const x: any = resources[i];
    try {
      const meta = { legacy_id: x.id, source_repo: REPO };
      const findQ = await admin.from("data_items").select("id").contains("metadata", { legacy_id: x.id }).maybeSingle(); must(findQ.error, `Tìm data ${x.id}`);
      const row = { collection_id: groupIds.get(String(x.category || "Tài liệu")) || null, title_vi: x.title || x.id, title_en: "", description_vi: x.description || "", description_en: "", item_type: "link", storage_mode: "link", external_url: x.url || null, media_id: null, object_key: null, visibility: "private", visible: true, sort_order: i + 1, metadata: meta };
      const q = findQ.data?.id ? await admin.from("data_items").update(row).eq("id", findQ.data.id) : await admin.from("data_items").insert(row);
      must(q.error, `Lưu data ${x.id}`); imported++;
    } catch (e) { failed++; errors.push({ id: x.id, error: errorText(e) }); }
  }
  report.data = { imported, failed, resources: resources.length, collections: categories.length, errors, accessGrants: 0, note: "Không nhập account/password cũ; quyền gán lại bằng Supabase Auth trong Admin." };
  if (failed) report.warnings.push(`Data: ${failed}/${resources.length} mục lỗi.`);
}

async function importBrandMedia(admin: any, s3: S3Client, report: any) {
  const files = ["public/favicon.png", "public/favicon.svg", "public/koha-logo.png", "public/koha-mark.png", "public/cv-preview.webp"];
  const assets: any[] = [], errors: any[] = [];
  for (const path of files) {
    try {
      const a = await uploadMedia(admin, s3, path, "legacy/brand", "public", true);
      if (a) assets.push({ file: path, mediaId: a.id, asset: a.asset_code, publicUrl: a.public_url || null });
    } catch (e) { errors.push({ file: path, error: errorText(e) }); }
  }
  const fav = assets.find(x => x.file === "public/favicon.png" && x.publicUrl);
  if (fav) { const q = await admin.from("site_settings").update({ favicon_media_id: fav.mediaId, favicon_url: fav.publicUrl }); if (q.error) errors.push({ file: "site_settings/favicon", error: errorText(q.error) }); }
  report.brandMedia = { assets, errors };
  if (errors.length) report.warnings.push(`Brand media: ${errors.length} mục lỗi/không cập nhật.`);
}

async function counts(admin: any) {
  const result: any = {};
  for (const table of ["software_items", "media_assets", "data_items", "cv_profiles"]) {
    const q = await admin.from(table).select("id", { count: "exact", head: true });
    result[table] = q.error ? { error: errorText(q.error) } : q.count;
  }
  return result;
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
    const report: any = { source: REPO, version: "4.6.1", startedAt: new Date().toISOString(), status: "running", warnings: [], stages: {}, skipped: { legacyAccounts: "Không nhập mật khẩu plaintext từ accounts.json.", toolCode: "Tool HTML/CSS/JS/vendor vẫn ở Git/source." } };
    let successStages = 0, failedStages = 0;
    async function stage(name: string, enabled: boolean, fn: () => Promise<void>) {
      if (!enabled) { report.stages[name] = { status: "skipped" }; return; }
      try { await fn(); report.stages[name] = { status: "completed" }; successStages++; }
      catch (e) { const message = errorText(e); report.stages[name] = { status: "failed", error: message }; report.warnings.push(`${name}: ${message}`); failedStages++; }
    }
    await stage("software", body.software !== false, () => importSoftware(admin, s3, report));
    await stage("cv", body.cv !== false, () => importCv(admin, s3, report));
    await stage("data", body.data !== false, () => importData(admin, report));
    await stage("brandMedia", body.brandMedia !== false, () => importBrandMedia(admin, s3, report));
    report.finishedAt = new Date().toISOString();
    report.status = failedStages === 0 ? "completed" : successStages > 0 ? "partial" : "failed";
    report.databaseCounts = await counts(admin);
    const logQ = await admin.from("legacy_import_runs").insert({ status: report.status, report, created_by: ctx.user?.id || null });
    if (logQ.error) report.warnings.push(`Không ghi được legacy_import_runs: ${errorText(logQ.error)}`);
    return json(req, { ok: report.status !== "failed", report });
  } catch (e) {
    return json(req, { error: errorText(e), details: typeof e === "object" ? e : undefined }, 500);
  }
});
