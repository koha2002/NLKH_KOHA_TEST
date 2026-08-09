(function initComtradeStudio() {
  "use strict";

  const core = window.ComtradeCore;
  const Plotly = window.Plotly;
  if (!core) throw new Error("COMTRADE Core chưa được nạp.");

  const elements = {
    root: document.documentElement,
    langSelect: document.getElementById("langSelect"),
    encodingSelect: document.getElementById("encodingSelect"),
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    cfgStatus: document.getElementById("cfgStatus"),
    datStatus: document.getElementById("datStatus"),
    processBtn: document.getElementById("processBtn"),
    resetBtn: document.getElementById("resetBtn"),
    exportBtn: document.getElementById("exportBtn"),
    errorMsg: document.getElementById("errorMsg"),
    errorText: document.getElementById("errorText"),
    warningMsg: document.getElementById("warningMsg"),
    warningText: document.getElementById("warningText"),
    resultsArea: document.getElementById("resultsArea"),
    metadataGrid: document.getElementById("metadataGrid"),
    channelSearch: document.getElementById("channelSearch"),
    channelCount: document.getElementById("channelCount"),
    analogChart: document.getElementById("analogChart"),
    digitalChart: document.getElementById("digitalChart"),
    analogEmpty: document.getElementById("analogEmpty"),
    digitalEmpty: document.getElementById("digitalEmpty"),
  };

  const translations = {
    vi: {
      eyebrow: "PHÂN TÍCH SỰ CỐ · TẠI THIẾT BỊ",
      title: "COMTRADE Studio",
      localBadge: "100% cục bộ",
      languageLabel: "Ngôn ngữ",
      uploadTitle: "Nạp bản ghi",
      uploadDescription: "Chọn đồng thời tệp cấu hình CFG và dữ liệu DAT. Tệp chỉ được xử lý trong trình duyệt này.",
      encodingLabel: "Bảng mã tệp CFG",
      encodingAuto: "Tự nhận diện",
      encodingGbk: "GB18030 / GBK (Tiếng Trung)",
      encodingUtf8: "UTF-8 (Quốc tế)",
      encodingVi: "Windows-1258 (Tiếng Việt cũ)",
      encodingWest: "Windows-1252 (Phương Tây)",
      dropTitle: "Thả cặp tệp CFG + DAT vào đây",
      dropHint: "hoặc chạm để chọn tệp từ máy",
      dropPrivacy: "Không tải dữ liệu lên Internet",
      cfgMissing: "Chưa chọn tệp cấu hình",
      datMissing: "Chưa chọn tệp dữ liệu",
      selected: "Đã chọn",
      processWaiting: "Chọn đủ hai tệp để phân tích",
      processReady: "Phân tích bản ghi",
      processing: "Đang đọc dữ liệu…",
      reset: "Đặt lại",
      errorTitle: "Không thể đọc bản ghi",
      warningTitle: "Lưu ý",
      differentNames: "Tên hai tệp không giống nhau. Hãy kiểm tra đây có đúng là một cặp CFG/DAT hay không.",
      resultTitle: "Kết quả phân tích",
      exportCsv: "Xuất dữ liệu CSV",
      channelSearchLabel: "Lọc kênh hiển thị",
      channelSearchPlaceholder: "Nhập tên kênh…",
      analogTitle: "Kênh tương tự",
      chartHint: "Kéo để phóng to · nhấp đúp để đặt lại",
      noAnalog: "Bản ghi không có kênh tương tự.",
      digitalTitle: "Kênh trạng thái",
      digitalHint: "Mức 0/1 được xếp theo từng kênh",
      noDigital: "Bản ghi không có kênh trạng thái.",
      station: "Trạm",
      device: "Thiết bị",
      format: "Định dạng",
      channels: "Kênh A / D",
      samples: "Số mẫu",
      duration: "Khoảng thời gian",
      timeAxis: "Thời gian (s)",
      amplitudeAxis: "Biên độ",
      visibleChannels: "{shown}/{total} kênh đang hiển thị",
      noMatch: "Không có kênh khớp bộ lọc.",
      plotUnavailable: "Thư viện biểu đồ offline chưa sẵn sàng. Hãy tải lại trang.",
      fileReadError: "Không thể đọc tệp đã chọn.",
      exportError: "Chưa có dữ liệu để xuất.",
    },
    en: {
      eyebrow: "DISTURBANCE ANALYSIS · ON DEVICE",
      title: "COMTRADE Studio",
      localBadge: "100% local",
      languageLabel: "Language",
      uploadTitle: "Load a record",
      uploadDescription: "Select the CFG configuration and DAT data files together. Files are processed only in this browser.",
      encodingLabel: "CFG text encoding",
      encodingAuto: "Auto detect",
      encodingGbk: "GB18030 / GBK (Chinese)",
      encodingUtf8: "UTF-8 (International)",
      encodingVi: "Windows-1258 (Legacy Vietnamese)",
      encodingWest: "Windows-1252 (Western)",
      dropTitle: "Drop the CFG + DAT pair here",
      dropHint: "or tap to select files",
      dropPrivacy: "No file is uploaded to the Internet",
      cfgMissing: "No configuration file",
      datMissing: "No data file",
      selected: "Selected",
      processWaiting: "Select both files to continue",
      processReady: "Analyze record",
      processing: "Reading data…",
      reset: "Reset",
      errorTitle: "Unable to read record",
      warningTitle: "Check",
      differentNames: "The two filenames do not match. Check that they belong to the same CFG/DAT record.",
      resultTitle: "Analysis result",
      exportCsv: "Export data CSV",
      channelSearchLabel: "Filter visible channels",
      channelSearchPlaceholder: "Enter a channel name…",
      analogTitle: "Analog channels",
      chartHint: "Drag to zoom · double-click to reset",
      noAnalog: "This record has no analog channels.",
      digitalTitle: "Digital channels",
      digitalHint: "0/1 levels are stacked by channel",
      noDigital: "This record has no digital channels.",
      station: "Station",
      device: "Device",
      format: "Format",
      channels: "A / D channels",
      samples: "Samples",
      duration: "Duration",
      timeAxis: "Time (s)",
      amplitudeAxis: "Amplitude",
      visibleChannels: "{shown}/{total} channels visible",
      noMatch: "No channels match the filter.",
      plotUnavailable: "The offline chart library is unavailable. Reload the page.",
      fileReadError: "The selected file could not be read.",
      exportError: "There is no data to export.",
    },
    ru: {
      eyebrow: "АНАЛИЗ АВАРИЙ · НА УСТРОЙСТВЕ",
      title: "COMTRADE Studio",
      localBadge: "100% локально",
      languageLabel: "Язык",
      uploadTitle: "Загрузить запись",
      uploadDescription: "Выберите файлы конфигурации CFG и данных DAT. Обработка выполняется только в браузере.",
      encodingLabel: "Кодировка CFG",
      encodingAuto: "Автоопределение",
      encodingGbk: "GB18030 / GBK (китайский)",
      encodingUtf8: "UTF-8",
      encodingVi: "Windows-1258",
      encodingWest: "Windows-1252",
      dropTitle: "Перетащите пару CFG + DAT",
      dropHint: "или нажмите для выбора",
      dropPrivacy: "Файлы не отправляются в Интернет",
      cfgMissing: "Нет файла конфигурации",
      datMissing: "Нет файла данных",
      selected: "Выбрано",
      processWaiting: "Выберите оба файла",
      processReady: "Анализировать",
      processing: "Чтение данных…",
      reset: "Сбросить",
      errorTitle: "Не удалось прочитать запись",
      warningTitle: "Внимание",
      differentNames: "Имена файлов различаются. Проверьте, что CFG и DAT относятся к одной записи.",
      resultTitle: "Результат анализа",
      exportCsv: "Экспорт CSV",
      channelSearchLabel: "Фильтр каналов",
      channelSearchPlaceholder: "Название канала…",
      analogTitle: "Аналоговые каналы",
      chartHint: "Перетащите для масштаба · двойной щелчок для сброса",
      noAnalog: "Аналоговых каналов нет.",
      digitalTitle: "Дискретные каналы",
      digitalHint: "Уровни 0/1 расположены по каналам",
      noDigital: "Дискретных каналов нет.",
      station: "Станция",
      device: "Устройство",
      format: "Формат",
      channels: "Каналы A / D",
      samples: "Отсчёты",
      duration: "Длительность",
      timeAxis: "Время (с)",
      amplitudeAxis: "Амплитуда",
      visibleChannels: "Показано {shown}/{total}",
      noMatch: "Нет совпадающих каналов.",
      plotUnavailable: "Локальная библиотека графиков недоступна. Перезагрузите страницу.",
      fileReadError: "Не удалось прочитать файл.",
      exportError: "Нет данных для экспорта.",
    },
    zh: {
      eyebrow: "故障分析 · 本地处理",
      title: "COMTRADE Studio",
      localBadge: "100% 本地",
      languageLabel: "语言",
      uploadTitle: "载入记录",
      uploadDescription: "同时选择 CFG 配置文件和 DAT 数据文件。文件仅在当前浏览器中处理。",
      encodingLabel: "CFG 文件编码",
      encodingAuto: "自动检测",
      encodingGbk: "GB18030 / GBK（中文）",
      encodingUtf8: "UTF-8（国际）",
      encodingVi: "Windows-1258",
      encodingWest: "Windows-1252",
      dropTitle: "将 CFG + DAT 文件拖到此处",
      dropHint: "或点击选择文件",
      dropPrivacy: "文件不会上传到互联网",
      cfgMissing: "未选择配置文件",
      datMissing: "未选择数据文件",
      selected: "已选择",
      processWaiting: "请选择两个文件",
      processReady: "分析记录",
      processing: "正在读取数据…",
      reset: "重置",
      errorTitle: "无法读取记录",
      warningTitle: "注意",
      differentNames: "两个文件名不一致，请确认 CFG 和 DAT 属于同一条记录。",
      resultTitle: "分析结果",
      exportCsv: "导出 CSV",
      channelSearchLabel: "筛选显示通道",
      channelSearchPlaceholder: "输入通道名称…",
      analogTitle: "模拟通道",
      chartHint: "拖动缩放 · 双击重置",
      noAnalog: "记录中没有模拟通道。",
      digitalTitle: "数字通道",
      digitalHint: "各通道按 0/1 电平排列",
      noDigital: "记录中没有数字通道。",
      station: "厂站",
      device: "设备",
      format: "格式",
      channels: "A / D 通道",
      samples: "采样数",
      duration: "时长",
      timeAxis: "时间（秒）",
      amplitudeAxis: "幅值",
      visibleChannels: "显示 {shown}/{total} 个通道",
      noMatch: "没有符合筛选条件的通道。",
      plotUnavailable: "本地图表库不可用，请刷新页面。",
      fileReadError: "无法读取所选文件。",
      exportError: "没有可导出的数据。",
    },
  };

  const channelNames = {
    "合位监视": { vi: "Giám sát vị trí đóng", en: "Closed position monitor", ru: "Контроль положения ВКЛ" },
    "跳位监视": { vi: "Giám sát vị trí cắt", en: "Open position monitor", ru: "Контроль положения ОТКЛ" },
    "电流I段跳闸": { vi: "Cắt quá dòng cấp I", en: "Overcurrent stage I trip", ru: "МТЗ 1 ступень" },
    "电流II段跳闸": { vi: "Cắt quá dòng cấp II", en: "Overcurrent stage II trip", ru: "МТЗ 2 ступень" },
    "电流III段跳闸": { vi: "Cắt quá dòng cấp III", en: "Overcurrent stage III trip", ru: "МТЗ 3 ступень" },
    "过流加速跳闸": { vi: "Cắt gia tốc quá dòng", en: "Accelerated overcurrent trip", ru: "Ускорение МТЗ" },
    "过负荷跳闸": { vi: "Cắt quá tải", en: "Overload trip", ru: "Защита от перегрузки" },
    "零序I段跳闸": { vi: "Cắt thứ tự không cấp I", en: "Zero-sequence stage I trip", ru: "ТЗНП 1 ступень" },
    "零序II段跳闸": { vi: "Cắt thứ tự không cấp II", en: "Zero-sequence stage II trip", ru: "ТЗНП 2 ступень" },
    "零序III段跳闸": { vi: "Cắt thứ tự không cấp III", en: "Zero-sequence stage III trip", ru: "ТЗНП 3 ступень" },
    "零序电流跳闸": { vi: "Cắt dòng thứ tự không", en: "Zero-sequence current trip", ru: "ТЗНП отключение" },
    "低压减载跳闸": { vi: "Cắt sa thải điện áp thấp", en: "Low-voltage load shedding", ru: "АЧР по напряжению" },
    "低频减载跳闸": { vi: "Cắt sa thải tần số thấp", en: "Low-frequency load shedding", ru: "АЧР по частоте" },
    "重合闸": { vi: "Đóng lặp lại (F79)", en: "Auto reclose (79)", ru: "АПВ" },
    "手合同期动作": { vi: "Đóng thủ công đồng bộ", en: "Manual synchronised close", ru: "Ручное синхронное вкл." },
  };

  const state = {
    language: ["vi", "en", "ru", "zh"].includes(elements.root.lang) ? elements.root.lang : "vi",
    files: { cfg: null, dat: null },
    cfg: null,
    data: null,
    filter: "",
  };

  function t(key, replacements = {}) {
    let value = (translations[state.language] || translations.vi)[key] || translations.vi[key] || key;
    Object.entries(replacements).forEach(([name, replacement]) => {
      value = value.replace(`{${name}}`, String(replacement));
    });
    return value;
  }

  function translateName(name) {
    const clean = String(name || "").trim();
    if (state.language === "zh") return clean;
    return channelNames[clean]?.[state.language] || clean;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    });
    elements.langSelect.value = state.language;
    elements.root.lang = state.language;
    updateFileStatus();
    updateProcessButton();
    if (state.cfg && state.data) renderResults();
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  function fileStem(file) {
    return file ? file.name.replace(/\.[^.]+$/, "").toLocaleLowerCase() : "";
  }

  function setFileChip(element, file, missingKey) {
    element.classList.toggle("ready", Boolean(file));
    element.classList.toggle("missing", !file);
    const strong = element.querySelector("strong");
    const small = element.querySelector("small");
    strong.textContent = file ? file.name : t(missingKey);
    small.textContent = file ? `${t("selected")} · ${formatBytes(file.size)}` : "—";
  }

  function updateFileStatus() {
    setFileChip(elements.cfgStatus, state.files.cfg, "cfgMissing");
    setFileChip(elements.datStatus, state.files.dat, "datMissing");
    const mismatch = state.files.cfg && state.files.dat && fileStem(state.files.cfg) !== fileStem(state.files.dat);
    elements.warningMsg.hidden = !mismatch;
    elements.warningText.textContent = mismatch ? t("differentNames") : "";
  }

  function updateProcessButton(processing = false) {
    const ready = Boolean(state.files.cfg && state.files.dat);
    elements.processBtn.disabled = !ready || processing;
    elements.processBtn.querySelector("span").textContent = processing ? t("processing") : ready ? t("processReady") : t("processWaiting");
  }

  function clearMessage() {
    elements.errorMsg.hidden = true;
    elements.errorText.textContent = "";
  }

  function showError(message) {
    elements.errorText.textContent = String(message || t("fileReadError"));
    elements.errorMsg.hidden = false;
  }

  function handleFiles(fileList) {
    Array.from(fileList || []).forEach((file) => {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".cfg")) state.files.cfg = file;
      if (lower.endsWith(".dat")) state.files.dat = file;
    });
    clearMessage();
    updateFileStatus();
    updateProcessButton();
  }

  function readBuffer(file) {
    if (!file) return Promise.reject(new Error(t("fileReadError")));
    if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(t("fileReadError")));
      reader.readAsArrayBuffer(file);
    });
  }

  function metadataItem(label, value) {
    const item = document.createElement("article");
    item.className = "metaItem";
    const caption = document.createElement("span");
    const result = document.createElement("strong");
    caption.textContent = label;
    result.textContent = value;
    result.title = value;
    item.append(caption, result);
    return item;
  }

  function renderMetadata() {
    const values = [
      [t("station"), state.cfg.station || "—"],
      [t("device"), state.cfg.deviceId || "—"],
      [t("format"), state.cfg.format],
      [t("channels"), `${state.cfg.analogCount} / ${state.cfg.digitalCount}`],
      [t("samples"), state.data.timestamps.length.toLocaleString(state.language)],
      [t("duration"), `${core.duration(state.data.timestamps).toFixed(4)} s`],
    ];
    elements.metadataGrid.replaceChildren(...values.map(([label, value]) => metadataItem(label, value)));
  }

  function chartTheme() {
    const dark = elements.root.dataset.theme === "dark";
    return {
      paper: dark ? "#0c1828" : "#ffffff",
      plot: dark ? "#0c1828" : "#ffffff",
      text: dark ? "#dbe6f4" : "#172033",
      grid: dark ? "#263951" : "#e3e9f0",
      zero: dark ? "#3a506b" : "#bdc9d8",
    };
  }

  function sampleIndexes(length, maximum = 50000) {
    if (length <= maximum) return Array.from({ length }, (_, index) => index);
    const step = Math.ceil(length / maximum);
    const indexes = [];
    for (let index = 0; index < length; index += step) indexes.push(index);
    if (indexes[indexes.length - 1] !== length - 1) indexes.push(length - 1);
    return indexes;
  }

  function baseLayout() {
    const theme = chartTheme();
    return {
      autosize: true,
      paper_bgcolor: theme.paper,
      plot_bgcolor: theme.plot,
      font: { color: theme.text, family: "Inter, Segoe UI, Arial, sans-serif", size: 12 },
      margin: { l: 70, r: 28, t: 24, b: 60 },
      hovermode: "x unified",
      xaxis: { title: t("timeAxis"), gridcolor: theme.grid, zerolinecolor: theme.zero },
      yaxis: { gridcolor: theme.grid, zerolinecolor: theme.zero },
      legend: { orientation: "h", y: -0.18, x: 0 },
    };
  }

  function filterChannel(name) {
    if (!state.filter) return true;
    return `${name} ${translateName(name)}`.toLocaleLowerCase().includes(state.filter);
  }

  function renderCharts() {
    if (!Plotly) {
      showError(t("plotUnavailable"));
      return;
    }

    const indexes = sampleIndexes(state.data.timestamps.length);
    const x = indexes.map((index) => state.data.timestamps[index]);
    const analogIndexes = state.cfg.analogs.map((_, index) => index).filter((index) => filterChannel(state.cfg.analogs[index].name));
    const digitalIndexes = state.cfg.digitals.map((_, index) => index).filter((index) => filterChannel(state.cfg.digitals[index].name));
    const visible = analogIndexes.length + digitalIndexes.length;
    const total = state.cfg.analogCount + state.cfg.digitalCount;
    elements.channelCount.textContent = visible ? t("visibleChannels", { shown: visible, total }) : t("noMatch");

    elements.analogEmpty.hidden = analogIndexes.length > 0;
    elements.analogChart.hidden = analogIndexes.length === 0;
    if (analogIndexes.length) {
      const analogTraces = analogIndexes.map((channelIndex) => {
        const channel = state.cfg.analogs[channelIndex];
        const unit = channel.unit ? ` (${channel.unit})` : "";
        return {
          x,
          y: indexes.map((index) => state.data.analogData[channelIndex][index]),
          type: "scattergl",
          mode: "lines",
          name: `${translateName(channel.name)}${unit}`,
          line: { width: 1.4 },
        };
      });
      const layout = baseLayout();
      layout.yaxis.title = t("amplitudeAxis");
      Plotly.react(elements.analogChart, analogTraces, layout, { responsive: true, displaylogo: false, scrollZoom: true });
    } else if (Plotly.purge) Plotly.purge(elements.analogChart);

    elements.digitalEmpty.hidden = digitalIndexes.length > 0;
    elements.digitalChart.hidden = digitalIndexes.length === 0;
    if (digitalIndexes.length) {
      const spacing = 1.45;
      const tickValues = [];
      const tickTexts = [];
      const traces = digitalIndexes.map((channelIndex, displayIndex) => {
        const offset = (digitalIndexes.length - displayIndex - 1) * spacing;
        const name = translateName(state.cfg.digitals[channelIndex].name);
        tickValues.push(offset + 0.5);
        tickTexts.push(name);
        return {
          x,
          y: indexes.map((index) => state.data.digitalData[channelIndex][index] + offset),
          type: "scattergl",
          mode: "lines",
          name,
          line: { width: 2, shape: "hv" },
          text: indexes.map((index) => String(state.data.digitalData[channelIndex][index])),
          hovertemplate: "%{fullData.name}<br>%{x:.6f}s · %{text}<extra></extra>",
        };
      });
      const layout = baseLayout();
      layout.margin.l = window.innerWidth < 680 ? 112 : 190;
      layout.showlegend = false;
      layout.yaxis.tickmode = "array";
      layout.yaxis.tickvals = tickValues;
      layout.yaxis.ticktext = tickTexts;
      layout.yaxis.zeroline = false;
      elements.digitalChart.style.height = `${Math.min(920, Math.max(540, 220 + digitalIndexes.length * 38))}px`;
      Plotly.react(elements.digitalChart, traces, layout, { responsive: true, displaylogo: false, scrollZoom: true });
    } else if (Plotly.purge) Plotly.purge(elements.digitalChart);
  }

  function renderResults() {
    if (!state.cfg || !state.data) return;
    renderMetadata();
    renderCharts();
  }

  async function processRecord() {
    clearMessage();
    updateProcessButton(true);
    try {
      const [cfgBuffer, datBuffer] = await Promise.all([readBuffer(state.files.cfg), readBuffer(state.files.dat)]);
      const cfgText = core.decodeCfg(cfgBuffer, elements.encodingSelect.value);
      state.cfg = core.parseCfg(cfgText);
      state.data = core.parseDat(datBuffer, state.cfg);
      state.filter = "";
      elements.channelSearch.value = "";
      elements.resultsArea.hidden = false;
      renderResults();
      window.setTimeout(() => elements.resultsArea.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (error) {
      state.cfg = null;
      state.data = null;
      elements.resultsArea.hidden = true;
      showError(error instanceof Error ? error.message : t("fileReadError"));
    } finally {
      updateProcessButton(false);
    }
  }

  function resetStudio() {
    state.files = { cfg: null, dat: null };
    state.cfg = null;
    state.data = null;
    state.filter = "";
    elements.fileInput.value = "";
    elements.channelSearch.value = "";
    elements.resultsArea.hidden = true;
    elements.warningMsg.hidden = true;
    clearMessage();
    updateFileStatus();
    updateProcessButton();
    if (Plotly?.purge) {
      Plotly.purge(elements.analogChart);
      Plotly.purge(elements.digitalChart);
    }
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportCsv() {
    if (!state.cfg || !state.data) {
      showError(t("exportError"));
      return;
    }
    const headers = ["sample", "time_s", ...state.cfg.analogs.map((channel) => `${channel.name}${channel.unit ? `_${channel.unit}` : ""}`), ...state.cfg.digitals.map((channel) => channel.name)];
    const lines = [headers.map(csvCell).join(",")];
    for (let row = 0; row < state.data.timestamps.length; row += 1) {
      const values = [
        state.data.sampleNumbers[row],
        state.data.timestamps[row],
        ...state.data.analogData.map((channel) => channel[row]),
        ...state.data.digitalData.map((channel) => channel[row]),
      ];
      lines.push(values.map(csvCell).join(","));
    }
    const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileStem(state.files.cfg) || "comtrade"}-data.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  elements.dropzone.addEventListener("click", () => elements.fileInput.click());
  elements.dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      elements.fileInput.click();
    }
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.remove("dragover");
    });
  });
  elements.dropzone.addEventListener("drop", (event) => handleFiles(event.dataTransfer.files));
  elements.fileInput.addEventListener("change", (event) => handleFiles(event.target.files));
  elements.processBtn.addEventListener("click", processRecord);
  elements.resetBtn.addEventListener("click", resetStudio);
  elements.exportBtn.addEventListener("click", exportCsv);
  elements.langSelect.addEventListener("change", (event) => {
    state.language = event.target.value;
    applyTranslations();
  });
  elements.channelSearch.addEventListener("input", (event) => {
    state.filter = event.target.value.trim().toLocaleLowerCase();
    renderCharts();
  });

  const rootObserver = new MutationObserver((mutations) => {
    let redraw = false;
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "lang" && ["vi", "en"].includes(elements.root.lang) && state.language !== elements.root.lang) {
        state.language = elements.root.lang;
        applyTranslations();
      }
      if (mutation.attributeName === "data-theme") redraw = true;
    });
    if (redraw && state.cfg && state.data) renderCharts();
  });
  rootObserver.observe(elements.root, { attributes: true, attributeFilter: ["lang", "data-theme"] });

  applyTranslations();
})();
