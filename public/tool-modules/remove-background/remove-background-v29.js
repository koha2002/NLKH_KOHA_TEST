// ===== NLKH V2.5 I18N START =====
const I18N = {
  vi: {
    title: "REMOVE BACKGROUND & ID PHOTO",
    subtitle: "Tách nền ngay trên thiết bị, sửa vùng xóa lẹm/còn dư, thay nền và xuất ảnh thẻ.",
    privacy: "Ảnh không upload để xử lý",
    open: "Mở ảnh",
    remove: "Tách nền",
    refine: "Chỉnh viền",
    finishRefine: "Xong chỉnh viền",
    reset: "Làm lại",
    downloadTransparent: "Tải PNG trong suốt",
    export: "Xuất ảnh",
    statusHeading: "TRẠNG THÁI",
    refineHeading: "SỬA SAU TÁCH NỀN",
    refineHelp: "AI xóa <b>còn dư nền</b>: dùng <b>Xóa dư</b>. AI xóa <b>lẹm tóc/người/quần áo</b>: dùng <b>Khôi phục</b>.",
    erase: "Xóa dư",
    restore: "Khôi phục",
    brushSize: "Cỡ cọ:",
    softness: "Độ mềm:",
    refineZoom: "Zoom sửa:",
    undo: "↶ Undo",
    redo: "↷ Redo",
    eraseLegend: "Xóa dư nền",
    restoreLegend: "Khôi phục phần bị lẹm",
    shortcut: "Ctrl+Z: Undo • Ctrl+Y / Ctrl+Shift+Z: Redo",
    bgHeading: "THAY NỀN",
    transparent: "Trong suốt",
    white: "Trắng",
    lightblue: "Xanh nhạt",
    passportblue: "Xanh passport",
    red: "Đỏ",
    customColor: "Màu tùy chọn",
    useColor: "Dùng màu",
    customBg: "Ảnh nền riêng",
    chooseBg: "Chọn ảnh nền",
    removeBgImage: "Bỏ ảnh nền",
    idHeading: "ẢNH THẺ / HỒ SƠ",
    exportSize: "Cỡ xuất",
    original: "Giữ kích thước gốc",
    size2x3: "2 × 3 cm — 236 × 354 px",
    size3x4: "3 × 4 cm — 354 × 472 px",
    size35x45: "3.5 × 4.5 cm — 413 × 531 px",
    size4x6: "4 × 6 cm — 472 × 709 px",
    size5x5: "5 × 5 cm — 591 × 591 px",
    size2x2: "2 × 2 inch — 600 × 600 px",
    scale: "Phóng / thu người:",
    moveX: "Dịch ngang:",
    moveY: "Dịch dọc:",
    resetAdjust: "Reset căn chỉnh",
    format: "Định dạng",
    idHint: "Preset quy đổi gần 300 DPI. Từng cổng nộp hồ sơ có thể yêu cầu kích thước/dung lượng khác nhau.",
    source: "ẢNH GỐC",
    result: "KẾT QUẢ",
    notReady: "Chưa có ảnh",
    notProcessed: "Chưa xử lý",
    footer: "Tool tự đồng bộ Sáng/Tối và VI/EN với website. Ảnh được xử lý trên CPU/GPU của thiết bị người dùng.",
    sourceMeta: "Ảnh gốc",
    resultMeta: "Kết quả",
    processingMeta: "Xử lý",
    exportMeta: "Xuất",
    ready: "Sẵn sàng.",
    loaded: "Ảnh đã nạp. Bấm <b>Tách nền</b>.",
    imageReady: "Ảnh sẵn sàng.",
    preparingAI: "Chuẩn bị AI...",
    downloadingEngine: "Đang tải AI engine...",
    gpuReady: "WebGPU có sẵn • chờ ảnh",
    cpuReady: "Không có WebGPU • sẽ dùng CPU",
    engineGpuReady: "AI engine sẵn sàng • ưu tiên GPU",
    engineCpuReady: "AI engine sẵn sàng • CPU",
    engineOnUse: "AI sẽ tải khi xử lý ảnh",
    runningGpu: "Đang chạy WebGPU...",
    gpuFallback: "GPU lỗi • chuyển CPU",
    runningCpu: "Đang chạy CPU/WASM...",
    processingFirst: "Đang tách nền. Lần đầu có thể lâu hơn vì trình duyệt tải/khởi tạo model.",
    completed: "Hoàn tất tách nền.",
    resultReady: "Tách nền xong. Nếu còn dư hoặc bị xóa lẹm, bấm <b>Chỉnh viền</b> trước khi thay nền/xuất ảnh.",
    errorProcessing: "Lỗi xử lý.",
    refineStatus: "Dùng <b>Xóa dư</b> hoặc <b>Khôi phục</b>. Có thể Undo/Redo và zoom để sửa tóc/viền chi tiết.",
    refineDone: "Đã lưu chỉnh viền. Có thể thay nền, căn ảnh thẻ hoặc xuất ảnh.",
    manualAlpha: "Sửa alpha thủ công",
    fitSubject: "Fit chủ thể",
    selectImageError: "Vui lòng chọn file ảnh.",
    exportError: "Không tạo được ảnh xuất."
  },
  en: {
    title: "REMOVE BACKGROUND & ID PHOTO",
    subtitle: "Remove backgrounds on-device, fix over/under-erased areas, replace backgrounds, and export ID photos.",
    privacy: "Images are processed locally",
    open: "Open image",
    remove: "Remove background",
    refine: "Refine edges",
    finishRefine: "Finish refining",
    reset: "Reset",
    downloadTransparent: "Download transparent PNG",
    export: "Export image",
    statusHeading: "STATUS",
    refineHeading: "REFINE AFTER REMOVAL",
    refineHelp: "If AI <b>left background behind</b>, use <b>Erase</b>. If AI <b>removed hair/person/clothing</b>, use <b>Restore</b>.",
    erase: "Erase",
    restore: "Restore",
    brushSize: "Brush size:",
    softness: "Softness:",
    refineZoom: "Refine zoom:",
    undo: "↶ Undo",
    redo: "↷ Redo",
    eraseLegend: "Erase leftover background",
    restoreLegend: "Restore over-erased areas",
    shortcut: "Ctrl+Z: Undo • Ctrl+Y / Ctrl+Shift+Z: Redo",
    bgHeading: "REPLACE BACKGROUND",
    transparent: "Transparent",
    white: "White",
    lightblue: "Light blue",
    passportblue: "Passport blue",
    red: "Red",
    customColor: "Custom color",
    useColor: "Use color",
    customBg: "Custom background image",
    chooseBg: "Choose background",
    removeBgImage: "Remove background image",
    idHeading: "ID / PROFILE PHOTO",
    exportSize: "Export size",
    original: "Keep original size",
    size2x3: "2 × 3 cm — 236 × 354 px",
    size3x4: "3 × 4 cm — 354 × 472 px",
    size35x45: "3.5 × 4.5 cm — 413 × 531 px",
    size4x6: "4 × 6 cm — 472 × 709 px",
    size5x5: "5 × 5 cm — 591 × 591 px",
    size2x2: "2 × 2 inch — 600 × 600 px",
    scale: "Subject scale:",
    moveX: "Move horizontally:",
    moveY: "Move vertically:",
    resetAdjust: "Reset alignment",
    format: "Format",
    idHint: "Presets are approximately 300 DPI. Each application portal may require different dimensions/file sizes.",
    source: "ORIGINAL",
    result: "RESULT",
    notReady: "No image",
    notProcessed: "Not processed",
    footer: "The tool syncs Light/Dark and VI/EN with the website. Images are processed on the user's CPU/GPU.",
    sourceMeta: "Original",
    resultMeta: "Result",
    processingMeta: "Processing",
    exportMeta: "Export",
    ready: "Ready.",
    loaded: "Image loaded. Click <b>Remove background</b>.",
    imageReady: "Image ready.",
    preparingAI: "Preparing AI...",
    downloadingEngine: "Loading AI engine...",
    gpuReady: "WebGPU available • waiting for image",
    cpuReady: "WebGPU unavailable • CPU will be used",
    engineGpuReady: "AI engine ready • GPU preferred",
    engineCpuReady: "AI engine ready • CPU",
    engineOnUse: "AI will load on first use",
    runningGpu: "Running WebGPU...",
    gpuFallback: "GPU failed • switching to CPU",
    runningCpu: "Running CPU/WASM...",
    processingFirst: "Removing background. The first run may take longer while the browser loads/initializes the model.",
    completed: "Background removal complete.",
    resultReady: "Background removed. If anything is left or over-erased, click <b>Refine edges</b> before replacing the background/exporting.",
    errorProcessing: "Processing error.",
    refineStatus: "Use <b>Erase</b> or <b>Restore</b>. You can Undo/Redo and zoom in for detailed hair/edge corrections.",
    refineDone: "Edge refinements saved. You can replace the background, align an ID photo, or export.",
    manualAlpha: "Manual alpha refinement",
    fitSubject: "Fit subject",
    selectImageError: "Please select an image file.",
    exportError: "Could not create the exported image."
  }
};

