import fs from "node:fs";
import path from "node:path";

const file=path.resolve("public/tool-modules/pdf/index.html");
if(!fs.existsSync(file)){
  console.warn("[PDF] Không tìm thấy public/tool-modules/pdf/index.html; bỏ qua patch Offline/Online.");
  process.exit(0);
}
let html=fs.readFileSync(file,"utf8");
if(!html.includes("offline-v2.css")){
  html=html.replace("</head>",'  <link rel="stylesheet" href="./offline-v2.css" />\n</head>');
}
if(!html.includes("vendor/pdf-lib.min.js")){
  html=html.replace("</body>",'  <script src="./vendor/pdf-lib.min.js"></script>\n  <script src="./offline-v2.js"></script>\n</body>');
}else if(!html.includes("offline-v2.js")){
  html=html.replace("</body>",'  <script src="./offline-v2.js"></script>\n</body>');
}
fs.writeFileSync(file,html,"utf8");
console.log("[PDF] Đã bảo đảm có lựa chọn Offline/Online; Online giữ nguyên module.js hiện tại.");
