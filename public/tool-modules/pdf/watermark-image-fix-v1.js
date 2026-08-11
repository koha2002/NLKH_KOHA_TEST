(function () {
  'use strict';

  var hotfixOfflineResult = null;
  var watermarkObjectUrl = null;

  function el(id) { return document.getElementById(id); }
  function isPdfWatermark() { return el('apiTool') && el('apiTool').value === 'watermark'; }
  function offlineMode() { return (localStorage.getItem('nlkh_pdf_mode') || 'offline') === 'offline'; }

  function injectStyles() {
    if (document.getElementById('wm-image-fix-style')) return;
    var style = document.createElement('style');
    style.id = 'wm-image-fix-style';
    style.textContent = [
      '.wm-image-picker{display:grid;gap:12px}',
      '.wm-image-drop{border:1.5px dashed var(--pdf-line,#dce2ea);border-radius:10px;background:var(--pdf-surface,#fff);padding:14px;display:grid;grid-template-columns:86px 1fr;gap:14px;align-items:center}',
      '.wm-image-thumb{width:86px;height:86px;border:1px solid var(--pdf-line,#dce2ea);border-radius:9px;background:var(--pdf-surface-soft,#f7f8fa);display:grid;place-items:center;overflow:hidden}',
      '.wm-image-thumb img{width:100%;height:100%;object-fit:contain;display:none}',
      '.wm-image-thumb span{font-size:11px;color:var(--pdf-muted,#687488);text-align:center;padding:8px}',
      '.wm-image-meta strong{display:block;font-size:12px;margin-bottom:4px;overflow-wrap:anywhere}',
      '.wm-image-meta small{display:block;color:var(--pdf-muted,#687488);font-size:10px;line-height:1.45}',
      '.wm-image-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
      '.wm-image-actions button,.wm-image-actions label{min-height:36px;padding:8px 12px;border-radius:8px;border:1px solid var(--pdf-line,#dce2ea);background:var(--pdf-surface-soft,#f7f8fa);color:var(--pdf-ink,#0b1324);font-size:11px;font-weight:700;cursor:pointer}',
      '.wm-image-actions .danger{color:#dc2626}',
      '.wm-note{margin:0;color:var(--pdf-muted,#687488);font-size:10px;line-height:1.5}',
      '.wm-image-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}',
      '.wm-image-controls .wide{grid-column:span 1}',
      '@media(max-width:700px){.wm-image-drop{grid-template-columns:1fr}.wm-image-thumb{width:100%;height:150px}.wm-image-controls{grid-template-columns:1fr 1fr}.wm-image-controls .wide{grid-column:span 2}}'
    ].join('');
    document.head.appendChild(style);
  }

  function watermarkOptionsHtml() {
    return '' +
      '<input type="hidden" id="watermarkMode" value="image">' +
      '<div class="wm-image-picker">' +
        '<div><label class="block text-sm font-medium">Ảnh dấu / Stamp image</label>' +
        '<p class="wm-note">Chỉ dùng ảnh để đóng dấu PDF. Hỗ trợ PNG, JPG/JPEG. / Image-only PDF stamp. PNG and JPG/JPEG supported.</p></div>' +
        '<div class="wm-image-drop" id="wmImageDrop">' +
          '<div class="wm-image-thumb"><img id="wmImagePreview" alt="Xem ảnh dấu / Stamp preview"><span id="wmImageEmpty">Chưa chọn ảnh<br>No image</span></div>' +
          '<div class="wm-image-meta">' +
            '<strong id="wmImageName">Chưa có ảnh dấu / No stamp image selected</strong>' +
            '<small id="wmImageInfo">Tải ảnh lên, sau đó có thể xem, thay đổi hoặc xóa. / Upload an image, then preview, change, or remove it.</small>' +
            '<div class="wm-image-actions">' +
              '<label for="watermarkImageInput" id="wmChooseLabel">Chọn ảnh / Choose image</label>' +
              '<button type="button" id="wmPreviewButton" disabled>Xem ảnh / Preview</button>' +
              '<button type="button" id="wmRemoveButton" class="danger" disabled>Xóa / Remove</button>' +
            '</div>' +
            '<input type="file" id="watermarkImageInput" accept="image/png,image/jpeg,.png,.jpg,.jpeg" class="hidden">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="wm-image-controls">' +
        '<div><label class="block text-sm font-medium">Vị trí / Position</label><select id="watermarkPosition"><option value="middle-center">Giữa / Center</option><option value="top-left">Trên-Trái / Top-left</option><option value="top-right">Trên-Phải / Top-right</option><option value="bottom-left">Dưới-Trái / Bottom-left</option><option value="bottom-right">Dưới-Phải / Bottom-right</option></select></div>' +
        '<div><label class="block text-sm font-medium">Độ trong suốt / Opacity</label><select id="watermarkTransparency"><option value="100">100%</option><option value="75">75%</option><option value="50" selected>50%</option><option value="25">25%</option></select></div>' +
        '<div><label class="block text-sm font-medium">Góc xoay / Rotation</label><input type="number" id="watermarkRotation" value="0" min="-360" max="360"></div>' +
        '<div class="wide"><label class="block text-sm font-medium">Kích thước ảnh dấu (%) / Stamp size (%)</label><input type="number" id="watermarkImageScale" value="30" min="1" max="100"></div>' +
      '</div>';
  }

  function clearWatermarkFile() {
    try { window.watermarkFile = null; } catch (_) { watermarkFile = null; }
    var input = el('watermarkImageInput');
    if (input) input.value = '';
    if (watermarkObjectUrl) { URL.revokeObjectURL(watermarkObjectUrl); watermarkObjectUrl = null; }
    var img = el('wmImagePreview');
    var empty = el('wmImageEmpty');
    if (img) { img.removeAttribute('src'); img.style.display = 'none'; }
    if (empty) empty.style.display = '';
    if (el('wmImageName')) el('wmImageName').textContent = 'Chưa có ảnh dấu / No stamp image selected';
    if (el('wmImageInfo')) el('wmImageInfo').textContent = 'Tải ảnh lên, sau đó có thể xem, thay đổi hoặc xóa. / Upload an image, then preview, change, or remove it.';
    if (el('wmPreviewButton')) el('wmPreviewButton').disabled = true;
    if (el('wmRemoveButton')) el('wmRemoveButton').disabled = true;
    if (el('wmChooseLabel')) el('wmChooseLabel').textContent = 'Chọn ảnh / Choose image';
  }

  function setWatermarkFile(file) {
    if (!file) return clearWatermarkFile();
    if (!/^image\/(png|jpeg)$/i.test(file.type) && !/\.(png|jpe?g)$/i.test(file.name || '')) {
      if (typeof setStatus === 'function') setStatus('Ảnh dấu chỉ hỗ trợ PNG hoặc JPG/JPEG. / Stamp image must be PNG or JPG/JPEG.', 'error');
      return clearWatermarkFile();
    }
    try { window.watermarkFile = file; } catch (_) { watermarkFile = file; }
    if (watermarkObjectUrl) URL.revokeObjectURL(watermarkObjectUrl);
    watermarkObjectUrl = URL.createObjectURL(file);
    var img = el('wmImagePreview');
    var empty = el('wmImageEmpty');
    if (img) { img.src = watermarkObjectUrl; img.style.display = 'block'; }
    if (empty) empty.style.display = 'none';
    if (el('wmImageName')) el('wmImageName').textContent = file.name;
    if (el('wmImageInfo')) el('wmImageInfo').textContent = Math.max(1, Math.round(file.size / 1024)) + ' KB · ' + (file.type || 'image');
    if (el('wmPreviewButton')) el('wmPreviewButton').disabled = false;
    if (el('wmRemoveButton')) el('wmRemoveButton').disabled = false;
    if (el('wmChooseLabel')) el('wmChooseLabel').textContent = 'Thay đổi / Change';
    if (typeof setStatus === 'function') setStatus('Đã chọn ảnh dấu. / Stamp image selected.', 'info');
  }

  function previewWatermark() {
    if (!watermarkObjectUrl) return;
    window.open(watermarkObjectUrl, '_blank', 'noopener,noreferrer');
  }

  function bindWatermarkUi() {
    var input = el('watermarkImageInput');
    if (!input || input.dataset.wmBound === '1') return;
    input.dataset.wmBound = '1';
    input.addEventListener('change', function (event) { setWatermarkFile(event.target.files && event.target.files[0]); });
    el('wmPreviewButton') && el('wmPreviewButton').addEventListener('click', previewWatermark);
    el('wmRemoveButton') && el('wmRemoveButton').addEventListener('click', function () { clearWatermarkFile(); if (typeof setStatus === 'function') setStatus('Đã xóa ảnh dấu. / Stamp image removed.', 'info'); });
    ['watermarkPosition','watermarkTransparency','watermarkRotation','watermarkImageScale'].forEach(function(id){
      var node = el(id); if (node) node.addEventListener('input', function(){ /* values read at process time */ });
    });
  }

  function applyWatermarkUi() {
    if (!isPdfWatermark()) return;
    var options = el('toolOptions');
    if (!options) return;
    if (options.dataset.wmImageOnly === '1') { bindWatermarkUi(); return; }
    options.innerHTML = watermarkOptionsHtml();
    options.dataset.wmImageOnly = '1';
    options.classList.remove('hidden');
    bindWatermarkUi();
    clearWatermarkFile();
  }

  async function readBytes(file) { return new Uint8Array(await file.arrayBuffer()); }

  async function embedStamp(doc, file) {
    var bytes = await readBytes(file);
    if (file.type === 'image/png' || /\.png$/i.test(file.name || '')) return doc.embedPng(bytes);
    return doc.embedJpg(bytes);
  }

  function getStampXY(pageW, pageH, drawW, drawH, position) {
    var margin = Math.min(pageW, pageH) * 0.05;
    switch (position) {
      case 'top-left': return { x: margin, y: pageH - drawH - margin };
      case 'top-right': return { x: pageW - drawW - margin, y: pageH - drawH - margin };
      case 'bottom-left': return { x: margin, y: margin };
      case 'bottom-right': return { x: pageW - drawW - margin, y: margin };
      default: return { x: (pageW - drawW) / 2, y: (pageH - drawH) / 2 };
    }
  }

  async function processOfflinePdfWatermark() {
    if (!window.PDFLib) throw new Error('Chưa nạp pdf-lib. / pdf-lib is not loaded.');
    if (!window.selectedFiles || !selectedFiles.length) throw new Error('Vui lòng chọn PDF. / Please select a PDF.');
    if (!window.watermarkFile) throw new Error('Vui lòng chọn ảnh dấu. / Please choose a stamp image.');

    var pdfFile = selectedFiles[0];
    var doc = await PDFLib.PDFDocument.load(await readBytes(pdfFile), { ignoreEncryption: false });
    var stamp = await embedStamp(doc, watermarkFile);
    var scalePercent = Math.max(1, Math.min(100, Number(el('watermarkImageScale').value || 30)));
    var opacity = Math.max(0, Math.min(1, Number(el('watermarkTransparency').value || 50) / 100));
    var rotation = Number(el('watermarkRotation').value || 0);
    var position = el('watermarkPosition').value || 'middle-center';
    var aspect = stamp.height / stamp.width;

    doc.getPages().forEach(function (page) {
      var pageW = page.getWidth();
      var pageH = page.getHeight();
      var drawW = pageW * scalePercent / 100;
      var drawH = drawW * aspect;
      var maxH = pageH * 0.9;
      if (drawH > maxH) { drawH = maxH; drawW = drawH / aspect; }
      var xy = getStampXY(pageW, pageH, drawW, drawH, position);
      page.drawImage(stamp, { x: xy.x, y: xy.y, width: drawW, height: drawH, opacity: opacity, rotate: PDFLib.degrees(rotation) });
    });

    return new Blob([await doc.save()], { type: 'application/pdf' });
  }

  function setBusy(on) {
    var loader = el('loader'), text = el('processButtonText'), button = el('processButton');
    if (loader) loader.style.display = on ? 'block' : 'none';
    if (text) text.style.display = on ? 'none' : 'block';
    if (button) button.disabled = on || !(window.selectedFiles && selectedFiles.length);
  }

  function showOfflineResult(blob, sourceName) {
    var name = (sourceName || 'document.pdf').replace(/\.pdf$/i, '') + '-stamped-offline.pdf';
    hotfixOfflineResult = { blob: blob, name: name };
    var container = el('resultContainer'), link = el('downloadLink');
    if (link) link.textContent = 'Tải / Download: ' + name;
    if (container) container.classList.remove('hidden');
    if (typeof setStatus === 'function') setStatus('Đóng dấu ảnh Offline thành công. / Offline image stamp completed.', 'success');
  }

  async function interceptOfflineProcess(event) {
    if (!isPdfWatermark() || !offlineMode()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      hotfixOfflineResult = null;
      setBusy(true);
      if (el('resultContainer')) el('resultContainer').classList.add('hidden');
      if (typeof setStatus === 'function') setStatus('Đang đóng dấu ảnh trên thiết bị… / Stamping image locally…', 'info');
      var blob = await processOfflinePdfWatermark();
      showOfflineResult(blob, selectedFiles[0].name);
    } catch (err) {
      if (typeof setStatus === 'function') setStatus('Lỗi / Error: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function interceptOfflineDownload(event) {
    if (!isPdfWatermark() || !offlineMode() || !hotfixOfflineResult) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var url = URL.createObjectURL(hotfixOfflineResult.blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = hotfixOfflineResult.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
    if (typeof setStatus === 'function') setStatus('Đã tải PDF đã đóng dấu. / Stamped PDF downloaded.', 'success');
  }

  injectStyles();

  // Keep this file loaded BEFORE offline-v2.js so these capture listeners run first.
  window.addEventListener('load', function () {
    applyWatermarkUi();

    var select = el('apiTool');
    if (select) select.addEventListener('change', function () { setTimeout(applyWatermarkUi, 0); });
    document.querySelectorAll('[data-tool]').forEach(function (button) {
      button.addEventListener('click', function () { setTimeout(applyWatermarkUi, 0); });
    });

    var process = el('processButton');
    if (process) process.addEventListener('click', interceptOfflineProcess, true);
    var download = el('downloadLink');
    if (download) download.addEventListener('click', interceptOfflineDownload, true);

    // Online validation: original module.js will handle upload + iLovePDF processing.
    if (process) process.addEventListener('click', function (event) {
      if (!isPdfWatermark() || offlineMode()) return;
      if (!window.watermarkFile) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof setStatus === 'function') setStatus('Vui lòng chọn ảnh dấu trước khi xử lý. / Please choose a stamp image before processing.', 'error');
      }
    }, true);
  });
})();