let currentLang = "vi";

function txt(key){
  return I18N[currentLang]?.[key] ?? I18N.vi[key] ?? key;
}

const knownPhrasePairs = [
  ["Ảnh đã nạp. Bấm <b>Tách nền</b>.", "Image loaded. Click <b>Remove background</b>."],
  ["Đang tách nền. Lần đầu có thể lâu hơn vì trình duyệt tải/khởi tạo model.", "Removing background. The first run may take longer while the browser loads/initializes the model."],
  ["Tách nền xong. Nếu còn dư hoặc bị xóa lẹm, bấm <b>Chỉnh viền</b> trước khi thay nền/xuất ảnh.", "Background removed. If anything is left or over-erased, click <b>Refine edges</b> before replacing the background/exporting."],
  ["Dùng <b>Xóa dư</b> hoặc <b>Khôi phục</b>. Có thể Undo/Redo và zoom để sửa tóc/viền chi tiết.", "Use <b>Erase</b> or <b>Restore</b>. You can Undo/Redo and zoom in for detailed hair/edge corrections."],
  ["Đã lưu chỉnh viền. Có thể thay nền, căn ảnh thẻ hoặc xuất ảnh.", "Edge refinements saved. You can replace the background, align an ID photo, or export."],
  ["Hoàn tất tách nền.", "Background removal complete."],
  ["Ảnh sẵn sàng.", "Image ready."],
  ["Chuẩn bị AI...", "Preparing AI..."],
  ["Đang tải AI engine...", "Loading AI engine..."],
  ["WebGPU có sẵn • chờ ảnh", "WebGPU available • waiting for image"],
  ["Không có WebGPU • sẽ dùng CPU", "WebGPU unavailable • CPU will be used"],
  ["AI engine sẵn sàng • ưu tiên GPU", "AI engine ready • GPU preferred"],
  ["AI engine sẵn sàng • CPU", "AI engine ready • CPU"],
  ["AI sẽ tải khi xử lý ảnh", "AI will load on first use"],
  ["Đang chạy WebGPU...", "Running WebGPU..."],
  ["GPU lỗi • chuyển CPU", "GPU failed • switching to CPU"],
  ["Đang chạy CPU/WASM...", "Running CPU/WASM..."],
  ["Lỗi xử lý.", "Processing error."],
  ["Sửa alpha thủ công", "Manual alpha refinement"],
  ["Fit chủ thể", "Fit subject"],
  ["Chưa có ảnh", "No image"],
  ["Chưa xử lý", "Not processed"],
  ["Sẵn sàng.", "Ready."],
  ["Vui lòng chọn file ảnh.", "Please select an image file."],
  ["Không tạo được ảnh xuất.", "Could not create the exported image."]
].sort((a,b)=>Math.max(b[0].length,b[1].length)-Math.max(a[0].length,a[1].length));

function localizeKnown(value){
  if(value == null) return value;
  let out = String(value);
  for(const [vi,en] of knownPhrasePairs){
    const target = currentLang === "en" ? en : vi;
    out = out.split(vi).join(target).split(en).join(target);
  }

  if(currentLang === "en"){
    out = out.replace(/^Đang tải model:\s*/,"Loading model: ");
    out = out.replace(/^Lỗi:\s*/,"Error: ");
  }else{
    out = out.replace(/^Loading model:\s*/,"Đang tải model: ");
    out = out.replace(/^Error:\s*/,"Lỗi: ");
  }

  return out;
}

function setLeadingText(label, text){
  if(!label) return;
  const n=[...label.childNodes].find(x=>x.nodeType===Node.TEXT_NODE);
  if(n) n.nodeValue = text + " ";
}

function detectSiteLang(){
  let doc=document, win=window;
  try{
    if(parent && parent!==window && parent.document){
      doc=parent.document;
      win=parent;
    }
  }catch{}

  const root=doc.documentElement;
  const candidates=[
    root?.lang,
    root?.getAttribute("data-lang"),
    root?.getAttribute("data-language"),
    root?.getAttribute("data-locale"),
    doc.body?.getAttribute("data-lang"),
    doc.body?.getAttribute("data-language")
  ].filter(Boolean).map(v=>String(v).toLowerCase());

  for(const v of candidates){
    if(v.startsWith("en")) return "en";
    if(v.startsWith("vi")) return "vi";
  }

  try{
    for(const k of ["lang","language","locale","site-lang","site-language","nlkh-lang","nlkh-language"]){
      const v=String(win.localStorage?.getItem(k)||"").toLowerCase().replaceAll('"',"");
      if(v.startsWith("en")) return "en";
      if(v.startsWith("vi")) return "vi";
    }
  }catch{}

  try{
    const active=[...doc.querySelectorAll('[aria-pressed="true"],[aria-current="true"],.active,.selected,[data-active="true"]')];
    for(const node of active){
      const v=(node.textContent||"").trim().toLowerCase();
      if(v==="en" || v==="english") return "en";
      if(v==="vi" || v==="vn" || v==="tiếng việt") return "vi";
    }
  }catch{}

  return currentLang || "vi";
}

