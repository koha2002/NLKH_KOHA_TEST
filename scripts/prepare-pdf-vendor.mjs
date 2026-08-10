import fs from "node:fs";
import path from "node:path";

const candidates = [
  path.resolve("node_modules/pdf-lib/dist/pdf-lib.min.js"),
  path.resolve("node_modules/pdf-lib/dist/pdf-lib.js"),
];
const src = candidates.find(fs.existsSync);
if (!src) {
  console.warn("[PDF Offline] Chưa tìm thấy pdf-lib. Hãy chạy npm install trước.");
  process.exit(0);
}
const dir = path.resolve("public/tool-modules/pdf/vendor");
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(src, path.join(dir, "pdf-lib.min.js"));
console.log("[PDF Offline] Đã chuẩn bị public/tool-modules/pdf/vendor/pdf-lib.min.js");
