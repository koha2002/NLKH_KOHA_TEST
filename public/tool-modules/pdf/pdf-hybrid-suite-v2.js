(() => {
  "use strict";

  // NLKH PDF HYBRID SUITE V2.6 · RESTORED FULL MENU + FAST SINGLE SELECTOR
  // Scope: augmentation layer for public/tool-modules/pdf only.
  // Existing module.js remains the Online/iLovePDF engine.
  // Existing offline-v2.js remains the legacy Offline engine.
  // This layer adds explicit Office conversions and additional local conversions.

  const CUSTOM = "nlkh:";
  const STATIC_PREFIX = "/tool-modules/pdf/";
  const state = {
    result: null,
    resultUrl: "",
    files: new Map(),
    taskSelect: null,
    autoButton: null,
    offlineButton: null,
    onlineButton: null,
    optionsReady: false,
    modeReady: false,
    storageBound: false,
    booted: false,
  };

  const OFFICE_ACCEPT = {
    word: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    excel: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    powerpoint: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };

  const LOCAL_KINDS = new Set([
    "pdf-docx",
    "pdf-xlsx",
    "pdf-pptx",
    "pdf-png",
    "pdf-webp",
    "pdf-txt",
    "pdf-md",
    "flatten-form",
    "rasterize",
    "grayscale",
    "metadata-clean",
  ]);

  const LOCAL_EXISTING = {
    pdfjpg: "pdf-jpg",
    imagepdf: "image-pdf",
    compress: "compress-local",
  };

  const LOCAL_EXISTING_KINDS = new Set(Object.values(LOCAL_EXISTING));

  function el(id) { return document.getElementById(id); }
  function clean(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[→–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  function bilingual(vi, en) { return `${vi} / ${en}`; }
  const MODE_PREF_KEY = "nlkh_pdf_mode_pref_v24";
  const AUTO_ONLINE_VALUES = new Set([
    "officepdf", "pdfocr", "ocr", "repair", "protect", "unlock",
    "pdfa", "validatepdfa", "editpdf", "htmlpdf"
  ]);

  function modePreference() {
    try {
      const value = localStorage.getItem(MODE_PREF_KEY);
      return ["auto", "offline", "online"].includes(value) ? value : "auto";
    } catch (_) {
      return "auto";
    }
  }

  function mode() {
    try { return localStorage.getItem("nlkh_pdf_mode") || "offline"; }
    catch (_) { return "offline"; }
  }

  function effectiveModeForCurrentTask() {
    const pref = modePreference();
    if (pref === "offline" || pref === "online") return pref;

    const option = selectedOption();
    const value = String(taskSelect()?.value || "").toLowerCase();
    if (option?.dataset?.nlkhOffice) return "online";
    if (AUTO_ONLINE_VALUES.has(value)) return "online";
    return "offline";
  }

  function syncEffectiveMode() {
    const effective = effectiveModeForCurrentTask();
    try {
      if (localStorage.getItem("nlkh_pdf_mode") !== effective) {
        localStorage.setItem("nlkh_pdf_mode", effective);
      }
    } catch (_) {}
    return effective;
  }

  function setModePreference(pref) {
    if (!["auto", "offline", "online"].includes(pref)) return;
    try { localStorage.setItem(MODE_PREF_KEY, pref); } catch (_) {}
    syncEffectiveMode();
    renderModeControls();
    applyUi();
  }

  function isOffline() { return mode() === "offline"; }

  function setStatus(message, type = "info") {
    try {
      if (typeof window.setStatus === "function") {
        window.setStatus(message, type);
        return;
      }
    } catch (_) {}
    console[type === "error" ? "error" : "log"]("[NLKH PDF V2]", message);
  }

  function setBusy(on) {
    const loader = el("loader");
    const text = el("processButtonText");
    const button = el("processButton");
    if (loader) loader.style.display = on ? "block" : "none";
    if (text) text.style.display = on ? "none" : "block";
    if (button) button.disabled = !!on;
  }

  function taskSelect() {
    if (state.taskSelect && state.taskSelect.isConnected) return state.taskSelect;
    state.taskSelect = el("apiTool") || Array.from(document.querySelectorAll("select")).find((select) =>
      Array.from(select.options || []).some((o) =>
        /merge pdf|gop pdf|compress pdf|nen pdf|pdf.*jpg|word.*pdf/.test(clean(o.textContent))
      )
    ) || null;
    return state.taskSelect;
  }

  function fileInput() {
    return Array.from(document.querySelectorAll('input[type="file"]')).find((x) => x.id !== "watermarkImageInput") || null;
  }

  function fileKey(file) {
    return `${file.name}|${file.size}|${file.lastModified}`;
  }

  function rememberFiles(files) {
    for (const file of Array.from(files || [])) state.files.set(fileKey(file), file);
  }

  function currentFiles() {
    try { rememberFiles(window.selectedFiles || []); } catch (_) {}
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      if (input.id !== "watermarkImageInput") rememberFiles(input.files);
    });
    return Array.from(state.files.values());
  }

  function clearRememberedFiles() {
    state.files.clear();
  }

  function selectedOption() {
    const select = taskSelect();
    return select && select.options ? select.options[select.selectedIndex] : null;
  }

  function selectedKind() {
    const select = taskSelect();
    const option = selectedOption();
    if (!select || !option) return "";

    if (option.dataset.nlkhKind) return option.dataset.nlkhKind;
    if (option.dataset.nlkhOffice) return `office-${option.dataset.nlkhOffice}-pdf`;

    const mapped = LOCAL_EXISTING[String(select.value || "").toLowerCase()];
    if (mapped && isOffline()) return mapped;

    return "";
  }

  function isOfficeOnlineSelection() {
    const option = selectedOption();
    return !!(option && option.dataset.nlkhOffice);
  }

  function revokeResult() {
    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = "";
    state.result = null;
  }

  function showResult(blob, name) {
    revokeResult();
    state.result = { blob, name };
    state.resultUrl = URL.createObjectURL(blob);

    const link = el("downloadLink");
    if (link) {
      link.href = state.resultUrl;
      link.download = name;
      link.textContent = bilingual("Tải", "Download") + `: ${name}`;
    }
    const result = el("resultContainer");
    if (result) result.classList.remove("hidden");
    setStatus(bilingual("Hoàn tất.", "Completed."), "success");
  }

  function downloadResult(event) {
    if (!state.result || !selectedKind()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const a = document.createElement("a");
    a.href = state.resultUrl || URL.createObjectURL(state.result.blob);
    a.download = state.result.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function escapeXml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function safeBase(name) {
    return String(name || "document")
      .replace(/\.[^.]+$/, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "document";
  }

  function parsePages(spec, total) {
    const raw = clean(spec);
    if (!raw || raw === "all" || raw === "tat ca") return Array.from({length: total}, (_, i) => i + 1);

    const pages = [];
    const seen = new Set();
    for (const part of raw.split(",").map(x => x.trim()).filter(Boolean)) {
      if (/^\d+$/.test(part)) {
        const p = Number(part);
        if (p < 1 || p > total) throw new Error(`Page ${p} outside 1-${total}`);
        if (!seen.has(p)) { seen.add(p); pages.push(p); }
        continue;
      }
      const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!m) throw new Error(bilingual(`Sai cú pháp trang: ${part}`, `Invalid page range: ${part}`));
      const a = Number(m[1]), b = Number(m[2]);
      const step = a <= b ? 1 : -1;
      for (let p = a; step > 0 ? p <= b : p >= b; p += step) {
        if (p < 1 || p > total) throw new Error(`Page ${p} outside 1-${total}`);
        if (!seen.has(p)) { seen.add(p); pages.push(p); }
      }
    }
    return pages;
  }

  let pdfjsPromise = null;
  async function pdfjs() {
    if (!pdfjsPromise) {
      const base = new URL("./", document.currentScript?.src || location.href);
      pdfjsPromise = import(new URL("./vendor/pdfjs/pdf.mjs", base).href).then((mod) => {
        mod.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.mjs", base).href;
        return mod;
      });
    }
    return pdfjsPromise;
  }

  async function openPdf(file) {
    const lib = await pdfjs();
    return lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  }

  function ensurePdfLib() {
    if (!window.PDFLib?.PDFDocument) throw new Error(bilingual("pdf-lib chưa sẵn sàng.", "pdf-lib is not ready."));
    return window.PDFLib;
  }

  function ensureZip() {
    if (!window.JSZip) throw new Error(bilingual("JSZip chưa sẵn sàng.", "JSZip is not ready."));
    return window.JSZip;
  }

  async function canvasBlob(canvas, mime, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")), mime, quality);
    });
  }

  async function renderPage(pdf, pageNumber, dpi = 144, grayscale = false) {
    const page = await pdf.getPage(pageNumber);
    const scale = Number(dpi) / 72;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: grayscale });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    if (grayscale) {
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < image.data.length; i += 4) {
        const y = Math.round(image.data[i] * .299 + image.data[i + 1] * .587 + image.data[i + 2] * .114);
        image.data[i] = image.data[i + 1] = image.data[i + 2] = y;
      }
      ctx.putImageData(image, 0, 0);
    }
    return { page, viewport, canvas };
  }

  async function pageTextItems(page) {
    const content = await page.getTextContent();
    return (content.items || [])
      .filter((x) => x && typeof x.str === "string" && x.str.trim())
      .map((x) => ({
        text: x.str,
        x: x.transform?.[4] || 0,
        y: x.transform?.[5] || 0,
        w: x.width || 0,
        h: x.height || 0,
      }));
  }

  function textRows(items) {
    const rows = [];
    const sorted = [...items].sort((a, b) => (b.y - a.y) || (a.x - b.x));
    for (const item of sorted) {
      let row = rows.find((r) => Math.abs(r.y - item.y) <= 2.5);
      if (!row) { row = { y: item.y, items: [] }; rows.push(row); }
      row.items.push(item);
    }
    return rows
      .sort((a, b) => b.y - a.y)
      .map((row) => row.items.sort((a, b) => a.x - b.x));
  }

  async function extractTextPages(file, spec = "all") {
    const pdf = await openPdf(file);
    const pages = parsePages(spec, pdf.numPages);
    const result = [];
    try {
      for (let i = 0; i < pages.length; i++) {
        setStatus(`${bilingual("Đang đọc trang", "Reading page")} ${i + 1}/${pages.length}`, "info");
        const page = await pdf.getPage(pages[i]);
        const rows = textRows(await pageTextItems(page));
        result.push({
          pageNumber: pages[i],
          rows,
          text: rows.map((row) => row.map((x) => x.text).join(" ").replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"),
        });
      }
      return result;
    } finally {
      try { await pdf.destroy(); } catch (_) {}
    }
  }

  // ----------------------- DOCX -----------------------------------------

  async function pdfToDocx(file) {
    const Zip = ensureZip();
    const pages = await extractTextPages(file, el("nlkhPages")?.value || "all");
    const zip = new Zip();

    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

    zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

    const body = [];
    pages.forEach((page, pageIndex) => {
      if (pageIndex) body.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
      body.push(`<w:p><w:pPr><w:spacing w:after="100"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>PDF page ${page.pageNumber}</w:t></w:r></w:p>`);
      for (const line of page.text.split("\n")) {
        body.push(`<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`);
      }
    });

    zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`);

    zip.folder("word").file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr>
  </w:style>
</w:styles>`);

    zip.folder("word").folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);

    zip.folder("docProps").file("core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
 <dc:title>${escapeXml(safeBase(file.name))}</dc:title>
 <dc:creator>NLKH PDF Studio</dc:creator>
</cp:coreProperties>`);

    zip.folder("docProps").file("app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
 <Application>NLKH PDF Studio</Application>
</Properties>`);

    return {
      name: `${safeBase(file.name)}.docx`,
      blob: await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" }),
    };
  }

  // ----------------------- XLSX -----------------------------------------

  function xlsxCol(index) {
    let n = index + 1, s = "";
    while (n) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
    return s;
  }

  async function pdfToXlsx(file) {
    const Zip = ensureZip();
    const pages = await extractTextPages(file, el("nlkhPages")?.value || "all");
    const zip = new Zip();

    const sheetOverrides = pages.map((_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    ).join("\n");

    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="xml" ContentType="application/xml"/>
 <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
 <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
 ${sheetOverrides}
</Types>`);

    zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

    zip.folder("xl").file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
 <sheets>
 ${pages.map((p, i) => `<sheet name="PDF ${p.pageNumber}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("\n")}
 </sheets>
</workbook>`);

    zip.folder("xl").folder("_rels").file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 ${pages.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
 <Relationship Id="rId${pages.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

    zip.folder("xl").file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <fonts count="1"><font><sz val="11"/><name val="Arial"/></font></fonts>
 <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
 <borders count="1"><border/></borders>
 <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
 <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`);

    const ws = zip.folder("xl").folder("worksheets");
    pages.forEach((page, pageIndex) => {
      const rowsXml = page.rows.map((items, rowIndex) => {
        const cells = items.map((item, colIndex) => {
          const ref = `${xlsxCol(colIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(item.text)}</t></is></c>`;
        }).join("");
        return `<row r="${rowIndex + 1}">${cells}</row>`;
      }).join("\n");
      ws.file(`sheet${pageIndex + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <sheetData>${rowsXml}</sheetData>
</worksheet>`);
    });

    return {
      name: `${safeBase(file.name)}.xlsx`,
      blob: await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression: "DEFLATE" }),
    };
  }

  // ----------------------- PPTX -----------------------------------------

  const PPT_CX = 12192000;
  const PPT_CY = 6858000;

  function pptTheme() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="NLKH Theme">
 <a:themeElements>
  <a:clrScheme name="NLKH">
   <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
   <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
   <a:dk2><a:srgbClr val="1F2937"/></a:dk2>
   <a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>
   <a:accent1><a:srgbClr val="2563EB"/></a:accent1>
   <a:accent2><a:srgbClr val="06B6D4"/></a:accent2>
   <a:accent3><a:srgbClr val="10B981"/></a:accent3>
   <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
   <a:accent5><a:srgbClr val="EF4444"/></a:accent5>
   <a:accent6><a:srgbClr val="8B5CF6"/></a:accent6>
   <a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
  </a:clrScheme>
  <a:fontScheme name="NLKH"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme>
  <a:fmtScheme name="NLKH">
   <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
   <a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
   <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
   <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
  </a:fmtScheme>
 </a:themeElements>
