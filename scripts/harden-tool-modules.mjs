import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public", "tool-modules");
const robotsMeta = '<meta name="robots" content="noindex,nofollow,noarchive">';
const referrerMeta = '<meta name="referrer" content="no-referrer">';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.toLowerCase() === "index.html") out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  if (/<meta\b[^>]*\bname=["']robots["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i, robotsMeta);
  } else if (/<head\b[^>]*>/i.test(html)) {
    html = html.replace(/<head\b[^>]*>/i, (m) => `${m}\n  ${robotsMeta}`);
  }

  if (!/<meta\b[^>]*\bname=["']referrer["'][^>]*>/i.test(html) && /<head\b[^>]*>/i.test(html)) {
    html = html.replace(/<head\b[^>]*>/i, (m) => `${m}\n  ${referrerMeta}`);
  }

  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    changed += 1;
    console.log(`[hardening] noindex -> ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`[hardening] tool module HTML checked: ${walk(root).length}; changed: ${changed}`);
