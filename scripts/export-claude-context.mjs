// Gom source thành vài file .txt theo chức năng để đưa vào Claude Project.
// Chạy: node scripts/export-claude-context.mjs   (kết quả nằm trong claude-context/)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "claude-context");
const MAX_PART = 160 * 1024;

const git = (...args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });

const tracked = git("ls-files", "-z").split("\0").filter(Boolean).sort();
let commit = "unknown";
let branch = process.env.GITHUB_REF_NAME || "unknown";
try {
  commit = git("rev-parse", "--short", "HEAD").trim();
  if (branch === "unknown") branch = git("rev-parse", "--abbrev-ref", "HEAD").trim();
} catch {}

const TEXT_EXT = /\.(tsx?|jsx?|mjs|cjs|css|scss|html|json|md|sql|ya?ml|toml|ps1)$/i;
const TEXT_NAMES = /(^|\/)(\.env\.example|\.gitignore|\.npmrc|\.nvmrc)$/;

// Không đưa nội dung vào bundle (chỉ liệt kê ở 99_ASSETS.md)
const EXCLUDE = [
  [/(^|\/)package-lock\.json$/, "file lock"],
  [/(^|\/)vendor\//, "thư viện bên thứ ba"],
  [/\.min\.(js|css)$/, "file đã nén"],
  [/^data\/admin-generated\.ts$/, "file sinh tự động từ CMS"],
  [/^public\/content\//, "snapshot nội dung CMS"],
  [/^supabase\/\.temp\//, "file tạm của Supabase CLI"],
];

// Nhóm theo chức năng. Khớp luật đầu tiên.
const GROUPS = [
  ["00_docs", "Tài liệu", /^(README|CHANGELOG)\.md$|^docs\//],
  ["10_frontend", "Website công khai (Next.js: app, components, lib, styles, data)", /^(app|components|lib|styles|data)\//],
  ["20_admin", "Admin (Vite + React)", /^admin\/(src|scripts)\//],
  ["31_tool_pdf", "Tool PDF Studio", /^public\/tool-modules\/pdf\//],
  ["32_tool_quiz", "Tool Quiz", /^public\/tool-modules\/quiz\//],
  ["33_tool_comtrade", "Tool COMTRADE", /^public\/tool-modules\/comtrade\//],
  ["34_tool_removebg", "Tool Remove Background", /^public\/tool-modules\/remove-background\//],
  ["35_tool_shared", "CSS dùng chung của các tool", /^public\/tool-modules\//],
  ["40_supabase_functions", "Supabase Edge Functions (backend)", /^supabase\/functions\//],
  ["41_supabase_migrations", "Supabase migrations (cấu trúc database)", /^supabase\/migrations\//],
  ["50_worker", "Worker thu thập tin công nghệ", /^workers\//],
  [
    "60_build_config",
    "Cấu hình, build, deploy, script",
    /^(package\.json|next\.config\.ts|tsconfig\.json|eslint\.config\.mjs|render\.yaml|serve-static\.mjs|\.env\.example|\.gitignore|\.npmrc|\.nvmrc|R2_CORS\.example\.json|next-env\.d\.ts)$|^admin\/(package\.json|vite\.config\.js|index\.html|\.env\.example)$|^scripts\/|^\.github\/|^supabase\/config\.toml$/,
  ],
  ["90_other", "Khác", /.*/],
];

const FEATURE_MAP = [
  ["Đăng nhập, tài khoản, quên mật khẩu", "app/login, app/account, lib/supabase-browser.ts"],
  ["Đồng bộ nội dung CMS về website", "scripts/sync-admin-cms.mjs -> data/admin-generated.ts"],
  ["Công cụ (iframe) và quyền truy cập tool", "components/AdminToolRoute.tsx, ToolFrame.tsx, lib/auth/tool-access.ts, public/tool-modules"],
  ["Tin tức", "app/news, components/News*, supabase/functions/news-*, workers/technology-news"],
  ["Kho phần mềm", "app/software, admin/src/pages/Software.jsx"],
  ["Hồ sơ CV", "app/cv, admin/src/pages/Cv.jsx"],
  ["Dữ liệu cấp quyền", "app/data, admin/src/pages/Data.jsx, admin/src/components/DataAccessMatrix.jsx"],
  ["Ảnh/tệp (Cloudflare R2)", "supabase/functions/r2-file, admin/src/pages/Media.jsx"],
  ["Sao lưu", "supabase/functions/manual-backup, admin/src/pages/Backup.jsx"],
  ["Redirect (Cloudflare)", "supabase/functions/cloudflare-redirect-sync, admin/src/pages/Redirects.jsx"],
  ["Xuất bản / deploy Render", "supabase/functions/render-deploy, render.yaml"],
  ["Lịch chạy định kỳ", ".github/workflows/supabase-scheduler.yml, supabase/functions/schedule-runner"],
];

function redact(s) {
  return s
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[JWT_REDACTED]")
    .replace(/sb_secret_[A-Za-z0-9_-]{10,}/g, "[SB_SECRET_REDACTED]")
    .replace(
      /((?:secret|token|password|passwd|api[_-]?key|service[_-]?role|access[_-]?key)\w*["']?\s*[:=]\s*)(["'`])[A-Za-z0-9_\-+/=.]{24,}\2/gi,
      "$1$2[REDACTED]$2"
    );
}

const kb = (n) => `${(n / 1024).toFixed(n < 10240 ? 1 : 0)}KB`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const byGroup = new Map(GROUPS.map(([k]) => [k, []]));
const excluded = [];

for (const f of tracked) {
  let st;
  try {
    st = fs.statSync(path.join(ROOT, f));
  } catch {
    continue; // file đã bị xóa khỏi working tree
  }
  if (!st.isFile()) continue;

  const ex = EXCLUDE.find(([re]) => re.test(f));
  if (ex) { excluded.push({ f, size: st.size, why: ex[1] }); continue; }
  if (!TEXT_EXT.test(f) && !TEXT_NAMES.test(f)) { excluded.push({ f, size: st.size, why: "ảnh/tệp nhị phân" }); continue; }

  const buf = fs.readFileSync(path.join(ROOT, f));
  if (buf.includes(0)) { excluded.push({ f, size: st.size, why: "ảnh/tệp nhị phân" }); continue; }

  const group = GROUPS.find(([, , re]) => re.test(f))[0];
  byGroup.get(group).push({ f, text: redact(buf.toString("utf8")), size: st.size });
}

const summary = [];
for (const [key, title] of GROUPS) {
  const items = byGroup.get(key);
  if (!items.length) continue;
  const parts = [];
  let cur = "";
  const flush = () => {
    if (!cur) return;
    const name = `${key}_${String(parts.length + 1).padStart(2, "0")}.txt`;
    fs.writeFileSync(path.join(OUT, name), cur, "utf8");
    parts.push({ name, bytes: Buffer.byteLength(cur) });
    cur = "";
  };
  for (const it of items) {
    const block = `\n===== FILE: ${it.f} =====\n${it.text.replace(/\s+$/, "")}\n`;
    if (cur && Buffer.byteLength(cur) + Buffer.byteLength(block) > MAX_PART) flush();
    cur += block;
  }
  flush();
  summary.push({ key, title, items, parts });
}

// 00_MANIFEST.md
const total = summary.reduce((s, g) => s + g.parts.reduce((a, p) => a + p.bytes, 0), 0);
let m = `# Claude context — NLKH_KOHA_TEST\n\n`;
m += `- Nhánh: \`${branch}\`, commit: \`${commit}\`, tạo lúc: ${new Date().toISOString()}\n`;
m += `- Tổng nội dung code: ${kb(total)} trong ${summary.reduce((s, g) => s + g.parts.length, 0)} file\n`;
m += `- Chuỗi giống key/secret đã bị che. Ảnh, thư viện bên thứ ba, file sinh tự động chỉ được liệt kê ở \`99_ASSETS.md\`.\n\n`;
m += `## Các nhóm chức năng (mỗi nhóm là một hoặc vài file .txt)\n\n| Nhóm | Mô tả | Số file nguồn | Dung lượng | File |\n|---|---|---|---|---|\n`;
for (const g of summary) {
  const bytes = g.parts.reduce((a, p) => a + p.bytes, 0);
  m += `| ${g.key} | ${g.title} | ${g.items.length} | ${kb(bytes)} | ${g.parts.map((p) => p.name).join(", ")} |\n`;
}
m += `\n## Bản đồ chức năng -> nơi chứa code\n\n`;
for (const [a, b] of FEATURE_MAP) m += `- **${a}**: ${b}\n`;
m += `\n## Danh sách file nguồn (kèm dung lượng)\n\n`;
for (const g of summary) {
  m += `### ${g.key}\n\n`;
  for (const it of g.items) m += `- ${it.f} (${kb(it.size)})\n`;
  m += `\n`;
}
fs.writeFileSync(path.join(OUT, "00_MANIFEST.md"), m, "utf8");

// 99_ASSETS.md
const folderAgg = new Map();
for (const e of excluded) {
  const top = e.f.split("/").slice(0, e.f.startsWith("public/") ? 2 : 1).join("/");
  const k = `${top} | ${e.why}`;
  const v = folderAgg.get(k) || { n: 0, size: 0 };
  v.n += 1; v.size += e.size; folderAgg.set(k, v);
}
let a = `# Tài nguyên và file không đưa nội dung vào context\n\n`;
a += `Gồm ảnh, logo, thư viện bên thứ ba, file khóa, file sinh tự động. Chỉ liệt kê tên và dung lượng.\n\n`;
a += `## Tổng hợp theo thư mục\n\n| Thư mục | Lý do | Số file | Dung lượng |\n|---|---|---|---|\n`;
for (const [k, v] of [...folderAgg].sort((x, y) => y[1].size - x[1].size)) {
  const [folder, why] = k.split(" | ");
  a += `| ${folder} | ${why} | ${v.n} | ${kb(v.size)} |\n`;
}
a += `\n## Toàn bộ danh sách\n\n`;
for (const e of excluded) a += `- ${e.f} (${kb(e.size)}) - ${e.why}\n`;
fs.writeFileSync(path.join(OUT, "99_ASSETS.md"), a, "utf8");

console.log(`Đã tạo ${OUT}`);
for (const g of summary) {
  console.log(`${g.key.padEnd(26)} ${String(g.items.length).padStart(4)} file  ${kb(g.parts.reduce((x, p) => x + p.bytes, 0)).padStart(8)}  -> ${g.parts.length} phần`);
}
console.log(`Tổng: ${kb(total)} | Không đưa nội dung: ${excluded.length} file`);