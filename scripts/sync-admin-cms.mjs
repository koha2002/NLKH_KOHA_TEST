import fs from "node:fs";
import path from "node:path";

// Node chạy predev/prebuild trước Next.js, nên tự nạp .env.local để CMS sync dùng cùng cấu hình với frontend.
for (const envFile of [".env.local", ".env"]) {
  try { process.loadEnvFile(envFile); break; } catch {}
}

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const strict = process.env.NLKH_CMS_SYNC_REQUIRED === "true";
const out = (p) => path.resolve(p);

function write(rel, data) {
  const p = out(rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n", "utf8");
}
function q(v){ return JSON.stringify(v ?? null); }
function ts(value){ return JSON.stringify(value, null, 2); }
async function rest(table, query="") {
  const r = await fetch(`${URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error(`${table}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}
async function rpc(name, body={}) {
  const r = await fetch(`${URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`rpc/${name}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}
async function edge(name, body={}) {
  const r = await fetch(`${URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data={}; try{data=text?JSON.parse(text):{}}catch{data={message:text}}
  if (!r.ok) throw new Error(`functions/${name}: HTTP ${r.status} ${data.error||data.message||text}`);
  return data;
}
function safeSlug(s="") { return String(s).toLowerCase().trim().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,""); }
function cleanInlineHtml(raw="") {
  let html = String(raw || "").trim();
  if (!html) return "";
  // Trình duyệt/AdGuard có thể chèn script local.adguard.org khi copy HTML từ tab ChatGPT.
  // Những script này chỉ hợp lệ trên máy người copy và làm tool deploy/preview lỗi hoặc trắng.
  html = html.replace(/<script\b[^>]*\bsrc=["\'](?:https?:)?\/\/local\.adguard\.org[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script\b[^>]*\bsrc=["\']https?:\/\/local\.adguard\.org[^>]*>[\s\S]*?<\/script>/gi, "");
  return html.trim();
}
function phoneHref(s=""){ return String(s||"").replace(/(?!^\+)\D/g, ""); }

if (!URL || !KEY) {
  console.warn("[CMS] Thiếu NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY; giữ dữ liệu source hiện tại.");
  process.exit(0);
}

try {
  const [settingsRows, nav, social, tools, rings, cvProfiles, cvSections, software, news, newsCategories, pages, contentRoutes, seo, redirects] = await Promise.all([
    rest("site_settings", "select=*&limit=1"),
    rest("navigation_items", "select=*&visible=eq.true&order=sort_order.asc"),
    rest("social_links", "select=*&visible=eq.true&order=sort_order.asc"),
    rest("tools", "select=*&visible=eq.true&order=sort_order.asc"),
    rest("orbit_rings", "select=*&visible=eq.true&order=sort_order.asc"),
    rest("cv_profiles", "select=*&published=eq.true&order=updated_at.desc&limit=1"),
    rest("cv_sections", "select=*&visible=eq.true&order=sort_order.asc"),
    rest("software_items", "select=*&visible=eq.true&order=sort_order.asc"),
    rest("news_articles", "select=*&status=eq.published&order=published_at.desc,created_at.desc"),
    rest("news_categories", "select=*&visible=eq.true&order=sort_order.asc"),
    rest("content_pages", "select=*&status=eq.published&order=published_at.desc"),
    rpc("list_content_page_routes"),
    rest("seo_entries", "select=*&order=route.asc"),
    rest("redirects", "select=*&active=eq.true&order=source_path.asc"),
  ]);
  const site = settingsRows[0] || {};
  // Favicon R2 được lấy thành file static khi Publish/build. Không cần public cả bucket.
  if (site.favicon_media_id) {
    try {
      const assets = await rest("media_assets", `select=id,object_key,original_name,mime_type,visibility&id=eq.${encodeURIComponent(site.favicon_media_id)}&limit=1`);
      const asset = assets[0];
      if (asset) {
        const signed = await edge("r2-file", { action:"presign-download", media_id:asset.id, object_key:asset.object_key });
        if (signed?.url) {
          const fr = await fetch(signed.url);
          if (!fr.ok) throw new Error(`R2 favicon HTTP ${fr.status}`);
          const target = out("public/favicon.png");
          fs.mkdirSync(path.dirname(target), { recursive:true });
          fs.writeFileSync(target, Buffer.from(await fr.arrayBuffer()));
          site.favicon_url = "/favicon.png";
          console.log(`[CMS] Favicon R2 -> public/favicon.png (${asset.original_name||asset.id})`);
        }
      }
    } catch (err) {
      console.warn("[CMS] Không lấy được favicon R2; giữ /favicon.png hiện tại:", err?.message||err);
      site.favicon_url = site.favicon_url || "/favicon.png";
    }
  } else {
    site.favicon_url = site.favicon_url || "/favicon.png";
  }
  const cv = cvProfiles[0] || null;
  const sections = cv ? cvSections.filter(x=>x.profile_id===cv.id) : [];

  // Giữ đúng cấu trúc CV source gốc, đồng thời thêm visible/extraSections để Admin có thể ẩn hồ sơ và thêm mục mới.
  if (cv) {
    const educations = sections.filter(x=>x.section_type==="education");
    const education = educations[0] || {};
    const certs = sections.filter(x=>x.section_type==="certificate");
    const skills = sections.filter(x=>x.section_type==="skill");
    const jobs = sections.filter(x=>x.section_type==="experience");
    const extras = sections.filter(x=>!["education","certificate","skill","experience"].includes(x.section_type));
    const profile = {
      visible: true,
      name: cv.name,
      role: { vi: cv.role_vi || "", en: cv.role_en || cv.role_vi || "" },
      headline: { vi: cv.headline_vi || "", en: cv.headline_en || cv.headline_vi || "" },
      summary: { vi: cv.summary_vi || "", en: cv.summary_en || cv.summary_vi || "" },
      born: cv.birth_date || "",
      address: { vi: cv.address_vi || "", en: cv.address_en || cv.address_vi || "" },
      phone: cv.phone || "", phoneHref: phoneHref(cv.phone), email: cv.email || "",
      photo: cv.photo_url || (cv.photo_media_id ? "" : "/profile.jpg"), photoMediaId: cv.photo_media_id || "",
      pdf: (cv.pdf_access || "public") === "public" ? (cv.pdf_url || (cv.pdf_media_id ? "" : "/content/cv/current.pdf")) : "",
      pdfAccess: cv.pdf_access || "public", pdfMediaId: cv.pdf_media_id || "",
      theme: cv.theme || {layout:"source-default",accent:"blue",show_photo:true,show_contact:true,show_download_pdf:true},
      education: {
        period: education.period || "",
        school: { vi: education.organization || "", en: education.organization_en || education.organization || "" },
        major: { vi: education.title_vi || "", en: education.title_en || education.title_vi || "" },
        subtitle: { vi: education.subtitle_vi || "", en: education.subtitle_en || education.subtitle_vi || "" },
      },
      educations: educations.map(x=>({
        id:x.id,
        period:x.period||"",
        school:{vi:x.organization||"",en:x.organization_en||x.organization||""},
        major:{vi:x.title_vi||"",en:x.title_en||x.title_vi||""},
        subtitle:{vi:x.subtitle_vi||"",en:x.subtitle_en||x.subtitle_vi||""},
        description:{vi:x.description_vi||"",en:x.description_en||x.description_vi||""},
        url:x.url||""
      })),
      certificates: { vi: certs.map(x=>x.title_vi), en: certs.map(x=>x.title_en || x.title_vi) },
      certificateItems: certs.map(x=>({
        id:x.id,
        period:x.period||"",
        title:{vi:x.title_vi||"",en:x.title_en||x.title_vi||""},
        subtitle:{vi:x.subtitle_vi||"",en:x.subtitle_en||x.subtitle_vi||""},
        organization:{vi:x.organization||"",en:x.organization_en||x.organization||""},
        description:{vi:x.description_vi||"",en:x.description_en||x.description_vi||""},
        url:x.url||""
      })),
      skills: { vi: skills.map(x=>x.title_vi), en: skills.map(x=>x.title_en || x.title_vi) },
      skillItems: skills.map(x=>({
        id:x.id,
        period:x.period||"",
        title:{vi:x.title_vi||"",en:x.title_en||x.title_vi||""},
        subtitle:{vi:x.subtitle_vi||"",en:x.subtitle_en||x.subtitle_vi||""},
        organization:{vi:x.organization||"",en:x.organization_en||x.organization||""},
        description:{vi:x.description_vi||"",en:x.description_en||x.description_vi||""},
        url:x.url||""
      })),
      jobs: {
        vi: jobs.map(x=>({id:x.id,time:x.period||"",company:x.organization||"",role:x.title_vi||"",subtitle:x.subtitle_vi||"",description:x.description_vi||"",url:x.url||""})),
        en: jobs.map(x=>({id:x.id,time:x.period||"",company:x.organization_en||x.organization||"",role:x.title_en||x.title_vi||"",subtitle:x.subtitle_en||x.subtitle_vi||"",description:x.description_en||x.description_vi||"",url:x.url||""})),
      },
      extraSections: extras.map(x=>({
        id:x.id,type:x.section_type,period:x.period||"",url:x.url||"",
        title:{vi:x.title_vi||"",en:x.title_en||x.title_vi||""},
        subtitle:{vi:x.subtitle_vi||"",en:x.subtitle_en||x.subtitle_vi||""},
        organization:{vi:x.organization||"",en:x.organization_en||x.organization||""},
        description:{vi:x.description_vi||"",en:x.description_en||x.description_vi||""},
        data:x.data||{}
      }))
    };
    write("public/content/cv/profile.json", profile);
  } else {
    // Không giữ lại CV cũ khi Admin tắt “Hiển thị hồ sơ”.
    write("public/content/cv/profile.json", { visible:false });
  }

  // Kho phần mềm KHÔNG được sinh từ file source. Frontend đọc metadata trực tiếp từ Supabase và lấy file/icon qua R2 signed URL.

  const normalizedTools = tools.map(t=>({
    id:t.slug, slug:t.slug, href:t.route||`/tools/${t.slug}`, code:t.code,
    title:{vi:t.title_vi,en:t.title_en||t.title_vi},
    description:{vi:t.description_vi||"",en:t.description_en||t.description_vi||""},
    status:t.status||"ready", icon:t.icon_url||t.icon||"", accent:t.accent||"blue",
    showHome:!!t.show_home, showOrbit:!!t.show_orbit, orbitRing:Number(t.orbit_ring||1), orbitAngle:Number(t.orbit_angle||0),
    requiresAuth:!!t.requires_auth, allowedRoles:t.allowed_roles||[],
    toolType:t.tool_type || (String(t.inline_html||"").trim() ? "html" : "source"),
    hasInlineHtml:(t.tool_type || (String(t.inline_html||"").trim() ? "html" : "source")) === "html" && !!String(t.inline_html||"").trim(),
  }));
  const normalizedRings = rings.map(r=>({id:r.id,size:Number(r.size),duration:Number(r.duration),reverse:!!r.reverse,dashed:!!r.dashed,dotAngle:r.dot_angle,dotTone:r.dot_tone||"blue"}));

  const generated = `// AUTO-GENERATED by scripts/sync-admin-cms.mjs. Không sửa tay file này.\n`+
`export const adminSite = ${ts(site)};\n`+
`export const adminNavigation = ${ts(nav)};\n`+
`export const adminSocial = ${ts(social)};\n`+
`export const adminTools = ${ts(normalizedTools)};\n`+
`export const adminOrbitRings = ${ts(normalizedRings)};\n`+
`export const adminSoftwareItems = ${ts(software)};\n`+
`export const adminNewsArticles = ${ts(news)};\n`+
`export const adminNewsCategories = ${ts(newsCategories)};\n`+
`export const adminContentPages = ${ts(pages)};\n`+
`export const adminContentRoutes = ${ts(contentRoutes)};\n`+
`export const adminSeoEntries = ${ts(seo)};\n`+
`export const adminRedirects = ${ts(redirects)};\n`+
`export const adminCvVisible = ${cv ? "true" : "false"};\n`;
  write("data/admin-generated.ts", generated);

  // _admin là thư mục generate: xóa sạch trước mỗi lần sync để Tool đã xóa trong Admin
  // không để lại file HTML "mồ côi" trên lần deploy kế tiếp.
  const adminToolDir = out("public/tool-modules/_admin");
  fs.rmSync(adminToolDir, { recursive:true, force:true });
  fs.mkdirSync(adminToolDir, { recursive:true });

  // Inline HTML: không ghi đè tool source Git. Nếu có code Admin, tạo module riêng _admin/<slug>.
  for (const t of tools) {
    const type = t.tool_type || (String(t.inline_html||"").trim() ? "html" : "source");
    if (type !== "html") continue;
    const html = cleanInlineHtml(t.inline_html);
    if (!html) continue;
    const slug = safeSlug(t.slug);
    if (!slug) continue;
    write(`public/tool-modules/_admin/${slug}/index.html`, html);
  }

  write("public/content/admin/site.json", site);
  write("public/content/admin/navigation.json", nav);
  write("public/content/admin/social.json", social);
  write("public/content/admin/tools.json", normalizedTools);
  write("public/content/admin/news.json", news);
  write("public/content/admin/seo.json", seo);
  write("public/content/admin/redirects.json", redirects);
  console.log(`[CMS] Đồng bộ ${normalizedTools.length} tools, ${news.length} news. Kho phần mềm đọc trực tiếp Supabase/R2 ở runtime.`);
} catch (e) {
  console.error("[CMS] Đồng bộ thất bại:", e.message);
  if (strict) process.exit(1);
  console.warn("[CMS] Build tiếp tục với dữ liệu source/generate gần nhất.");
}
