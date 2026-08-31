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
// pdf-lib is intentionally lazy. Never re-inject the heavy vendor bundle
// into initial HTML during predev/prebuild.
html=html.replace(
  /\s*<script\b[^>]*src=["']\.\/vendor\/pdf-lib\.min\.js["'][^>]*><\/script>\s*/gi,
  "\n"
);

const lazyTag='  <script src="./pdf-lib-lazy-v33.js"></script>';
const offlineTag='  <script src="./offline-v2.js"></script>';

if(!html.includes("pdf-lib-lazy-v33.js")){
  if(html.includes(offlineTag)){
    html=html.replace(offlineTag,lazyTag+"\n"+offlineTag);
  }else{
    html=html.replace("</body>",lazyTag+"\n</body>");
  }
}

if(!html.includes("offline-v2.js")){
  html=html.replace("</body>",offlineTag+"\n</body>");
}

fs.writeFileSync(file,html,"utf8");
console.log("[PDF] Offline/Online ready; pdf-lib remains lazy and loads only when needed.");