function applyStaticLocale(){
  document.documentElement.lang=currentLang;

  document.querySelector(".topbar h1").textContent=txt("title");
  document.querySelector(".topbar p").textContent=txt("subtitle");

  const badges=document.querySelectorAll(".badges .badge");
  if(badges[1]) badges[1].textContent=txt("privacy");

  el.openBtn.textContent=txt("open");
  el.removeBtn.textContent=txt("remove");
  el.refineBtn.textContent=txt("refine");
  el.finishRefineBtn.textContent=txt("finishRefine");
  el.resetBtn.textContent=txt("reset");
  el.downloadTransparentBtn.textContent=txt("downloadTransparent");
  el.downloadFinalBtn.textContent=txt("export");

  const cards=[...document.querySelectorAll(".sidebar .card")];
  if(cards[0]?.querySelector("h2")) cards[0].querySelector("h2").textContent=txt("statusHeading");
  if(cards[1]?.querySelector("h2")) cards[1].querySelector("h2").textContent=txt("refineHeading");
  if(cards[1]?.querySelector(".hint")) cards[1].querySelector(".hint").innerHTML=txt("refineHelp");
  if(cards[2]?.querySelector("h2")) cards[2].querySelector("h2").textContent=txt("bgHeading");
  if(cards[3]?.querySelector("h2")) cards[3].querySelector("h2").textContent=txt("idHeading");

  el.eraseToolBtn.textContent=txt("erase");
  el.restoreToolBtn.textContent=txt("restore");

  setLeadingText(el.brushSize.previousElementSibling, txt("brushSize"));
  setLeadingText(el.brushSoftness.previousElementSibling, txt("softness"));
  setLeadingText(el.refineZoom.previousElementSibling, txt("refineZoom"));
  setLeadingText(el.scaleRange.previousElementSibling, txt("scale"));
  setLeadingText(el.offsetXRange.previousElementSibling, txt("moveX"));
  setLeadingText(el.offsetYRange.previousElementSibling, txt("moveY"));

  el.undoBtn.textContent=txt("undo");
  el.redoBtn.textContent=txt("redo");

  const legend=cards[1]?.querySelectorAll(".legend span");
  if(legend?.[0]) legend[0].lastChild.textContent=txt("eraseLegend");
  if(legend?.[1]) legend[1].lastChild.textContent=txt("restoreLegend");
  const shortcut=cards[1]?.querySelector(".shortcut-hint");
  if(shortcut) shortcut.textContent=txt("shortcut");

  for(const b of el.bgPresets){
    const k=b.dataset.bg;
    if(k && I18N[currentLang][k]) b.textContent=txt(k);
  }

  const bgLabels=cards[2]?.querySelectorAll("label");
  if(bgLabels?.[0]) bgLabels[0].textContent=txt("customColor");
  if(bgLabels?.[1]) bgLabels[1].textContent=txt("customBg");
  el.applyColorBtn.textContent=txt("useColor");
  el.chooseBgBtn.textContent=txt("chooseBg");
  el.clearBgBtn.textContent=txt("removeBgImage");

  const idLabels=cards[3]?.querySelectorAll("label");
  if(idLabels?.[0]) idLabels[0].textContent=txt("exportSize");
  if(idLabels?.[4]) idLabels[4].textContent=txt("format");
  el.resetAdjustBtn.textContent=txt("resetAdjust");

  const opts=el.sizePreset.options;
  const optionKeys=["original","size2x3","size3x4","size35x45","size4x6","size5x5","size2x2"];
  [...opts].forEach((o,i)=>{ if(optionKeys[i]) o.textContent=txt(optionKeys[i]); });

  if(cards[3]?.querySelector(".hint")) cards[3].querySelector(".hint").textContent=txt("idHint");

  const previewHeads=document.querySelectorAll(".preview-card h2");
  if(previewHeads[0]) previewHeads[0].textContent=txt("source");
  if(previewHeads[1] && !state.refine) previewHeads[1].textContent=txt("result");

  const statLabels=cards[0]?.querySelectorAll(".stats small");
  const statKeys=["sourceMeta","resultMeta","processingMeta","exportMeta"];
  statLabels?.forEach((n,i)=>{if(statKeys[i])n.textContent=txt(statKeys[i]);});

  const footer=document.querySelector("footer");
  if(footer) footer.textContent=txt("footer");
}

function applyLocale(force){
  const next=force || detectSiteLang();
  if(next!=="en" && next!=="vi") return;
  const changed=next!==currentLang;
  currentLang=next;
  applyStaticLocale();

  el.statusBox.innerHTML=localizeKnown(el.statusBox.innerHTML);
  el.progressLabel.textContent=localizeKnown(el.progressLabel.textContent);
  el.engineBadge.textContent=localizeKnown(el.engineBadge.textContent);
  el.sourceCaption.textContent=state.sourceFile?.name || txt("notReady");

  if(state.refine){
    el.resultTitle.textContent=currentLang==="en"?"REFINE EDGES":"SỬA VIỀN";
    el.resultCaption.textContent=txt("manualAlpha");
  }else{
    el.resultTitle.textContent=txt("result");
  }

  if(changed) renderAll();
}

function installLocaleSync(){
  applyLocale(detectSiteLang());

  try{
    if(parent && parent!==window && parent.document){
      parent.document.addEventListener("click", ev=>{
        const node=ev.target?.closest?.("button,a,[role=button],span");
        const v=(node?.textContent||"").trim().toLowerCase();
        if(v==="en" || v==="english") setTimeout(()=>applyLocale("en"),0);
        if(v==="vi" || v==="vn" || v==="tiếng việt") setTimeout(()=>applyLocale("vi"),0);
      },true);

      const observer=new MutationObserver(()=>applyLocale(detectSiteLang()));
      observer.observe(parent.document.documentElement,{
        subtree:true,
        attributes:true,
        attributeFilter:["lang","class","data-lang","data-language","data-locale","aria-pressed","aria-current"]
      });
    }
  }catch{}

  window.addEventListener("storage",()=>applyLocale(detectSiteLang()));
  try{ parent.addEventListener("storage",()=>applyLocale(detectSiteLang())); }catch{}

  setInterval(()=>applyLocale(detectSiteLang()),800);
}
// ===== NLKH V2.5 I18N END =====

const PHOTO_PRESETS={
 original:{label:"Gốc",width:null,height:null},"2x3":{label:"2×3 cm",width:236,height:354},
 "3x4":{label:"3×4 cm",width:354,height:472},"35x45":{label:"3.5×4.5 cm",width:413,height:531},
 "4x6":{label:"4×6 cm",width:472,height:709},"5x5":{label:"5×5 cm",width:591,height:591},
 "2x2in":{label:"2×2 inch",width:600,height:600}
};
const BG_PRESETS={
 transparent:{mode:"transparent",color:null},white:{mode:"color",color:"#ffffff"},
 lightblue:{mode:"color",color:"#d8efff"},passportblue:{mode:"color",color:"#69afe8"},red:{mode:"color",color:"#cf3535"}
};
const state={
 sourceFile:null,sourceImage:null,sourceUrl:null,cutoutBlob:null,cutoutImage:null,cutoutUrl:null,
 sourceCanvas:null,baseCanvas:null,editCanvas:null,backgroundImage:null,backgroundUrl:null,
 bgMode:"transparent",bgColor:"#ffffff",sizePreset:"original",format:"png",scale:1,offsetX:0,offsetY:0,
 processing:false,removeBackground:null,device:null,refine:false,tool:"erase",brushSize:36,softness:.35,zoom:1,
 drawing:false,currentStroke:null,strokes:[],redo:[]
};
const $=id=>document.getElementById(id);
const el={
 openBtn:$("openBtn"),fileInput:$("fileInput"),removeBtn:$("removeBtn"),refineBtn:$("refineBtn"),finishRefineBtn:$("finishRefineBtn"),
 resetBtn:$("resetBtn"),downloadTransparentBtn:$("downloadTransparentBtn"),downloadFinalBtn:$("downloadFinalBtn"),
 engineBadge:$("engineBadge"),progressLabel:$("progressLabel"),progressPercent:$("progressPercent"),progressBar:$("progressBar"),
 statusBox:$("statusBox"),sourceMeta:$("sourceMeta"),resultMeta:$("resultMeta"),deviceMeta:$("deviceMeta"),exportMeta:$("exportMeta"),
 sourceCaption:$("sourceCaption"),resultCaption:$("resultCaption"),resultTitle:$("resultTitle"),
 sourcePreview:$("sourcePreview"),resultPreview:$("resultPreview"),brushCursor:$("brushCursor"),refineCard:$("refineCard"),
 eraseToolBtn:$("eraseToolBtn"),restoreToolBtn:$("restoreToolBtn"),brushSize:$("brushSize"),brushSizeValue:$("brushSizeValue"),
 brushSoftness:$("brushSoftness"),brushSoftnessValue:$("brushSoftnessValue"),refineZoom:$("refineZoom"),refineZoomValue:$("refineZoomValue"),
 undoBtn:$("undoBtn"),redoBtn:$("redoBtn"),customColor:$("customColor"),applyColorBtn:$("applyColorBtn"),
 chooseBgBtn:$("chooseBgBtn"),clearBgBtn:$("clearBgBtn"),bgFileInput:$("bgFileInput"),sizePreset:$("sizePreset"),
 formatPreset:$("formatPreset"),scaleRange:$("scaleRange"),scaleValue:$("scaleValue"),offsetXRange:$("offsetXRange"),
 offsetXValue:$("offsetXValue"),offsetYRange:$("offsetYRange"),offsetYValue:$("offsetYValue"),resetAdjustBtn:$("resetAdjustBtn"),
 bgPresets:[...document.querySelectorAll(".bg-preset")]
};