</a:theme>`;
  }

  async function pdfToPptx(file) {
    const Zip = ensureZip();
    const pdf = await openPdf(file);
    const pages = parsePages(el("nlkhPages")?.value || "all", pdf.numPages);
    const zip = new Zip();
    const rendered = [];

    try {
      for (let i = 0; i < pages.length; i++) {
        setStatus(`${bilingual("Đang tạo slide", "Creating slide")} ${i + 1}/${pages.length}`, "info");
        const { canvas } = await renderPage(pdf, pages[i], 120, false);
        const blob = await canvasBlob(canvas, "image/png");
        rendered.push({ page: pages[i], blob, w: canvas.width, h: canvas.height });
        canvas.width = canvas.height = 1;
      }
    } finally {
      try { await pdf.destroy(); } catch (_) {}
    }

    const slideOverrides = rendered.map((_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    ).join("\n");

    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="xml" ContentType="application/xml"/>
 <Default Extension="png" ContentType="image/png"/>
 <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
 <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
 <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
 <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
 ${slideOverrides}
</Types>`);

    zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

    zip.folder("ppt").file("presentation.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
 <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
 <p:sldIdLst>${rendered.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst>
 <p:sldSz cx="${PPT_CX}" cy="${PPT_CY}" type="screen16x9"/>
 <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

    zip.folder("ppt").folder("_rels").file("presentation.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
 ${rendered.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("\n")}
</Relationships>`);

    zip.folder("ppt").folder("theme").file("theme1.xml", pptTheme());

    zip.folder("ppt").folder("slideMasters").file("slideMaster1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
 <p:cSld><p:spTree>
  <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
 </p:spTree></p:cSld>
 <p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/>
 <p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst>
 <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`);

    zip.folder("ppt").folder("slideMasters").folder("_rels").file("slideMaster1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
 <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);

    zip.folder("ppt").folder("slideLayouts").file("slideLayout1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
 <p:cSld name="Blank"><p:spTree>
  <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
 </p:spTree></p:cSld>
 <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);

    zip.folder("ppt").folder("slideLayouts").folder("_rels").file("slideLayout1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

    const slides = zip.folder("ppt").folder("slides");
    const slideRels = slides.folder("_rels");
    const media = zip.folder("ppt").folder("media");

    rendered.forEach((item, i) => {
      const ratio = Math.min(PPT_CX / item.w, PPT_CY / item.h);
      const cx = Math.round(item.w * ratio);
      const cy = Math.round(item.h * ratio);
      const x = Math.round((PPT_CX - cx) / 2);
      const y = Math.round((PPT_CY - cy) / 2);

      media.file(`image${i + 1}.png`, item.blob);
      slides.file(`slide${i + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
 <p:cSld><p:spTree>
  <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  <p:pic>
   <p:nvPicPr><p:cNvPr id="2" name="PDF page ${item.page}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
   <p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
   <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
  </p:pic>
 </p:spTree></p:cSld>
 <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`);
      slideRels.file(`slide${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i + 1}.png"/>
 <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`);
    });

    return {
      name: `${safeBase(file.name)}.pptx`,
      blob: await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", compression: "DEFLATE" }),
    };
  }

  // -------------------- Common local conversions -----------------------

  async function pdfToImages(file, format) {
    const Zip = ensureZip();
    const pdf = await openPdf(file);
    const pages = parsePages(el("nlkhPages")?.value || "all", pdf.numPages);
    const dpi = Number(el("nlkhDpi")?.value || 150);
    const quality = Number(el("nlkhQuality")?.value || 90) / 100;
    const mime = format === "jpg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const outputs = [];
    try {
      for (let i = 0; i < pages.length; i++) {
        setStatus(`${bilingual("Đang render trang", "Rendering page")} ${i + 1}/${pages.length}`, "info");
        const { canvas } = await renderPage(pdf, pages[i], dpi, false);
        const blob = await canvasBlob(canvas, mime, format === "png" ? undefined : quality);
        outputs.push({ name: `${safeBase(file.name)}-page-${String(pages[i]).padStart(3, "0")}.${format}`, blob });
        canvas.width = canvas.height = 1;
      }
    } finally {
      try { await pdf.destroy(); } catch (_) {}
    }

    if (outputs.length === 1) return outputs[0];
    const zip = new Zip();
    outputs.forEach((x) => zip.file(x.name, x.blob));
    return {
      name: `${safeBase(file.name)}-${format}-pages.zip`,
      blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }),
    };
  }

  async function pdfToText(file, markdown = false) {
    const pages = await extractTextPages(file, el("nlkhPages")?.value || "all");
    const body = pages.map((p) => markdown
      ? `## Page ${p.pageNumber}\n\n${p.text}`
      : `===== PAGE ${p.pageNumber} =====\n${p.text}`
    ).join("\n\n");
    const ext = markdown ? "md" : "txt";
    return {
      name: `${safeBase(file.name)}.${ext}`,
      blob: new Blob(["\uFEFF" + body], { type: markdown ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8" }),
    };
  }

  async function imageInfo(file) {
    if (window.createImageBitmap) {
      const bitmap = await createImageBitmap(file);
      return { width: bitmap.width, height: bitmap.height, bitmap };
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const node = new Image();
        node.onload = () => resolve(node);
        node.onerror = reject;
        node.src = url;
      });
      return { width: img.naturalWidth, height: img.naturalHeight, bitmap: img };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function embeddableImage(doc, file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (/png/i.test(file.type) || /\.png$/i.test(file.name)) return doc.embedPng(bytes);
    if (/jpe?g/i.test(file.type) || /\.jpe?g$/i.test(file.name)) return doc.embedJpg(bytes);

    const info = await imageInfo(file);
    const canvas = document.createElement("canvas");
    canvas.width = info.width; canvas.height = info.height;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(info.bitmap, 0, 0);
    info.bitmap.close?.();
    const blob = await canvasBlob(canvas, "image/jpeg", .94);
    canvas.width = canvas.height = 1;
    return doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
  }

  async function imagesToPdf(files) {
    const { PDFDocument } = ensurePdfLib();
    const doc = await PDFDocument.create();
    const images = files.filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name));
    if (!images.length) throw new Error(bilingual("Hãy chọn ảnh.", "Please choose images."));

    const pageSize = el("nlkhPageSize")?.value || "original";
    const margin = Math.max(0, Number(el("nlkhMargin")?.value || 8)) * 72 / 25.4;

    for (let i = 0; i < images.length; i++) {
      setStatus(`${bilingual("Đang thêm ảnh", "Adding image")} ${i + 1}/${images.length}`, "info");
      const file = images[i];
      const info = await imageInfo(file);
      info.bitmap.close?.();
      const embedded = await embeddableImage(doc, file);
      let pw, ph;
      if (pageSize === "a4") { pw = 595.28; ph = 841.89; }
      else if (pageSize === "letter") { pw = 612; ph = 792; }
      else { pw = info.width * 72 / 96; ph = info.height * 72 / 96; }
      if (info.width > info.height && ph > pw && pageSize !== "original") [pw, ph] = [ph, pw];

      const page = doc.addPage([pw, ph]);
      const maxW = Math.max(1, pw - 2 * margin), maxH = Math.max(1, ph - 2 * margin);
      const ratio = Math.min(maxW / info.width, maxH / info.height);
      const w = info.width * ratio, h = info.height * ratio;
      page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }

    return {
      name: "images-to-pdf.pdf",
      blob: new Blob([await doc.save({ useObjectStreams: true })], { type: "application/pdf" }),
    };
  }

  async function rasterPdf(file, grayscale = false, dpi = 144, quality = .82) {
    const { PDFDocument } = ensurePdfLib();
    const input = await openPdf(file);
    const output = await PDFDocument.create();
    try {
      for (let p = 1; p <= input.numPages; p++) {
        setStatus(`${bilingual("Đang xử lý trang", "Processing page")} ${p}/${input.numPages}`, "info");
        const sourcePage = await input.getPage(p);
        const pt = sourcePage.getViewport({ scale: 1 });
        const { canvas } = await renderPage(input, p, dpi, grayscale);
        const jpg = await canvasBlob(canvas, "image/jpeg", quality);
        const img = await output.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
        const page = output.addPage([pt.width, pt.height]);
        page.drawImage(img, { x: 0, y: 0, width: pt.width, height: pt.height });
        canvas.width = canvas.height = 1;
      }
    } finally {
      try { await input.destroy(); } catch (_) {}
    }
    return new Blob([await output.save({ useObjectStreams: true })], { type: "application/pdf" });
  }

  async function compressLocal(file) {
    const modeValue = el("nlkhCompressMode")?.value || "balanced";
    if (modeValue === "preserve") {
      const { PDFDocument } = ensurePdfLib();
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: false });
      return {
        name: `${safeBase(file.name)}-optimized.pdf`,
        blob: new Blob([await doc.save({ useObjectStreams: true, addDefaultPage: false })], { type: "application/pdf" }),
      };
    }
    const strong = modeValue === "strong";
    return {
      name: `${safeBase(file.name)}-${strong ? "compressed-strong" : "compressed"}.pdf`,
      blob: await rasterPdf(file, false, strong ? 96 : 130, strong ? .58 : .76),
    };
  }

  async function flattenForm(file) {
    const { PDFDocument } = ensurePdfLib();
    const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: false });
    try { doc.getForm().flatten(); } catch (_) {}
    return {
      name: `${safeBase(file.name)}-flattened.pdf`,
      blob: new Blob([await doc.save({ useObjectStreams: true })], { type: "application/pdf" }),
    };
  }

  async function cleanMetadata(file) {
    const { PDFDocument } = ensurePdfLib();
    const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: false, updateMetadata: false });
    try { doc.setTitle(""); } catch (_) {}
    try { doc.setAuthor(""); } catch (_) {}
    try { doc.setSubject(""); } catch (_) {}
    try { doc.setKeywords([]); } catch (_) {}
    try { doc.setCreator(""); } catch (_) {}
    try { doc.setProducer(""); } catch (_) {}
    return {
      name: `${safeBase(file.name)}-metadata-clean.pdf`,
      blob: new Blob([await doc.save({ useObjectStreams: true })], { type: "application/pdf" }),
    };
  }

  // ------------------------- UI ----------------------------------------

  const TOOL_DEFS = [
    { kind: "office-word-pdf", value: "officepdf", office: "word", label: "Word → PDF / Word to PDF", badge: "ONLINE" },
    { kind: "office-excel-pdf", value: "officepdf", office: "excel", label: "Excel → PDF / Excel to PDF", badge: "ONLINE" },
    { kind: "office-powerpoint-pdf", value: "officepdf", office: "powerpoint", label: "PowerPoint → PDF / PowerPoint to PDF", badge: "ONLINE" },
    { kind: "pdf-docx", value: CUSTOM + "pdf-docx", label: "PDF → Word / PDF to Word", badge: "LOCAL" },
    { kind: "pdf-xlsx", value: CUSTOM + "pdf-xlsx", label: "PDF → Excel / PDF to Excel", badge: "LOCAL" },
    { kind: "pdf-pptx", value: CUSTOM + "pdf-pptx", label: "PDF → PowerPoint / PDF to PowerPoint", badge: "LOCAL" },
    { kind: "pdf-png", value: CUSTOM + "pdf-png", label: "PDF → PNG / PDF to PNG", badge: "LOCAL" },
    { kind: "pdf-webp", value: CUSTOM + "pdf-webp", label: "PDF → WebP / PDF to WebP", badge: "LOCAL" },
    { kind: "pdf-txt", value: CUSTOM + "pdf-txt", label: "PDF → TXT / PDF to Text", badge: "LOCAL" },
    { kind: "pdf-md", value: CUSTOM + "pdf-md", label: "PDF → Markdown / PDF to Markdown", badge: "LOCAL" },
    { kind: "flatten-form", value: CUSTOM + "flatten-form", label: "Flatten form / Làm phẳng biểu mẫu", badge: "LOCAL" },
    { kind: "rasterize", value: CUSTOM + "rasterize", label: "Rasterize PDF / Làm phẳng an toàn", badge: "LOCAL" },
    { kind: "grayscale", value: CUSTOM + "grayscale", label: "Grayscale PDF / PDF đen trắng", badge: "LOCAL" },
    { kind: "metadata-clean", value: CUSTOM + "metadata-clean", label: "Clean metadata / Xóa metadata", badge: "LOCAL" },
  ];

  const ONLINE_DISCOVERY_DEFS = [
    { value: "extract", label: "Trích xuất trang PDF / Extract PDF pages" },
    { value: "htmlpdf", label: "HTML → PDF / HTML to PDF" },
    { value: "pdfocr", label: "OCR PDF / OCR PDF" },
    { value: "repair", label: "Sửa lỗi PDF / Repair PDF" },
    { value: "protect", label: "Bảo vệ PDF / Protect PDF" },
    { value: "unlock", label: "Mở khóa PDF / Unlock PDF" },
    { value: "pdfa", label: "PDF → PDF/A / PDF to PDF/A" },
    { value: "validatepdfa", label: "Kiểm tra PDF/A / Validate PDF/A" },
    { value: "editpdf", label: "Chỉnh sửa PDF / Edit PDF" },
    { value: "splitsmart", label: "Tách PDF thông minh / Smart split PDF" },
  ];

  function mainPdfGroup(select) {
    const group = mainPdfGroup(select);
    return group;
  }

  async function discoverExistingOnlineTools() {
    const select = taskSelect();
    if (!select || select.dataset.nlkhOnlineDiscoveryV26 === "1") return;
    select.dataset.nlkhOnlineDiscoveryV26 = "1";
    try {
      const response = await fetch("./module.js", { cache: "force-cache" });
      if (!response.ok) return;
      const source = await response.text();
      const group = mainPdfGroup(select);
      for (const def of ONLINE_DISCOVERY_DEFS) {
        const token = new RegExp(`["']${def.value}["']|\\b${def.value}\\b`, "i");
        if (!token.test(source)) continue;
        const exists = Array.from(select.options || []).some((o) =>
          String(o.value || "").toLowerCase() === def.value ||
          clean(o.textContent) === clean(def.label)
        );
        if (exists) continue;
        const option = document.createElement("option");
        option.value = def.value;
        option.textContent = `${def.label} · ONLINE`;
        option.dataset.nlkhDiscoveredOnline = "1";
        group.appendChild(option);
      }
    } catch (_) {}
  }

  function ensureOptions() {
    const select = taskSelect();
    if (!select) return false;
    if (state.optionsReady && select.dataset.nlkhHybridOptionsV26 === "1") return true;

    const groups = Array.from(select.querySelectorAll("optgroup"));
    let group = groups.find((g) => /pdf/.test(clean(g.label)) && !/image|hinh anh/.test(clean(g.label)));
    if (!group) {
      group = document.createElement("optgroup");
      group.label = "Công cụ PDF / PDF tools";
      const imageGroup = groups.find((g) => /image|hinh anh/.test(clean(g.label)));
      if (imageGroup) select.insertBefore(group, imageGroup);
      else select.appendChild(group);
    }

    // Remove only an older hybrid-only optgroup, if present, after moving its role into the main PDF group.
    const oldHybrid = select.querySelector('optgroup[data-nlkh-hybrid="1"]');
    if (oldHybrid && oldHybrid !== group) oldHybrid.remove();

    const optionMatchesDef = (o, def) => {
      if (o.dataset.nlkhKind === def.kind) return true;
      const text = clean(o.textContent);
      if (def.kind === "office-word-pdf") return /word/.test(text) && /pdf/.test(text) && !/pdf.*word/.test(text);
      if (def.kind === "office-excel-pdf") return /excel/.test(text) && /pdf/.test(text) && !/pdf.*excel/.test(text);
      if (def.kind === "office-powerpoint-pdf") return /(powerpoint|ppt)/.test(text) && /pdf/.test(text) && !/pdf.*(powerpoint|ppt)/.test(text);
      if (def.kind === "pdf-docx") return /pdf/.test(text) && /word/.test(text);
      if (def.kind === "pdf-xlsx") return /pdf/.test(text) && /excel/.test(text);
      if (def.kind === "pdf-pptx") return /pdf/.test(text) && /(powerpoint|ppt)/.test(text);
      if (def.kind === "pdf-png") return /pdf/.test(text) && /png/.test(text);
      if (def.kind === "pdf-webp") return /pdf/.test(text) && /webp/.test(text);
      if (def.kind === "pdf-txt") return /pdf/.test(text) && /(txt|text)/.test(text);
      if (def.kind === "pdf-md") return /pdf/.test(text) && /markdown/.test(text);
      if (def.kind === "flatten-form") return /(flatten|lam phang)/.test(text) && /(form|bieu mau)/.test(text);
      if (def.kind === "rasterize") return /(rasterize|raster|lam phang an toan)/.test(text);
      if (def.kind === "grayscale") return /(grayscale|den trang|thang xam)/.test(text);
      if (def.kind === "metadata-clean") return /metadata/.test(text) && /(clean|xoa)/.test(text);
      return false;
    };

    for (const def of TOOL_DEFS) {
      let option = Array.from(select.options || []).find((o) => optionMatchesDef(o, def));
      if (!option) {
        option = document.createElement("option");
        option.value = def.value;
        option.textContent = `${def.label} · ${def.badge}`;
        group.appendChild(option);
      }
      option.dataset.nlkhKind = def.kind;
      if (def.office) option.dataset.nlkhOffice = def.office;
      if (option.parentElement !== group) group.appendChild(option);
    }

    select.dataset.nlkhHybridOptionsV26 = "1";
    state.optionsReady = true;
    return true;
  }

  function switchTool(kind) {
    const select = taskSelect();
    if (!select) return;
    const option = Array.from(select.options).find((o) => o.dataset.nlkhKind === kind);
    if (!option) return;
    select.selectedIndex = Array.from(select.options).indexOf(option);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function injectConvertBar() {
    const old = document.getElementById("nlkh-convert-bar-v2");
    if (old) old.remove();
  }

  function modeButtonByText(name) {
    const wanted = clean(name);
    return Array.from(document.querySelectorAll("button,[role='button']")).find((button) =>
      clean(button.textContent) === wanted
    ) || null;
  }

  function renderModeControls() {
    const auto = state.autoButton && state.autoButton.isConnected ? state.autoButton : document.getElementById("nlkh-pdf-mode-auto-v24");
    const offline = state.offlineButton && state.offlineButton.isConnected ? state.offlineButton : null;
    const online = state.onlineButton && state.onlineButton.isConnected ? state.onlineButton : null;
    const pref = modePreference();

    [[auto, "auto"], [offline, "offline"], [online, "online"]].forEach(([button, value]) => {
      if (!button) return;
      const active = pref === value;
      if (button.classList.contains("active") !== active) button.classList.toggle("active", active);
      if (button.getAttribute("aria-pressed") !== String(active)) button.setAttribute("aria-pressed", String(active));
    });
  }

  function ensureModeControls() {
    if (state.modeReady && state.autoButton?.isConnected && state.offlineButton?.isConnected && state.onlineButton?.isConnected) {
      renderModeControls();
      return true;
    }

    const offline = modeButtonByText("Offline");
    const online = modeButtonByText("Online");
    if (!offline || !online) return false;

    let auto = document.getElementById("nlkh-pdf-mode-auto-v24");
    if (!auto) {
      auto = offline.cloneNode(true);
      auto.id = "nlkh-pdf-mode-auto-v24";
      auto.textContent = "Auto";
      auto.setAttribute("title", "Auto: prefer local processing and use Online only when a task requires server processing.");
      auto.removeAttribute("aria-current");
      offline.parentElement?.insertBefore(auto, offline);
    }

    state.autoButton = auto;
    state.offlineButton = offline;
    state.onlineButton = online;
    state.modeReady = true;

    if (!auto.dataset.nlkhModeBound) {
      auto.dataset.nlkhModeBound = "1";
      auto.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        setModePreference("auto");
      }, true);
    }

    if (!offline.dataset.nlkhModePrefBound) {
      offline.dataset.nlkhModePrefBound = "1";
      offline.addEventListener("click", () => {
        try { localStorage.setItem(MODE_PREF_KEY, "offline"); } catch (_) {}
        syncEffectiveMode();
        renderModeControls();
        applyUi();
      }, true);
    }

    if (!online.dataset.nlkhModePrefBound) {
      online.dataset.nlkhModePrefBound = "1";
      online.addEventListener("click", () => {
        try { localStorage.setItem(MODE_PREF_KEY, "online"); } catch (_) {}
        syncEffectiveMode();
        renderModeControls();
        applyUi();
      }, true);
    }

    renderModeControls();
    return true;
  }

  function field(label, control, hint = "") {
    return `<label class="nlkh-v2-field"><span>${label}</span>${control}${hint ? `<small>${hint}</small>` : ""}</label>`;
  }

  function localNotice(text) {
    return `<div class="nlkh-v2-local"><strong>🔒 LOCAL · Trên thiết bị / On-device</strong><small>${text}</small></div>`;
  }

  function onlineNotice(office) {
    const names = { word: "Word", excel: "Excel", powerpoint: "PowerPoint" };
    return `<div class="nlkh-v2-online"><strong>☁ ONLINE · iLovePDF officepdf</strong>
      <small>${names[office]} → PDF sử dụng luồng Online hiện có. File chỉ được gửi khi chế độ Online được chọn. / File is uploaded only when Online mode is selected.</small></div>`;
  }

  function uiFor(kind) {
    if (kind.startsWith("office-")) {
      const office = kind.split("-")[1];
      return onlineNotice(office) + `<div class="nlkh-v2-note">${bilingual(
        "Nếu đang ở Offline, nút xử lý sẽ không upload và sẽ yêu cầu chuyển sang Online.",
        "In Offline mode processing is blocked and no upload occurs."
      )}</div>`;
    }

    if (["pdf-docx", "pdf-xlsx", "pdf-pptx"].includes(kind)) {
      const detail = kind === "pdf-docx"
        ? "Word: trích text thành DOCX có thể chỉnh sửa. / Word: extracts editable text into DOCX."
        : kind === "pdf-xlsx"
          ? "Excel: mỗi trang PDF thành một sheet; text được xếp theo dòng/cột gần đúng. / Excel: one sheet per PDF page with text positioned into rows/cells."
          : "PowerPoint: mỗi trang PDF thành một slide ảnh để giữ hình thức trang. / PowerPoint: one rendered PDF page per slide for visual fidelity.";
      return localNotice(detail) + `<div class="nlkh-v2-grid">
        ${field("Trang / Pages", '<input id="nlkhPages" value="all" placeholder="all hoặc 1-3,5">')}
      </div>`;
    }

    if (["pdf-png", "pdf-webp"].includes(kind)) {
      return localNotice("Render bằng PDF.js trong browser. / Rendered with PDF.js in the browser.") + `<div class="nlkh-v2-grid">
        ${field("Trang / Pages", '<input id="nlkhPages" value="all" placeholder="all hoặc 1-3,5">')}
        ${field("DPI / Resolution", '<select id="nlkhDpi"><option>96</option><option selected>150</option><option>200</option><option>300</option></select>')}
        ${field("Chất lượng / Quality", '<input id="nlkhQuality" type="range" min="45" max="100" value="90"><output id="nlkhQualityOut">90%</output>')}
      </div>`;
    }

    if (["pdf-txt", "pdf-md"].includes(kind)) {
      return localNotice("Đọc text layer; PDF scan cần OCR. / Reads the PDF text layer; scanned PDFs require OCR.") + `<div class="nlkh-v2-grid">
        ${field("Trang / Pages", '<input id="nlkhPages" value="all" placeholder="all hoặc 1-3,5">')}
      </div>`;
    }

    if (kind === "flatten-form") return localNotice("Làm phẳng AcroForm vào PDF. / Flattens AcroForm fields.");
    if (kind === "metadata-clean") return localNotice("Xóa metadata thông dụng. / Clears common document metadata.");
    if (kind === "rasterize" || kind === "grayscale") {
      return localNotice("Render từng trang rồi tạo PDF mới. Text/link/form sẽ không còn tương tác. / Pages are rendered to images and rebuilt as PDF.") + `<div class="nlkh-v2-grid">
        ${field("DPI / Resolution", '<select id="nlkhDpi"><option>120</option><option selected>150</option><option>200</option><option>300</option></select>')}
        ${field("Chất lượng / Quality", '<input id="nlkhQuality" type="range" min="45" max="100" value="86"><output id="nlkhQualityOut">86%</output>')}
      </div>`;
    }

    if (kind === "pdf-jpg") {
      return localNotice("PDF → JPG local khi Offline; Online vẫn để module.js/iLovePDF xử lý.") + `<div class="nlkh-v2-grid">
        ${field("Trang / Pages", '<input id="nlkhPages" value="all" placeholder="all hoặc 1-3,5">')}
        ${field("DPI / Resolution", '<select id="nlkhDpi"><option>96</option><option selected>150</option><option>200</option><option>300</option></select>')}
        ${field("Chất lượng / Quality", '<input id="nlkhQuality" type="range" min="45" max="100" value="90"><output id="nlkhQualityOut">90%</output>')}
      </div>`;
    }

    if (kind === "image-pdf") {
      return localNotice("JPG/PNG/WebP → PDF local khi Offline; Online giữ luồng iLovePDF.") + `<div class="nlkh-v2-grid">
        ${field("Khổ trang / Page size", '<select id="nlkhPageSize"><option value="original">Theo ảnh / Original</option><option value="a4">A4</option><option value="letter">Letter</option></select>')}
        ${field("Lề (mm) / Margin", '<input id="nlkhMargin" type="number" min="0" max="50" value="8">')}
      </div>`;
    }

    if (kind === "compress-local") {
      return localNotice("Offline nén tại browser; Online để iLovePDF xử lý.") + `<div class="nlkh-v2-grid">
        ${field("Chế độ / Mode", '<select id="nlkhCompressMode"><option value="preserve">Giữ vector / Preserve</option><option value="balanced" selected>Cân bằng / Balanced</option><option value="strong">Mạnh / Strong</option></select>')}
      </div>`;
    }

    return "";
  }

  function updateInputPolicy(kind) {
    const input = fileInput();
    if (!input) return;
    const option = selectedOption();

    let accept = null;
    let multiple = null;

    if (option?.dataset.nlkhOffice) {
      accept = OFFICE_ACCEPT[option.dataset.nlkhOffice] || "";
      multiple = true;
    } else if (kind === "image-pdf") {
      accept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
      multiple = true;
    } else if (kind || String(taskSelect()?.value || "").toLowerCase().includes("pdf")) {
      if (LOCAL_KINDS.has(kind) || LOCAL_EXISTING_KINDS.has(kind)) {
        accept = "application/pdf,.pdf";
        multiple = false;
      }
    }

    if (accept !== null && input.accept !== accept) input.accept = accept;
    if (multiple !== null && input.multiple !== multiple) input.multiple = multiple;
  }

  function bindQuality() {
    const q = el("nlkhQuality"), out = el("nlkhQualityOut");
    if (q && out) {
      const sync = () => out.textContent = `${q.value}%`;
      q.addEventListener("input", sync);
      sync();
    }
  }

  function applyUi() {
    syncEffectiveMode();
    renderModeControls();

    const kind = selectedKind();
    updateInputPolicy(kind);
    if (!kind) return;

    const options = el("toolOptions");
    if (options) {
      const marker = `hybrid-v25:${kind}:${modePreference()}:${mode()}`;
      if (options.dataset.nlkhHybridUi !== marker) {
        options.innerHTML = uiFor(kind);
        options.dataset.nlkhHybridUi = marker;
        options.classList.remove("hidden");
        bindQuality();
      }
    }

    const processText = el("processButtonText");
    if (processText && !kind.startsWith("office-")) {
      const next = bilingual("Xử lý trên thiết bị", "Process locally");
      if (processText.textContent !== next) processText.textContent = next;
    }
  }

  async function runLocal(kind, files) {
    const file = files[0];
    if (!file) throw new Error(bilingual("Hãy chọn tệp.", "Please select a file."));

    if (kind === "pdf-docx") return pdfToDocx(file);
    if (kind === "pdf-xlsx") return pdfToXlsx(file);
    if (kind === "pdf-pptx") return pdfToPptx(file);
    if (kind === "pdf-png") return pdfToImages(file, "png");
    if (kind === "pdf-webp") return pdfToImages(file, "webp");
    if (kind === "pdf-txt") return pdfToText(file, false);
    if (kind === "pdf-md") return pdfToText(file, true);
    if (kind === "flatten-form") return flattenForm(file);
    if (kind === "metadata-clean") return cleanMetadata(file);

    if (kind === "rasterize" || kind === "grayscale") {
      const dpi = Number(el("nlkhDpi")?.value || 150);
      const quality = Number(el("nlkhQuality")?.value || 86) / 100;
      return {
        name: `${safeBase(file.name)}-${kind === "grayscale" ? "grayscale" : "rasterized"}.pdf`,
        blob: await rasterPdf(file, kind === "grayscale", dpi, quality),
      };
    }

    if (kind === "pdf-jpg") return pdfToImages(file, "jpg");
    if (kind === "image-pdf") return imagesToPdf(files);
    if (kind === "compress-local") return compressLocal(file);

    throw new Error(`Unsupported local task: ${kind}`);
  }

  async function processCapture(event) {
    syncEffectiveMode();
    const kind = selectedKind();
    const pref = modePreference();

    if (isOfficeOnlineSelection()) {
      if (pref === "offline") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setStatus(bilingual(
          "Tác vụ Office → PDF cần Online. Chế độ Offline không tải file lên server.",
          "Office → PDF requires Online. Offline mode never uploads the file."
        ), "error");
      }
      // Auto resolves this task to Online; Online stays Online.
      // Existing module.js handles officepdf.
      return;
    }

    if (kind && LOCAL_KINDS.has(kind) && pref === "online") {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus(bilingual(
        "Tác vụ này hiện chỉ có bộ xử lý Local. Hãy chọn Auto hoặc Offline.",
        "This task currently has a Local engine only. Choose Auto or Offline."
      ), "error");
      return;
    }

    if (!kind) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const files = currentFiles();
    if (!files.length) {
      setStatus(bilingual("Hãy chọn tệp trước.", "Please select a file first."), "error");
      return;
    }

    revokeResult();
    const resultContainer = el("resultContainer");
    if (resultContainer) resultContainer.classList.add("hidden");
    setBusy(true);
    try {
      const result = await runLocal(kind, files);
      showResult(result.blob, result.name);
    } catch (error) {
      console.error(error);
      setStatus(`${bilingual("Lỗi", "Error")}: ${error?.message || error}`, "error");
    } finally {
      setBusy(false);
    }
  }

  function unregisterV1Worker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        const url = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
        if (/pdf-local-sw-v1\.js/i.test(url)) reg.unregister().catch(() => {});
      });
    }).catch(() => {});
  }

  function bind() {
    if (state.booted) return true;

    const select = taskSelect();
    if (!select) return false;

    injectConvertBar();
    ensureOptions();
    discoverExistingOnlineTools();
    ensureModeControls();
    syncEffectiveMode();
    applyUi();
    unregisterV1Worker();

    if (!select.dataset.nlkhHybridBound) {
      select.dataset.nlkhHybridBound = "1";
      select.addEventListener("change", () => {
        clearRememberedFiles();
        revokeResult();
        syncEffectiveMode();
        applyUi();
      });
    }

    const input = fileInput();
    if (input && !input.dataset.nlkhHybridBound) {
      input.dataset.nlkhHybridBound = "1";
      input.addEventListener("change", () => rememberFiles(input.files), true);
    }

    const process = el("processButton");
    if (process && !process.dataset.nlkhHybridBound) {
      process.dataset.nlkhHybridBound = "1";
      process.addEventListener("click", processCapture, true);
    }

    const download = el("downloadLink");
    if (download && !download.dataset.nlkhHybridBound) {
      download.dataset.nlkhHybridBound = "1";
      download.addEventListener("click", downloadResult, true);
    }

    if (!state.storageBound) {
      state.storageBound = true;
      window.addEventListener("storage", (e) => {
        if (e.key === "nlkh_pdf_mode" || e.key === MODE_PREF_KEY) {
          syncEffectiveMode();
          renderModeControls();
          applyUi();
        }
      });
    }

    state.booted = true;
    return true;
  }

  function boot(attempt = 0) {
    if (bind()) return;
    if (attempt >= 12) return;
    setTimeout(() => boot(attempt + 1), 100);
  }

  function bootAfterLegacyUi() {
    requestAnimationFrame(() => requestAnimationFrame(() => boot(0)));
  }

  if (document.readyState === "complete") bootAfterLegacyUi();
  else window.addEventListener("load", bootAfterLegacyUi, { once: true });

})();