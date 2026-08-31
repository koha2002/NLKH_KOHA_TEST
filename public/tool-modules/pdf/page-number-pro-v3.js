(() => {
  "use strict";

  // NLKH_PDF_PAGE_NUMBER_PRO_V3
  // Isolated enhancement: activates ONLY for the existing "Page numbers" task.
  // No other PDF task is modified.

  const ROOT_ID = "nlkh-page-number-pro-v3";
  const PREVIEW_ID = `${ROOT_ID}-preview`;

  const state = {
    position: "bottom-center",
    marginMm: 10,
    offsetXmm: 0,
    offsetYmm: 0,
    customXmm: 20,
    customYmm: 15,
    font: "Helvetica",
    size: 12,
    format: "number",
    startPage: 1,
    startNumber: 1,
    numberRotation: 0,
    previewPage: 1,
    pageCount: 0,
    detectedRotation: 0,
    files: new Map(),
    previewUrl: "",
    previewTimer: 0,
    rendering: false,
    active: false,
  };

  const $all = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, Number(value) || 0));

  const mmToPt = (mm) => Number(mm || 0) * 72 / 25.4;

  const normAngle = (value) =>
    ((Math.round(Number(value) || 0) % 360) + 360) % 360;

  function isVi() {
    const htmlLang = String(document.documentElement.lang || "").toLowerCase();
    if (htmlLang.startsWith("vi")) return true;
    if (htmlLang.startsWith("en")) return false;

    const text = String(document.body?.innerText || "").slice(0, 600);
    return /Thiết lập tác vụ|Đánh số trang|Bắt đầu xử lý/.test(text);
  }

  function t(vi, en) {
    return isVi() ? vi : en;
  }

  function taskSelect() {
    return $all("select").find((select) =>
      Array.from(select.options || []).some((option) =>
        /đánh số trang|page numbers?|page numbering/i.test(option.textContent || "")
      )
    ) || null;
  }

  function isNumberTask() {
    const select = taskSelect();
    if (!select) return false;

    const option = select.options?.[select.selectedIndex];
    const text = `${select.value || ""} ${option?.textContent || ""}`.toLowerCase();

    return /đánh số trang|page numbers?|page numbering|\bnumbers\b/.test(text);
  }

  function findProcessButton() {
    return $all("button").find((button) =>
      /bắt đầu xử lý|start processing|process/i.test(
        (button.textContent || "").replace(/\s+/g, " ").trim()
      )
    ) || null;
  }

  function findLeftPanel() {
    const select = taskSelect();
    const process = findProcessButton();
    if (!select) return null;

    let node = select.parentElement;
    while (node && node !== document.body) {
      if (process && node.contains(process)) return node;
      node = node.parentElement;
    }

    return select.parentElement;
  }

  function findPreviewPanel() {
    const heading = $all("h1,h2,h3,strong,span,div").find((node) => {
      const own = (node.textContent || "").replace(/\s+/g, " ").trim();
      return own === "Tệp & xem trước" || own === "Files & preview" || own === "File & preview";
    });

    if (heading) {
      let node = heading.parentElement;
      while (node && node !== document.body) {
        const r = node.getBoundingClientRect();
        if (r.width >= 430 && r.height >= 300) return node;
        node = node.parentElement;
      }
    }

    const ready = $all("h1,h2,h3,strong,p,div").find((node) => {
      const own = (node.textContent || "").replace(/\s+/g, " ").trim();
      return own === "Tệp đã sẵn sàng" || own === "File ready";
    });

    if (ready) {
      let node = ready.parentElement;
      while (node && node !== document.body) {
        const r = node.getBoundingClientRect();
        if (r.width >= 380 && r.height >= 260) return node;
        node = node.parentElement;
      }
    }

    return null;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("data-")) node.setAttribute(key, value);
      else if (key === "title") node.title = value;
      else node[key] = value;
    }

    for (const child of Array.isArray(children) ? children : [children]) {
      if (child) node.append(child);
    }

    return node;
  }

  function field(labelText, control, hint = "") {
    const label = el("label", { class: "nlkh-pn3-field" });
    label.append(el("span", { class: "nlkh-pn3-label", text: labelText }), control);

    if (hint) {
      label.append(el("small", { text: hint }));
    }

    return label;
  }

  function fileKey(file) {
    return `${file.name}|${file.size}|${file.lastModified}`;
  }

  function rememberFiles(files) {
    for (const file of Array.from(files || [])) {
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        state.files.set(fileKey(file), file);
      }
    }
  }

  function currentFiles() {
    $all('input[type="file"]').forEach((input) => rememberFiles(input.files));
    return Array.from(state.files.values());
  }

  function createConfig() {
    if (document.getElementById(ROOT_ID)) return;

    const panel = findLeftPanel();
    const process = findProcessButton();

    if (!panel || !process) return;

    const root = el("section", {
      id: ROOT_ID,
      class: "nlkh-pn3-config",
    });

    root.append(
      el("div", { class: "nlkh-pn3-head" }, [
        el("div", {}, [
          el("strong", {
            text: t("Thiết lập đánh số trang", "Page numbering settings"),
          }),
          el("p", {
            text: t(
              "Chỉ áp dụng cho tác vụ Đánh số trang. Mọi thay đổi được xem trước trên trang PDF thật ở bảng bên phải.",
              "Only applies to Page numbers. Every change is previewed on the real PDF page in the right panel."
            ),
          }),
        ]),
        el("span", { class: "nlkh-pn3-badge", text: "PAGE #" }),
      ])
    );

    const presetWrap = el("div", { class: "nlkh-pn3-position-section" });
    presetWrap.append(
      el("span", {
        class: "nlkh-pn3-label",
        text: t("Vị trí số trang", "Number position"),
      })
    );

    const grid = el("div", { class: "nlkh-pn3-position-grid" });

    const presets = [
      ["top-left", "↖", "Trên trái", "Top left"],
      ["top-center", "↑", "Trên giữa", "Top center"],
      ["top-right", "↗", "Trên phải", "Top right"],
      ["middle-left", "←", "Giữa trái", "Middle left"],
      ["middle-center", "•", "Chính giữa", "Center"],
      ["middle-right", "→", "Giữa phải", "Middle right"],
      ["bottom-left", "↙", "Dưới trái", "Bottom left"],
      ["bottom-center", "↓", "Dưới giữa", "Bottom center"],
      ["bottom-right", "↘", "Dưới phải", "Bottom right"],
    ];

    const customRow = el("div", { class: "nlkh-pn3-custom-row" });

    function selectPosition(value) {
      state.position = value;

      root.querySelectorAll("[data-pn-position]").forEach((button) => {
        button.classList.toggle(
          "active",
          button.getAttribute("data-pn-position") === value
        );
      });

      customRow.classList.toggle("enabled", value === "custom");
      schedulePreview();
    }

    for (const [value, icon, viLabel, enLabel] of presets) {
      const button = el("button", {
        type: "button",
        class: `nlkh-pn3-pos ${state.position === value ? "active" : ""}`,
        title: t(viLabel, enLabel),
        text: icon,
        "data-pn-position": value,
      });

      button.addEventListener("click", () => selectPosition(value));
      grid.append(button);
    }

    const customButton = el("button", {
      type: "button",
      class: "nlkh-pn3-custom-button",
      text: t("⌖ Tọa độ tùy chỉnh", "⌖ Custom coordinates"),
      "data-pn-position": "custom",
    });
    customButton.addEventListener("click", () => selectPosition("custom"));

    const customX = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: 0,
      step: 1,
      value: state.customXmm,
    });
    customX.addEventListener("input", () => {
      state.customXmm = Math.max(0, Number(customX.value) || 0);
      schedulePreview();
    });

    const customY = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: 0,
      step: 1,
      value: state.customYmm,
    });
    customY.addEventListener("input", () => {
      state.customYmm = Math.max(0, Number(customY.value) || 0);
      schedulePreview();
    });

    customRow.append(
      field(
        t("X từ mép trái (mm)", "X from left (mm)"),
        customX,
        t("Tọa độ theo trang sau khi tính xoay.", "Coordinate on the visually rotated page.")
      ),
      field(
        t("Y từ mép dưới (mm)", "Y from bottom (mm)"),
        customY,
        t("0 mm = sát mép dưới của trang.", "0 mm = page bottom edge.")
      )
    );

    presetWrap.append(grid, customButton, customRow);
    root.append(presetWrap);

    const font = el("select", { class: "nlkh-pn3-control" });
    [
      ["Helvetica", "Helvetica / Arial"],
      ["HelveticaBold", "Helvetica Bold / Arial Bold"],
      ["TimesRoman", "Times Roman / Times New Roman"],
      ["TimesRomanBold", "Times Roman Bold"],
      ["Courier", "Courier / Courier New"],
      ["CourierBold", "Courier Bold"],
    ].forEach(([value, label]) => {
      const option = el("option", { value, text: label });
      if (state.font === value) option.selected = true;
      font.append(option);
    });
    font.addEventListener("change", () => {
      state.font = font.value;
      schedulePreview();
    });

    const size = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: 6,
      max: 72,
      step: 1,
      value: state.size,
    });
    size.addEventListener("input", () => {
      state.size = clamp(size.value, 6, 72);
      schedulePreview();
    });

    const format = el("select", { class: "nlkh-pn3-control" });
    [
      ["number", "1, 2, 3…", "1, 2, 3…"],
      ["dash", "- 1 -", "- 1 -"],
      ["page", "Trang 1", "Page 1"],
      ["fraction", "1 / 20", "1 / 20"],
      ["page-fraction", "Trang 1 / 20", "Page 1 / 20"],
    ].forEach(([value, viLabel, enLabel]) => {
      const option = el("option", {
        value,
        text: t(viLabel, enLabel),
      });
      if (state.format === value) option.selected = true;
      format.append(option);
    });
    format.addEventListener("change", () => {
      state.format = format.value;
      schedulePreview();
    });

    const startPage = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: 1,
      step: 1,
      value: state.startPage,
    });
    startPage.addEventListener("input", () => {
      state.startPage = Math.max(1, Math.floor(Number(startPage.value) || 1));
      schedulePreview();
    });

    const startNumber = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: 0,
      step: 1,
      value: state.startNumber,
    });
    startNumber.addEventListener("input", () => {
      state.startNumber = Math.max(0, Math.floor(Number(startNumber.value) || 0));
      schedulePreview();
    });

    const margin = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      value: state.marginMm,
    });
    margin.addEventListener("input", () => {
      state.marginMm = clamp(margin.value, 0, 100);
      schedulePreview();
    });

    const offsetX = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: -200,
      max: 200,
      step: 1,
      value: state.offsetXmm,
    });
    offsetX.addEventListener("input", () => {
      state.offsetXmm = clamp(offsetX.value, -200, 200);
      schedulePreview();
    });

    const offsetY = el("input", {
      class: "nlkh-pn3-control",
      type: "number",
      min: -200,
      max: 200,
      step: 1,
      value: state.offsetYmm,
    });
    offsetY.addEventListener("input", () => {
      state.offsetYmm = clamp(offsetY.value, -200, 200);
      schedulePreview();
    });

    const rotation = el("select", { class: "nlkh-pn3-control" });
    [
      [0, "0°"],
      [90, "90°"],
      [180, "180°"],
      [270, "270°"],
    ].forEach(([value, label]) => {
      const option = el("option", { value, text: label });
      if (state.numberRotation === value) option.selected = true;
      rotation.append(option);
    });
    rotation.addEventListener("change", () => {
      state.numberRotation = normAngle(rotation.value);
      schedulePreview();
    });

    root.append(
      el("div", { class: "nlkh-pn3-grid" }, [
        field(t("Font số trang", "Number font"), font),
        field(t("Cỡ số trang", "Number size"), size, "6–72 pt"),
        field(t("Kiểu hiển thị", "Number style"), format),
        field(
          t("Đánh từ trang PDF", "Start on PDF page"),
          startPage,
          t(
            "Ví dụ 2 = bỏ bìa, trang PDF thứ 2 mới bắt đầu được đánh số.",
            "Example: 2 skips the cover; numbering starts on PDF page 2."
          )
        ),
        field(
          t("Số bắt đầu", "Starting number"),
          startNumber,
          t(
            "Ví dụ: trang PDF thứ 5 có thể bắt đầu hiển thị số 1.",
            "Example: PDF page 5 can start with displayed number 1."
          )
        ),
        field(
          t("Cách mép (mm)", "Edge margin (mm)"),
          margin,
          t("Áp dụng cho 9 vị trí nhanh.", "Used by the 9 position presets.")
        ),
        field(
          t("Dịch ngang X (mm)", "Horizontal X offset (mm)"),
          offsetX,
          t("Âm = sang trái, dương = sang phải.", "Negative = left, positive = right.")
        ),
        field(
          t("Dịch dọc Y (mm)", "Vertical Y offset (mm)"),
          offsetY,
          t("Âm = xuống, dương = lên.", "Negative = down, positive = up.")
        ),
        field(
          t("Xoay số trên trang", "Rotate number on page"),
          rotation,
          t(
            "Trang PDF xoay 90°/180°/270° sẽ được tự nhận diện; số vẫn được đặt theo hướng nhìn của trang.",
            "Rotated PDF pages are auto-detected; placement uses the visual page orientation."
          )
        ),
      ])
    );

    const processRow = process.closest("div") || process;
    if (processRow.parentElement) {
      processRow.parentElement.insertBefore(root, processRow);
    } else {
      panel.append(root);
    }
  }

  function createPreview() {
    if (document.getElementById(PREVIEW_ID)) return;

    const host = findPreviewPanel();
    if (!host) return;

    const root = el("section", {
      id: PREVIEW_ID,
      class: "nlkh-pn3-preview",
    });

    const pageInput = el("input", {
      type: "number",
      min: 1,
      step: 1,
      value: state.previewPage,
      class: "nlkh-pn3-preview-page",
      title: t("Trang xem trước", "Preview page"),
    });

    const total = el("span", { text: "/ ?" });

    const prev = el("button", {
      type: "button",
      text: "←",
      title: t("Trang trước", "Previous page"),
    });

    const next = el("button", {
      type: "button",
      text: "→",
      title: t("Trang sau", "Next page"),
    });

    prev.addEventListener("click", () => {
      state.previewPage = Math.max(1, state.previewPage - 1);
      pageInput.value = state.previewPage;
      schedulePreview();
    });

    next.addEventListener("click", () => {
      const max = state.pageCount || state.previewPage + 1;
      state.previewPage = Math.min(max, state.previewPage + 1);
      pageInput.value = state.previewPage;
      schedulePreview();
    });

    pageInput.addEventListener("change", () => {
      const max = state.pageCount || 999999;
      state.previewPage = Math.max(1, Math.min(max, Math.floor(Number(pageInput.value) || 1)));
      pageInput.value = state.previewPage;
      schedulePreview();
    });

    const rotationInfo = el("span", {
      class: "nlkh-pn3-rotation-info",
      text: t("Xoay trang: chưa đọc", "Page rotation: unknown"),
    });

    const bar = el("div", { class: "nlkh-pn3-preview-bar" }, [
      el("div", {}, [
        el("strong", {
          text: t("Xem trước số trang", "Page number preview"),
        }),
        el("small", {
          text: t(
            "Trang thật + đúng font/cỡ/vị trí/xoay trước khi xuất file.",
            "Real page + actual font/size/position/rotation before export."
          ),
        }),
      ]),
      el("div", { class: "nlkh-pn3-preview-tools" }, [
        rotationInfo,
        prev,
        pageInput,
        total,
        next,
      ]),
    ]);

    const body = el("div", { class: "nlkh-pn3-preview-body" }, [
      el("div", {
        class: "nlkh-pn3-preview-empty",
        text: t(
          "Chọn PDF để xem trước trực tiếp số trang trên tài liệu.",
          "Select a PDF to preview the page number directly on the document."
        ),
      }),
    ]);

    root.append(bar, body);
    root._pageInput = pageInput;
    root._total = total;
    root._body = body;
    root._rotationInfo = rotationInfo;

    host.append(root);
  }

  async function ensurePdfLib() {
    if (window.PDFLib?.PDFDocument) return window.PDFLib;
    if (typeof window.ensurePDFLib !== "function") {
      throw new Error(
        t("Không tìm thấy bộ nạp PDF engine.", "PDF engine loader is unavailable.")
      );
    }
    return window.ensurePDFLib();
  }

  function standardFontName() {
    const fonts = window.PDFLib?.StandardFonts || {};
    return fonts[state.font] || fonts.Helvetica;
  }

  function pageRotation(page) {
    return normAngle(page.getRotation?.().angle || 0);
  }

  function visualPageSize(page) {
    const { width, height } = page.getSize();
    const rotation = pageRotation(page);

    if (rotation === 90 || rotation === 270) {
      return {
        width: height,
        height: width,
        rawWidth: width,
        rawHeight: height,
        rotation,
      };
    }

    return {
      width,
      height,
      rawWidth: width,
      rawHeight: height,
      rotation,
    };
  }

  function labelText(number, total) {
    if (state.format === "dash") return `- ${number} -`;
    if (state.format === "page") return t(`Trang ${number}`, `Page ${number}`);
    if (state.format === "fraction") return `${number} / ${total}`;
    if (state.format === "page-fraction") {
      return t(`Trang ${number} / ${total}`, `Page ${number} / ${total}`);
    }
    return String(number);
  }

  function visualTextBox(font, label) {
    const width = font.widthOfTextAtSize(label, state.size);
    const height = font.heightAtSize(state.size);
    const angle = normAngle(state.numberRotation);

    if (angle === 90 || angle === 270) {
      return {
        width: height,
        height: width,
      };
    }

    return { width, height };
  }

  function visualPoint(page, font, label) {
    const size = visualPageSize(page);
    const box = visualTextBox(font, label);

    if (state.position === "custom") {
      return {
        x: mmToPt(state.customXmm + state.offsetXmm),
        y: mmToPt(state.customYmm + state.offsetYmm),
        size,
      };
    }

    const margin = mmToPt(state.marginMm);
    const ox = mmToPt(state.offsetXmm);
    const oy = mmToPt(state.offsetYmm);
    const [vertical, horizontal] = state.position.split("-");

    let x = margin;
    let y = margin;

    if (horizontal === "center") {
      x = (size.width - box.width) / 2;
    } else if (horizontal === "right") {
      x = size.width - margin - box.width;
    }

    if (vertical === "middle") {
      y = (size.height - box.height) / 2;
    } else if (vertical === "top") {
      y = size.height - margin - box.height;
    }

    return {
      x: x + ox,
      y: y + oy,
      size,
    };
  }

  function visualToRaw(page, vx, vy) {
    const { width, height } = page.getSize();
    const rotation = pageRotation(page);

    // Coordinates supplied by the UI are always on the VISUAL page.
    // Convert them to the raw PDF coordinate system.
    if (rotation === 90) {
      return { x: width - vy, y: vx };
    }

    if (rotation === 180) {
      return { x: width - vx, y: height - vy };
    }

    if (rotation === 270) {
      return { x: vy, y: height - vx };
    }

    return { x: vx, y: vy };
  }

  async function drawPageNumber(page, font, pdfPageIndex, pageCount) {
    const pdfPageNumber = pdfPageIndex + 1;

    if (pdfPageNumber < state.startPage) return;

    const number =
      state.startNumber +
      (pdfPageNumber - state.startPage);

    const numberedTotal =
      Math.max(0, pageCount - state.startPage + 1);

    const label = labelText(number, numberedTotal);
    const point = visualPoint(page, font, label);
    const raw = visualToRaw(page, point.x, point.y);

    // Page /Rotate is viewer rotation. Add it to the requested visual
    // number rotation so the number remains correctly oriented on the
    // visually rotated page.
    const rawTextRotation =
      normAngle(pageRotation(page) + state.numberRotation);

    page.drawText(label, {
      x: raw.x,
      y: raw.y,
      size: state.size,
      font,
      rotate: window.PDFLib.degrees(rawTextRotation),
      color: window.PDFLib.rgb(0, 0, 0),
    });
  }

  async function previewBlob(file) {
    await ensurePdfLib();

    const bytes = await file.arrayBuffer();
    const source = await window.PDFLib.PDFDocument.load(bytes, {
      ignoreEncryption: true,
    });

    state.pageCount = source.getPageCount();

    if (state.pageCount < 1) {
      throw new Error(t("PDF không có trang.", "PDF has no pages."));
    }

    state.previewPage = Math.max(
      1,
      Math.min(state.pageCount, state.previewPage)
    );

    const output = await window.PDFLib.PDFDocument.create();
    const [page] = await output.copyPages(source, [state.previewPage - 1]);
    output.addPage(page);

    state.detectedRotation = pageRotation(page);

    const font = await output.embedFont(standardFontName());
    await drawPageNumber(
      page,
      font,
      state.previewPage - 1,
      state.pageCount
    );

    return new Blob(
      [await output.save()],
      { type: "application/pdf" }
    );
  }

  async function renderPreview() {
    const root = document.getElementById(PREVIEW_ID);

    if (!root || !isNumberTask() || state.rendering) return;

    const files = currentFiles();
    const body = root._body || root.querySelector(".nlkh-pn3-preview-body");

    if (!body) return;

    if (!files.length) {
      body.innerHTML = "";
      body.append(
        el("div", {
          class: "nlkh-pn3-preview-empty",
          text: t(
            "Chọn PDF để xem trước trực tiếp số trang trên tài liệu.",
            "Select a PDF to preview the page number directly on the document."
          ),
        })
      );
      return;
    }

    state.rendering = true;
    body.classList.add("loading");

    try {
      const blob = await previewBlob(files[0]);

      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }

      state.previewUrl = URL.createObjectURL(blob);

      body.innerHTML = "";
      body.append(
        el("iframe", {
          class: "nlkh-pn3-preview-frame",
          src: `${state.previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`,
          title: t("Xem trước đánh số trang", "Page-number preview"),
        })
      );

      if (root._pageInput) {
        root._pageInput.value = state.previewPage;
        root._pageInput.max = state.pageCount;
      }

      if (root._total) {
        root._total.textContent = `/ ${state.pageCount}`;
      }

      if (root._rotationInfo) {
        root._rotationInfo.textContent = t(
          `Trang xoay: ${state.detectedRotation}°`,
          `Page rotation: ${state.detectedRotation}°`
        );
      }
    } catch (error) {
      body.innerHTML = "";
      body.append(
        el("div", {
          class: "nlkh-pn3-preview-error",
          text:
            `${t("Không tạo được xem trước:", "Preview failed:")} ` +
            `${error?.message || error}`,
        })
      );
    } finally {
      state.rendering = false;
      body.classList.remove("loading");
    }
  }

  function schedulePreview() {
    clearTimeout(state.previewTimer);

    state.previewTimer = window.setTimeout(() => {
      void renderPreview();
    }, 180);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  async function numberPdf(file) {
    const bytes = await file.arrayBuffer();
    const pdf = await window.PDFLib.PDFDocument.load(bytes, {
      ignoreEncryption: true,
    });

    const pageCount = pdf.getPageCount();

    if (state.startPage > pageCount) {
      throw new Error(
        t(
          `Trang bắt đầu ${state.startPage} vượt quá tổng ${pageCount} trang của ${file.name}.`,
          `Start page ${state.startPage} exceeds ${pageCount} pages in ${file.name}.`
        )
      );
    }

    const font = await pdf.embedFont(standardFontName());

    for (
      let index = state.startPage - 1;
      index < pageCount;
      index++
    ) {
      await drawPageNumber(
        pdf.getPage(index),
        font,
        index,
        pageCount
      );
    }

    const output = await pdf.save();
    const base = file.name.replace(/\.pdf$/i, "");

    return {
      blob: new Blob([output], { type: "application/pdf" }),
      name: `${base}-numbered.pdf`,
    };
  }

  async function processNumbers(button) {
    try {
      await ensurePdfLib();
    } catch (error) {
      alert(
        `${t("Không thể nạp PDF engine:", "Could not load PDF engine:")} ` +
        `${error?.message || error}`
      );
      return;
    }

    const files = currentFiles();

    if (!files.length) {
      alert(
        t(
          "Hãy chọn ít nhất một file PDF.",
          "Please select at least one PDF."
        )
      );
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = t(
      "Đang đánh số trang…",
      "Adding page numbers…"
    );

    try {
      for (const file of files) {
        const result = await numberPdf(file);
        downloadBlob(result.blob, result.name);
      }

      const config = document.getElementById(ROOT_ID);
      config?.querySelector(".nlkh-pn3-done")?.remove();

      config?.append(
        el("div", {
          class: "nlkh-pn3-done",
          text: t(
            `Đã đánh số ${files.length} PDF. File được xử lý cục bộ trên trình duyệt.`,
            `Numbered ${files.length} PDF file(s). Processing stayed local in the browser.`
          ),
        })
      );
    } catch (error) {
      alert(
        `${t("Không thể đánh số trang:", "Could not add page numbers:")} ` +
        `${error?.message || error}`
      );
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function refreshUi() {
    createConfig();
    createPreview();

    const active = isNumberTask();
    const becameActive = active && !state.active;
    state.active = active;

    const config = document.getElementById(ROOT_ID);
    const preview = document.getElementById(PREVIEW_ID);

    if (config) config.hidden = !active;
    if (preview) preview.hidden = !active;

    if (becameActive) {
      currentFiles();
      schedulePreview();
    }
  }

  document.addEventListener(
    "change",
    (event) => {
      const target = event.target;

      if (target?.matches?.('input[type="file"]')) {
        rememberFiles(target.files);
        schedulePreview();
      }

      if (target?.matches?.("select") && target === taskSelect()) {
        refreshUi();
      }
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      const button = event.target?.closest?.("button");
      if (!button) return;

      const label =
        (button.textContent || "").replace(/\s+/g, " ").trim();

      if (/xóa tất cả|remove all|clear all/i.test(label)) {
        state.files.clear();
        schedulePreview();
        return;
      }

      if (/^xóa\b|^remove\b/i.test(label)) {
        const row =
          button.closest("li,article,.file-item,.file-row") ||
          button.parentElement;

        const text = row?.textContent || "";

        for (const [key, file] of state.files.entries()) {
          if (text.includes(file.name)) {
            state.files.delete(key);
          }
        }

        schedulePreview();
        return;
      }

      if (
        isNumberTask() &&
        /bắt đầu xử lý|start processing|process/i.test(label)
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        void processNumbers(button);
      }
    },
    true
  );

  const observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = window.setTimeout(refreshUi, 100);
  });

  function boot() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    refreshUi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();