function parseRgb(s){const m=String(s).match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);return m?[+m[1],+m[2],+m[3]]:null}
function luminance(rgb){if(!rgb)return null;const [r,g,b]=rgb.map(v=>v/255);return .2126*r+.7152*g+.0722*b}
function resolveTheme(){
 let doc=document,win=window;
 try{if(parent&&parent!==window&&parent.document){doc=parent.document;win=parent}}catch{}
 const root=doc.documentElement,body=doc.body;
 const text=[
  root?.getAttribute("data-theme"),root?.getAttribute("data-mode"),root?.getAttribute("data-color-scheme"),
  root?.className,body?.getAttribute("data-theme"),body?.className,root?.style?.colorScheme
 ].filter(Boolean).join(" ").toLowerCase();
 if(/(^|[\s_-])dark($|[\s_-])/.test(text)||text.includes("theme-dark"))return"dark";
 if(/(^|[\s_-])light($|[\s_-])/.test(text)||text.includes("theme-light"))return"light";
 try{
  for(const k of ["theme","appearance","color-theme","colorTheme","nlkh-theme"]){
   const v=win.localStorage?.getItem(k)?.toLowerCase();
   if(v==="dark")return"dark";if(v==="light")return"light";
  }
 }catch{}
 try{
  const cs=win.getComputedStyle(root).colorScheme?.toLowerCase();
  if(cs==="dark"||cs==="light")return cs;
  const bg=win.getComputedStyle(body||root).backgroundColor,l=luminance(parseRgb(bg));
  if(l!==null)return l<.45?"dark":"light";
 }catch{}
 return window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light";
}
function applyTheme(){
 const t=resolveTheme(),old=document.documentElement.dataset.toolTheme;
 document.documentElement.dataset.toolTheme=t;document.documentElement.style.colorScheme=t;
 if(old&&old!==t)renderAll();
}
function installThemeSync(){
 applyTheme();
 try{
  if(parent&&parent!==window&&parent.document){
   const obs=new MutationObserver(applyTheme);
   obs.observe(parent.document.documentElement,{attributes:true,attributeFilter:["class","style","data-theme","data-mode","data-color-scheme"]});
   if(parent.document.body)obs.observe(parent.document.body,{attributes:true,attributeFilter:["class","style","data-theme","data-mode","data-color-scheme"]});
  }
 }catch{}
 window.addEventListener("storage",applyTheme);
 try{parent.addEventListener("storage",applyTheme)}catch{}
 const mq=window.matchMedia?.("(prefers-color-scheme: dark)");mq?.addEventListener?.("change",applyTheme);
 setInterval(applyTheme,1200);
}

function setStatus(h){el.statusBox.innerHTML=localizeKnown(h)}
function progress(t,p=0){const n=Math.max(0,Math.min(100,Math.round(p)));el.progressLabel.textContent=localizeKnown(t);el.progressPercent.textContent=`${n}%`;el.progressBar.style.width=`${n}%`}
function badge(t,c="pending"){el.engineBadge.textContent=localizeKnown(t);el.engineBadge.className=`badge ${c}`}
function revoke(k){if(state[k]){URL.revokeObjectURL(state[k]);state[k]=null}}
function fmt(n){if(!Number.isFinite(n))return"—";const u=["B","KB","MB","GB"];let i=0,v=n;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v.toFixed(v>=100?0:v>=10?1:2)} ${u[i]}`}
function loadImage(url){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url})}
function toBlob(c,type="image/png",q=.95){return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error(txt("exportError"))),type,q))}
function fit(w,h,mw,mh){const r=Math.min(mw/w,mh/h,1);return{width:Math.max(1,Math.round(w*r)),height:Math.max(1,Math.round(h*r))}}
function css(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim()}
function checker(c,w,h,s=18){for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){c.fillStyle=((x/s+y/s)%2===0)?"#d9dee7":"#f3f6fa";c.fillRect(x,y,s,s)}}
function empty(c,text){c.width=720;c.height=560;c.style.width="100%";const x=c.getContext("2d");x.fillStyle=css("--canvas")||"#eef3f8";x.fillRect(0,0,c.width,c.height);x.fillStyle=css("--canvasText")||"#64748b";x.font="20px Segoe UI";x.textAlign="center";x.fillText(text,c.width/2,c.height/2)}
function drawSource(){if(!state.sourceImage){empty(el.sourcePreview,"Chưa có ảnh");return}const d=fit(state.sourceImage.width,state.sourceImage.height,850,760);el.sourcePreview.width=d.width;el.sourcePreview.height=d.height;el.sourcePreview.style.width=`${d.width}px`;el.sourcePreview.getContext("2d").drawImage(state.sourceImage,0,0,d.width,d.height)}
function outSize(){const p=PHOTO_PRESETS[state.sizePreset];if(state.sizePreset==="original"){const s=state.editCanvas||state.sourceImage;return s?{width:s.width,height:s.height,label:`Gốc ${s.width}×${s.height}`}:{width:800,height:600,label:"Gốc"}}return{...p}}
function drawBg(c,w,h,preview=false){
 if(state.bgMode==="transparent"){if(preview)checker(c,w,h,20);return}
 if(state.bgMode==="color"){c.fillStyle=state.bgColor;c.fillRect(0,0,w,h);return}
 if(state.bgMode==="image"&&state.backgroundImage){const im=state.backgroundImage,r=Math.max(w/im.width,h/im.height),dw=im.width*r,dh=im.height*r;c.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh)}
}
function subjectBounds(){
 if(!state.editCanvas)return null;
 if(state.subjectBounds)return state.subjectBounds;

 const src=state.editCanvas,maxSide=320,ratio=Math.min(1,maxSide/Math.max(src.width,src.height));
 const sw=Math.max(1,Math.round(src.width*ratio)),sh=Math.max(1,Math.round(src.height*ratio));
 const scan=document.createElement("canvas");scan.width=sw;scan.height=sh;
 const sx=scan.getContext("2d",{willReadFrequently:true});sx.clearRect(0,0,sw,sh);sx.drawImage(src,0,0,sw,sh);
 const data=sx.getImageData(0,0,sw,sh).data;
 let minX=sw,minY=sh,maxX=-1,maxY=-1;

 for(let y=0;y<sh;y++){
  for(let x=0;x<sw;x++){
   if(data[(y*sw+x)*4+3]>18){
    if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
   }
  }
 }

 if(maxX<0){
  state.subjectBounds={x:0,y:0,width:src.width,height:src.height};
  return state.subjectBounds;
 }

 const fx=src.width/sw,fy=src.height/sh;
 let x=minX*fx,y=minY*fy,width=(maxX-minX+1)*fx,height=(maxY-minY+1)*fy;
 const padX=Math.max(2,width*.018),padY=Math.max(2,height*.018);
 x=Math.max(0,x-padX);y=Math.max(0,y-padY);
 width=Math.min(src.width-x,width+padX*2);height=Math.min(src.height-y,height+padY*2);

 state.subjectBounds={x,y,width,height};
 return state.subjectBounds;
}

function drawPerson(c,w,h){
 if(!state.editCanvas)return;
 const im=state.editCanvas;
 let s,x,y,dw,dh;

 if(state.sizePreset==="original"){
  s=state.scale;
  dw=im.width*s;dh=im.height*s;
  x=(w-dw)/2+(state.offsetX/100)*w;
  y=(h-dh)/2+(state.offsetY/100)*h;
 }else{
  const b=subjectBounds()||{x:0,y:0,width:im.width,height:im.height};

  // Fit theo vùng chủ thể thật (alpha bounding box), không fit theo toàn canvas trong suốt.
  // Giữ một ít headroom và lề để ảnh thẻ không sát mép.
  const sideMargin=w*.075,topMargin=h*.055,bottomMargin=h*.04;
  const usableW=Math.max(1,w-sideMargin*2);
  const usableH=Math.max(1,h-topMargin-bottomMargin);
  const autoScale=Math.min(usableW/b.width,usableH/b.height);

  s=Math.max(.001,autoScale*state.scale);
  dw=im.width*s;dh=im.height*s;

  const targetCenterX=w/2+(state.offsetX/100)*w;
  const targetBottom=h-bottomMargin+(state.offsetY/100)*h;

  // Căn theo bounding box của chủ thể thay vì tâm của canvas gốc.
  x=targetCenterX-(b.x+b.width/2)*s;
  y=targetBottom-(b.y+b.height)*s;
 }

 c.imageSmoothingEnabled=true;
 c.imageSmoothingQuality="high";
 c.drawImage(im,x,y,dw,dh);
}
function composite(w,h,preview=false){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");drawBg(x,w,h,preview);drawPerson(x,w,h);return c}
function renderRefine(){
 if(!state.editCanvas){empty(el.resultPreview,"Chưa xử lý");return}
 const d=fit(state.editCanvas.width,state.editCanvas.height,850,760);el.resultPreview.width=d.width;el.resultPreview.height=d.height;el.resultPreview.style.width=`${Math.round(d.width*state.zoom)}px`;
 const c=el.resultPreview.getContext("2d");checker(c,d.width,d.height,16);c.drawImage(state.editCanvas,0,0,d.width,d.height)
}
function renderResult(){
 if(!state.editCanvas){empty(el.resultPreview,"Chưa xử lý");return}
 const o=outSize(),d=fit(o.width,o.height,850,760),tmp=composite(o.width,o.height,true);
 el.resultPreview.width=d.width;el.resultPreview.height=d.height;el.resultPreview.style.width=`${d.width}px`;el.resultPreview.getContext("2d").drawImage(tmp,0,0,d.width,d.height)
}
function meta(){
 el.sourceMeta.textContent=state.sourceImage&&state.sourceFile?`${state.sourceImage.width}×${state.sourceImage.height} • ${fmt(state.sourceFile.size)}`:"—";
 el.resultMeta.textContent=state.editCanvas?`${state.editCanvas.width}×${state.editCanvas.height}`:"—";el.deviceMeta.textContent=state.device?state.device.toUpperCase():"—";
 const o=outSize();el.exportMeta.textContent=o.label;el.sourceCaption.textContent=state.sourceFile?.name||"Chưa có ảnh";el.resultCaption.textContent=state.refine?txt("manualAlpha"):`${o.label} • ${state.format.toUpperCase()}${state.sizePreset==="original"?"":(" • "+txt("fitSubject"))}`
}
function renderAll(){drawSource();state.refine?renderRefine():renderResult();meta()}
function enableAfter(on){
 [el.refineBtn,el.downloadTransparentBtn,el.downloadFinalBtn,el.eraseToolBtn,el.restoreToolBtn,el.brushSize,el.brushSoftness,el.refineZoom,
 el.customColor,el.applyColorBtn,el.chooseBgBtn,el.clearBgBtn,el.sizePreset,el.formatPreset,el.scaleRange,el.offsetXRange,el.offsetYRange,el.resetAdjustBtn]
 .forEach(x=>x.disabled=!on);el.bgPresets.forEach(x=>x.disabled=!on);el.refineCard.classList.toggle("enabled",on);historyButtons()
}
function historyButtons(){el.undoBtn.disabled=!state.editCanvas||!state.strokes.length;el.redoBtn.disabled=!state.editCanvas||!state.redo.length}
function resetAdjust(){state.scale=1;state.offsetX=0;state.offsetY=0;el.scaleRange.value=100;el.offsetXRange.value=0;el.offsetYRange.value=0;el.scaleValue.textContent="100%";el.offsetXValue.textContent="0";el.offsetYValue.textContent="0"}
function bgActive(k){el.bgPresets.forEach(x=>x.classList.toggle("active",x.dataset.bg===k))}
function exitRefineUi(){el.resultPreview.parentElement.classList.remove("refine-active");el.refineBtn.classList.remove("hidden");el.finishRefineBtn.classList.add("hidden");el.resultTitle.textContent="KẾT QUẢ";el.brushCursor.classList.add("hidden")}
function resetResult(){
 revoke("cutoutUrl");revoke("backgroundUrl");Object.assign(state,{cutoutBlob:null,cutoutImage:null,sourceCanvas:null,baseCanvas:null,editCanvas:null,backgroundImage:null,bgMode:"transparent",bgColor:"#ffffff",strokes:[],redo:[],subjectBounds:null,refine:false,tool:"erase",zoom:1});
 el.refineZoom.value=100;el.refineZoomValue.textContent="100%";resetAdjust();bgActive("transparent");enableAfter(false);exitRefineUi();renderAll()
}
function fullReset(){revoke("sourceUrl");state.sourceFile=null;state.sourceImage=null;resetResult();el.fileInput.value="";el.bgFileInput.value="";el.removeBtn.disabled=true;el.resetBtn.disabled=true;setStatus('Chưa có ảnh. Hãy bấm <b>Mở ảnh</b>.');progress("Sẵn sàng.",0);renderAll()}

async function engine(){
 if(state.removeBackground)return state.removeBackground;badge("Đang tải AI engine...","pending");
 const urls=["https://esm.sh/@imgly/background-removal@1.7.0?bundle","https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm"];let last;
 for(const u of urls){try{const m=await import(u),fn=m.removeBackground||m.default?.removeBackground||m.default;if(typeof fn==="function"){state.removeBackground=fn;return fn}}catch(e){last=e}}
 throw last||new Error("Không tải được AI engine.")
}
function config(device){return{device,model:"isnet",proxyToWorker:false,output:{format:"image/png",quality:1,type:"foreground"},progress:(key,current,total)=>{
 if(total>0&&String(key).startsWith("fetch:"))progress(`Đang tải model: ${String(key).split(":").pop()}`,Math.min(74,8+(current/total)*64));
 else if(total>0&&String(key).startsWith("compute:"))progress("Đang xử lý ảnh...",74+(current/total)*24)
}}}
async function runRemoval(blob){
 const fn=await engine();
 if(navigator.gpu){try{state.device="gpu";badge("Đang chạy WebGPU...","pending");return await fn(blob,config("gpu"))}catch(e){console.warn("WebGPU failed; fallback CPU",e);badge("GPU lỗi • chuyển CPU","warn")}}
 state.device="cpu";badge("Đang chạy CPU/WASM...","pending");return await fn(blob,config("cpu"))
}
async function openSource(file){
 if(!file?.type?.startsWith("image/"))throw new Error(txt("selectImageError"));
 revoke("sourceUrl");state.sourceUrl=URL.createObjectURL(file);state.sourceFile=file;state.sourceImage=await loadImage(state.sourceUrl);resetResult();
 el.removeBtn.disabled=false;el.resetBtn.disabled=false;setStatus('Ảnh đã nạp. Bấm <b>Tách nền</b>.');progress("Ảnh sẵn sàng.",0);renderAll()
}
function initEdit(){
 const w=state.cutoutImage.width,h=state.cutoutImage.height;
 state.sourceCanvas=document.createElement("canvas");state.sourceCanvas.width=w;state.sourceCanvas.height=h;state.sourceCanvas.getContext("2d").drawImage(state.sourceImage,0,0,w,h);
 state.baseCanvas=document.createElement("canvas");state.baseCanvas.width=w;state.baseCanvas.height=h;state.baseCanvas.getContext("2d").drawImage(state.cutoutImage,0,0,w,h);
 state.editCanvas=document.createElement("canvas");state.editCanvas.width=w;state.editCanvas.height=h;state.editCanvas.getContext("2d").drawImage(state.baseCanvas,0,0);state.strokes=[];state.redo=[];state.subjectBounds=null
}
async function removeBg(){
 if(!state.sourceFile||state.processing)return;state.processing=true;el.removeBtn.disabled=true;
 try{
  setStatus("Đang tách nền. Lần đầu có thể lâu hơn vì trình duyệt tải/khởi tạo model.");progress("Chuẩn bị AI...",5);
  const b=await runRemoval(state.sourceFile);state.cutoutBlob=b;revoke("cutoutUrl");state.cutoutUrl=URL.createObjectURL(b);state.cutoutImage=await loadImage(state.cutoutUrl);
  initEdit();enableAfter(true);progress("Hoàn tất tách nền.",100);badge(`Sẵn sàng • ${state.device?.toUpperCase()||"CPU"}`,"ok");
  setStatus('Tách nền xong. Nếu còn dư hoặc bị xóa lẹm, bấm <b>Chỉnh viền</b> trước khi thay nền/xuất ảnh.');renderAll()
 }catch(e){console.error(e);badge("Tách nền lỗi","error");progress("Lỗi xử lý.",0);setStatus(`Lỗi: ${e.message||e}`)}
 finally{state.processing=false;el.removeBtn.disabled=false}
}

function eraseStamp(ctx,s,p){
 const r=s.size/2,inner=Math.min(r*.98,r*Math.max(0,1-s.softness));ctx.save();ctx.globalCompositeOperation="destination-out";
 const g=ctx.createRadialGradient(p.x,p.y,inner,p.x,p.y,r);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.restore()
}
function restoreStamp(ctx,s,p){
 const size=Math.max(2,Math.ceil(s.size)),r=size/2,off=document.createElement("canvas");off.width=size;off.height=size;const o=off.getContext("2d");
 o.drawImage(state.sourceCanvas,p.x-r,p.y-r,size,size,0,0,size,size);o.globalCompositeOperation="destination-in";
 const inner=Math.min(r*.98,r*Math.max(0,1-s.softness)),g=o.createRadialGradient(r,r,inner,r,r,r);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");
 o.fillStyle=g;o.fillRect(0,0,size,size);ctx.save();ctx.globalCompositeOperation="source-over";ctx.drawImage(off,p.x-r,p.y-r);ctx.restore()
}
function stamp(ctx,s,p){s.tool==="erase"?eraseStamp(ctx,s,p):restoreStamp(ctx,s,p)}
function applyStroke(s){
 const c=state.editCanvas.getContext("2d"),pts=s.points;if(!pts.length)return;let prev=pts[0];stamp(c,s,prev);
 for(let i=1;i<pts.length;i++){const p=pts[i],dx=p.x-prev.x,dy=p.y-prev.y,dist=Math.hypot(dx,dy),step=Math.max(1,s.size*.20),n=Math.max(1,Math.ceil(dist/step));for(let j=1;j<=n;j++)stamp(c,s,{x:prev.x+dx*j/n,y:prev.y+dy*j/n});prev=p}
}
function rebuild(){
 const c=state.editCanvas.getContext("2d");
 c.clearRect(0,0,state.editCanvas.width,state.editCanvas.height);
 c.drawImage(state.baseCanvas,0,0);
 state.strokes.forEach(applyStroke);
 state.subjectBounds=null;
 historyButtons();
 state.refine?renderRefine():renderAll();
}

function undoEdit(){
 if(!state.strokes.length)return;
 state.redo.push(state.strokes.pop());
 rebuild();
}

function redoEdit(){
 if(!state.redo.length)return;
 state.strokes.push(state.redo.pop());
 rebuild();
}
function point(ev){const r=el.resultPreview.getBoundingClientRect();return{x:Math.max(0,Math.min(state.editCanvas.width,(ev.clientX-r.left)/r.width*state.editCanvas.width)),y:Math.max(0,Math.min(state.editCanvas.height,(ev.clientY-r.top)/r.height*state.editCanvas.height))}}
function cursor(ev){
 if(!state.refine||!state.editCanvas){el.brushCursor.classList.add("hidden");return}
 const r=el.resultPreview.getBoundingClientRect(),scale=r.width/state.editCanvas.width,d=Math.max(4,state.brushSize*scale);
 el.brushCursor.classList.remove("hidden");el.brushCursor.classList.toggle("restore",state.tool==="restore");el.brushCursor.style.width=`${d}px`;el.brushCursor.style.height=`${d}px`;el.brushCursor.style.left=`${ev.clientX}px`;el.brushCursor.style.top=`${ev.clientY}px`
}
function down(ev){if(!state.refine||!state.editCanvas)return;ev.preventDefault();state.drawing=true;state.currentStroke={tool:state.tool,size:state.brushSize,softness:state.softness,points:[point(ev)]};applyStroke(state.currentStroke);renderRefine()}
function move(ev){
 cursor(ev);if(!state.drawing||!state.currentStroke)return;const p=point(ev),a=state.currentStroke.points,prev=a[a.length-1],seg={...state.currentStroke,points:[prev,p]};applyStroke(seg);a.push(p);renderRefine()
}
function up(){if(!state.drawing)return;state.drawing=false;if(state.currentStroke?.points?.length){state.strokes.push(state.currentStroke);state.redo=[]}state.currentStroke=null;state.subjectBounds=null;historyButtons()}
function setTool(t){state.tool=t;el.eraseToolBtn.classList.toggle("active",t==="erase");el.restoreToolBtn.classList.toggle("active",t==="restore")}
function enterRefine(){if(!state.editCanvas)return;state.refine=true;el.resultPreview.parentElement.classList.add("refine-active");el.refineBtn.classList.add("hidden");el.finishRefineBtn.classList.remove("hidden");el.resultTitle.textContent="SỬA VIỀN";setStatus('Dùng <b>Xóa dư</b> hoặc <b>Khôi phục</b>. Có thể Undo/Redo và zoom để sửa tóc/viền chi tiết.');renderAll()}
function finishRefine(){state.refine=false;exitRefineUi();setStatus("Đã lưu chỉnh viền. Có thể thay nền, căn ảnh thẻ hoặc xuất ảnh.");renderAll()}

async function setBgImage(f){if(!f?.type?.startsWith("image/"))return;revoke("backgroundUrl");state.backgroundUrl=URL.createObjectURL(f);state.backgroundImage=await loadImage(state.backgroundUrl);state.bgMode="image";bgActive("");renderAll()}
function applyBg(k){const p=BG_PRESETS[k];if(!p)return;state.bgMode=p.mode;if(p.color)state.bgColor=p.color;bgActive(k);renderAll()}
function fname(s,e){return`${(state.sourceFile?.name||"photo").replace(/\.[^.]+$/,"")}-${s}.${e}`}
function save(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
async function downloadTransparent(){if(state.editCanvas)save(await toBlob(state.editCanvas,"image/png",1),fname("transparent-refined","png"))}
async function downloadFinal(){
 if(!state.editCanvas)return;const o=outSize(),c=document.createElement("canvas");c.width=o.width;c.height=o.height;const x=c.getContext("2d");let type="image/png",ext="png";
 if(state.format==="jpg"){type="image/jpeg";ext="jpg"}else if(state.format==="webp"){type="image/webp";ext="webp"}
 if(state.bgMode==="transparent"&&state.format!=="png"){x.fillStyle="#fff";x.fillRect(0,0,o.width,o.height)}else drawBg(x,o.width,o.height,false);
 drawPerson(x,o.width,o.height);save(await toBlob(c,type,.95),fname(`${state.sizePreset}-${state.bgMode}`,ext))
}

function bind(){
 el.openBtn.onclick=()=>el.fileInput.click();el.fileInput.onchange=async e=>{try{await openSource(e.target.files?.[0])}catch(x){alert(localizeKnown(x.message))}};
 el.removeBtn.onclick=removeBg;el.resetBtn.onclick=fullReset;el.refineBtn.onclick=enterRefine;el.finishRefineBtn.onclick=finishRefine;
 el.eraseToolBtn.onclick=()=>setTool("erase");el.restoreToolBtn.onclick=()=>setTool("restore");
 el.brushSize.oninput=()=>{state.brushSize=+el.brushSize.value;el.brushSizeValue.textContent=`${state.brushSize} px`};
 el.brushSoftness.oninput=()=>{state.softness=+el.brushSoftness.value/100;el.brushSoftnessValue.textContent=`${el.brushSoftness.value}%`};
 el.refineZoom.oninput=()=>{state.zoom=+el.refineZoom.value/100;el.refineZoomValue.textContent=`${el.refineZoom.value}%`;if(state.refine)renderRefine()};
 el.undoBtn.onclick=undoEdit;el.redoBtn.onclick=redoEdit;
 el.resultPreview.addEventListener("pointerdown",down);window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);
 el.resultPreview.addEventListener("pointerleave",()=>{if(!state.drawing)el.brushCursor.classList.add("hidden")});
window.addEventListener("keydown",e=>{
  if(!state.editCanvas)return;
  const tag=(e.target?.tagName||"").toLowerCase();
  const typing=tag==="textarea"||(tag==="input"&&!["range","color"].includes((e.target?.type||"").toLowerCase()));
  if(typing)return;

  const mod=e.ctrlKey||e.metaKey;
  if(!mod)return;

  const key=e.key.toLowerCase();
  if(key==="z"&&!e.shiftKey){
   if(state.strokes.length){
    e.preventDefault();
    undoEdit();
   }
  }else if((key==="y")||(key==="z"&&e.shiftKey)){
   if(state.redo.length){
    e.preventDefault();
    redoEdit();
   }
  }
 });
 el.bgPresets.forEach(b=>b.onclick=()=>applyBg(b.dataset.bg));el.applyColorBtn.onclick=()=>{state.bgMode="color";state.bgColor=el.customColor.value;bgActive("");renderAll()};
 el.chooseBgBtn.onclick=()=>el.bgFileInput.click();el.bgFileInput.onchange=e=>setBgImage(e.target.files?.[0]);el.clearBgBtn.onclick=()=>{state.backgroundImage=null;revoke("backgroundUrl");applyBg("transparent")};
 el.sizePreset.onchange=()=>{state.sizePreset=el.sizePreset.value;renderAll()};el.formatPreset.onchange=()=>{state.format=el.formatPreset.value;renderAll()};
 el.scaleRange.oninput=()=>{state.scale=+el.scaleRange.value/100;el.scaleValue.textContent=`${el.scaleRange.value}%`;renderAll()};
 el.offsetXRange.oninput=()=>{state.offsetX=+el.offsetXRange.value;el.offsetXValue.textContent=el.offsetXRange.value;renderAll()};
 el.offsetYRange.oninput=()=>{state.offsetY=+el.offsetYRange.value;el.offsetYValue.textContent=el.offsetYRange.value;renderAll()};
 el.resetAdjustBtn.onclick=()=>{resetAdjust();renderAll()};el.downloadTransparentBtn.onclick=downloadTransparent;el.downloadFinalBtn.onclick=downloadFinal
}
function init(){installThemeSync();installLocaleSync();bind();enableAfter(false);resetAdjust();bgActive("transparent");renderAll();badge(navigator.gpu?"WebGPU có sẵn • chờ ảnh":"Không có WebGPU • sẽ dùng CPU","ok");progress("Sẵn sàng.",0);engine().then(()=>badge(navigator.gpu?"AI engine sẵn sàng • ưu tiên GPU":"AI engine sẵn sàng • CPU","ok")).catch(()=>badge("AI sẽ tải khi xử lý ảnh","warn"))}
init();

// ===== NLKH V2.9 CLEAN VIEWER START =====
(function(){
  "use strict";

  const MIN_ZOOM=.25, MAX_ZOOM=8;
  const views=new WeakMap();
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const isEn=()=>String(document.documentElement.lang||"").toLowerCase().startsWith("en");
  const fitLabel=()=>isEn()?"Auto fit":"Vừa khung";
  const fitTitle=()=>isEn()?"Reset this preview to 100% / fit":"Đưa khung ảnh này về 100% / vừa khung";

  function refineInput(){
    return document.getElementById("refineZoom")
      || document.querySelector('input[name="refineZoom"]')
      || document.querySelector('[data-role="refine-zoom"]');
  }

  function isRefine(vp){ return vp.classList.contains("refine-active"); }

  function headerControls(vp){
    const header=vp.closest(".preview-card")?.querySelector("header");
    if(!header)return null;

    let box=header.querySelector(".viewer-controls-v29");
    if(!box){
      box=document.createElement("div");
      box.className="viewer-controls-v29";

      const value=document.createElement("span");
      value.className="viewer-value-v29";
      value.textContent="100%";

      const fit=document.createElement("button");
      fit.type="button";
      fit.className="viewer-fit-v29 hidden";
      fit.textContent=fitLabel();
      fit.title=fitTitle();
      fit.setAttribute("aria-label",fitTitle());

      box.append(value,fit);
      const caption=header.querySelector("small");
      if(caption)header.insertBefore(box,caption);
      else header.appendChild(box);
    }

    const fit=box.querySelector(".viewer-fit-v29");
    fit.textContent=fitLabel();
    fit.title=fitTitle();
    fit.setAttribute("aria-label",fitTitle());
    return box;
  }

  function updateHeader(vp,pct){
    const box=headerControls(vp);
    if(!box)return;
    const n=Math.round(pct);
    box.querySelector(".viewer-value-v29").textContent=n+"%";
    box.querySelector(".viewer-fit-v29").classList.toggle("hidden",Math.abs(pct-100)<1);
  }

  function toast(vp,pct){
    let n=vp.querySelector(":scope > .viewer-toast-v29");
    if(!n){
      n=document.createElement("div");
      n.className="viewer-toast-v29";
      vp.appendChild(n);
    }
    n.textContent=Math.round(pct)+"%";
    n.classList.add("show");
    clearTimeout(n._t);
    n._t=setTimeout(()=>n.classList.remove("show"),650);
  }

  function resetNormal(vp,show=true){
    const st=views.get(vp);
    if(!st)return;
    st.zoom=1; st.baseW=0; st.baseH=0;
    vp.classList.remove("viewer-zoomed-v29");
    for(const p of ["width","height","max-width","max-height"])st.canvas.style.removeProperty(p);
    requestAnimationFrame(()=>{vp.scrollLeft=0;vp.scrollTop=0;});
    updateHeader(vp,100);
    if(show)toast(vp,100);
  }

  function measureBase(vp,st){
    if(st.baseW&&st.baseH)return;
    const r=st.canvas.getBoundingClientRect();
    st.baseW=Math.max(1,r.width);
    st.baseH=Math.max(1,r.height);
  }

  function normalZoom(vp,next,cx,cy){
    const st=views.get(vp);
    if(!st || !st.canvas.width || !st.canvas.height)return;
    if(st.zoom===1){ st.baseW=0;st.baseH=0; }
    measureBase(vp,st);

    const old=st.canvas.getBoundingClientRect();
    const vr=vp.getBoundingClientRect();
    const ax=old.width?clamp((cx-old.left)/old.width,0,1):.5;
    const ay=old.height?clamp((cy-old.top)/old.height,0,1):.5;
    const px=cx-vr.left,py=cy-vr.top;

    next=clamp(next,MIN_ZOOM,MAX_ZOOM);
    if(Math.abs(next-1)<.015){ resetNormal(vp); return; }

    st.zoom=next;
    const w=Math.max(1,st.baseW*next),h=Math.max(1,st.baseH*next);
    if(next>1)vp.classList.add("viewer-zoomed-v29");
    else vp.classList.remove("viewer-zoomed-v29");

    st.canvas.style.setProperty("width",w+"px","important");
    st.canvas.style.setProperty("height",h+"px","important");
    st.canvas.style.setProperty("max-width","none","important");
    st.canvas.style.setProperty("max-height","none","important");

    requestAnimationFrame(()=>{
      if(next>1){
        vp.scrollLeft=Math.max(0,st.canvas.offsetLeft+ax*st.canvas.offsetWidth-px);
        vp.scrollTop=Math.max(0,st.canvas.offsetTop+ay*st.canvas.offsetHeight-py);
      }else{
        vp.scrollLeft=0;vp.scrollTop=0;
      }
    });

    updateHeader(vp,next*100);
    toast(vp,next*100);
  }

  function setRefine(vp,next,cx,cy){
    const input=refineInput();
    if(!input)return false;

    const min=parseFloat(input.min)||50,max=parseFloat(input.max)||300;
    next=clamp(next,min,max);
    const vr=vp.getBoundingClientRect();
    const px=(cx??vr.left+vr.width/2)-vr.left;
    const py=(cy??vr.top+vr.height/2)-vr.top;
    const ax=(vp.scrollLeft+px)/Math.max(1,vp.scrollWidth);
    const ay=(vp.scrollTop+py)/Math.max(1,vp.scrollHeight);

    input.value=String(Math.round(next));
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));

    requestAnimationFrame(()=>{
      if(Math.abs(next-100)<1){vp.scrollLeft=0;vp.scrollTop=0;}
      else{
        vp.scrollLeft=Math.max(0,ax*vp.scrollWidth-px);
        vp.scrollTop=Math.max(0,ay*vp.scrollHeight-py);
      }
    });

    updateHeader(vp,next);
    toast(vp,next);
    return true;
  }

  function autoFit(vp){
    if(isRefine(vp) && setRefine(vp,100))return;
    resetNormal(vp);
  }

  function canPan(vp){
    return vp.scrollWidth>vp.clientWidth+2 || vp.scrollHeight>vp.clientHeight+2;
  }

  function bind(vp){
    if(vp.dataset.viewerV29==="1")return;
    const canvas=vp.querySelector("canvas");
    if(!canvas)return;
    vp.dataset.viewerV29="1";

    const st={canvas,zoom:1,baseW:0,baseH:0,drag:false,pid:null,sx:0,sy:0,sl:0,st:0};
    views.set(vp,st);

    const box=headerControls(vp);
    const fit=box?.querySelector(".viewer-fit-v29");
    fit?.addEventListener("click",()=>autoFit(vp));
    updateHeader(vp,100);

    vp.addEventListener("wheel",e=>{
      if(e.altKey||e.ctrlKey){
        e.preventDefault();e.stopPropagation();
        const raw=Math.abs(e.deltaY)>.01?e.deltaY:e.deltaX;
        const factor=Math.exp(-raw*.0025);

        if(isRefine(vp)){
          const input=refineInput();
          const cur=parseFloat(input?.value)||100;
          if(setRefine(vp,cur*factor,e.clientX,e.clientY))return;
        }

        normalZoom(vp,st.zoom*factor,e.clientX,e.clientY);
        return;
      }

      if(canPan(vp)){
        const x=vp.scrollLeft,y=vp.scrollTop;
        vp.scrollLeft+=e.deltaX;vp.scrollTop+=e.deltaY;
        if(Math.abs(vp.scrollLeft-x)>.5||Math.abs(vp.scrollTop-y)>.5){
          e.preventDefault();e.stopPropagation();
        }
      }
    },{passive:false});

    vp.addEventListener("pointerdown",e=>{
      if(e.button!==1||!canPan(vp))return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      st.drag=true;st.pid=e.pointerId;st.sx=e.clientX;st.sy=e.clientY;st.sl=vp.scrollLeft;st.st=vp.scrollTop;
      vp.classList.add("viewer-pan-v29");
      try{vp.setPointerCapture(e.pointerId);}catch{}
    },true);

    vp.addEventListener("pointermove",e=>{
      if(!st.drag||e.pointerId!==st.pid)return;
      e.preventDefault();
      vp.scrollLeft=st.sl-(e.clientX-st.sx);
      vp.scrollTop=st.st-(e.clientY-st.sy);
    },true);

    const stop=e=>{
      if(!st.drag)return;
      if(e&&st.pid!==null&&e.pointerId!==undefined&&e.pointerId!==st.pid)return;
      st.drag=false;vp.classList.remove("viewer-pan-v29");
      try{if(st.pid!==null)vp.releasePointerCapture(st.pid);}catch{}
      st.pid=null;
    };
    vp.addEventListener("pointerup",stop,true);
    vp.addEventListener("pointercancel",stop,true);
    vp.addEventListener("lostpointercapture",stop,true);
    vp.addEventListener("auxclick",e=>{if(e.button===1){e.preventDefault();e.stopPropagation();}},true);

    new MutationObserver(ms=>{
      if(isRefine(vp))return;
      if(ms.some(m=>m.type==="attributes"&&(m.attributeName==="width"||m.attributeName==="height"))){
        resetNormal(vp,false);
      }
    }).observe(canvas,{attributes:true,attributeFilter:["width","height"]});

    new ResizeObserver(()=>{
      if(st.zoom===1){st.baseW=0;st.baseH=0;}
    }).observe(vp);
  }

  function syncRefine(){
    const input=refineInput();
    if(!input||input.dataset.viewerV29Sync==="1")return;
    input.dataset.viewerV29Sync="1";
    const fn=()=>document.querySelectorAll(".canvas-scroll.refine-active")
      .forEach(vp=>updateHeader(vp,parseFloat(input.value)||100));
    input.addEventListener("input",fn);
    input.addEventListener("change",fn);
  }

  function refreshLang(){
    document.querySelectorAll(".canvas-scroll").forEach(vp=>{
      const fit=headerControls(vp)?.querySelector(".viewer-fit-v29");
      if(fit){
        fit.textContent=fitLabel();fit.title=fitTitle();fit.setAttribute("aria-label",fitTitle());
      }
    });
  }

  function init(){
    document.querySelectorAll(".canvas-scroll").forEach(bind);
    syncRefine();refreshLang();

    new MutationObserver(()=>{
      document.querySelectorAll(".canvas-scroll").forEach(bind);
      syncRefine();
    }).observe(document.body,{subtree:true,childList:true});

    new MutationObserver(refreshLang).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
// ===== NLKH V2.9 CLEAN VIEWER END =====
