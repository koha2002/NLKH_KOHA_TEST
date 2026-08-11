(function () {
  'use strict';

  var hotfixResults = [];
  var watermarkObjectUrl = null;
  var previewObjectUrl = null;
  var previewTimer = null;
  var lastFilesSignature = '';

  function el(id){ return document.getElementById(id); }
  function isPdfWatermark(){ return el('apiTool') && el('apiTool').value === 'watermark'; }
  function offlineMode(){ return (localStorage.getItem('nlkh_pdf_mode') || 'offline') === 'offline'; }
  function selected(){
    try { if (typeof selectedFiles !== 'undefined' && selectedFiles) return Array.from(selectedFiles); } catch(_){}
    try { if (window.selectedFiles) return Array.from(window.selectedFiles); } catch(_){}
    var input=findMainPdfInput();
    return input && input.files ? Array.from(input.files) : [];
  }
  function setSelected(files){
    try { if (typeof selectedFiles !== 'undefined') selectedFiles = files; } catch(_){}
    try { window.selectedFiles = files; } catch(_){}
  }

  function injectStyles(){
    if(el('wm-image-fix-style'))return;
    var style=document.createElement('style');
    style.id='wm-image-fix-style';
    style.textContent=[
      '.wm-image-picker{display:grid;gap:12px}',
      '.wm-image-drop{border:1.5px dashed var(--pdf-line,#dce2ea);border-radius:10px;background:var(--pdf-surface,#fff);padding:14px;display:grid;grid-template-columns:86px 1fr;gap:14px;align-items:center}',
      '.wm-image-thumb{width:86px;height:86px;border:1px solid var(--pdf-line,#dce2ea);border-radius:9px;background:var(--pdf-surface-soft,#f7f8fa);display:grid;place-items:center;overflow:hidden}',
      '.wm-image-thumb img{width:100%;height:100%;object-fit:contain;display:none}',
      '.wm-image-thumb span{font-size:11px;color:var(--pdf-muted,#687488);text-align:center;padding:8px}',
      '.wm-image-meta strong{display:block;font-size:12px;margin-bottom:4px;overflow-wrap:anywhere}',
      '.wm-image-meta small,.wm-note{display:block;color:var(--pdf-muted,#687488);font-size:10px;line-height:1.5}',
      '.wm-image-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
      '.wm-image-actions button,.wm-image-actions label,.pdf-v3-btn{min-height:36px;padding:8px 12px;border-radius:8px;border:1px solid var(--pdf-line,#dce2ea);background:var(--pdf-surface-soft,#f7f8fa);color:var(--pdf-ink,#eaf2ff);font-size:11px;font-weight:700;cursor:pointer}',
      '.wm-image-actions .danger,.pdf-v3-danger{color:#ff3b3b!important}',
      '.wm-image-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}',
      '.wm-preview-box{margin-top:14px;border:1px solid var(--pdf-line,#304562);border-radius:10px;overflow:hidden;background:#0b1324}',
      '.wm-preview-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px;border-bottom:1px solid var(--pdf-line,#304562)}',
      '.wm-preview-head select,.wm-preview-head input{min-height:34px;border:1px solid var(--pdf-line,#304562);border-radius:7px;background:var(--pdf-surface,#0f1b2d);color:inherit;padding:6px 8px}',
      '.wm-preview-frame{width:100%;height:520px;border:0;background:#2a2a2a;display:block}',
      '.wm-preview-empty{padding:42px 14px;text-align:center;color:var(--pdf-muted,#8fa2bb)}',
      '.pdf-v3-files{display:grid;gap:7px;margin-top:10px}',
      '.pdf-v3-file{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border:1px solid var(--pdf-line,#304562);border-radius:8px;padding:8px 10px;background:var(--pdf-surface-soft,#102039)}',
      '.pdf-v3-file strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}',
      '.pdf-v3-file small{font-size:9px;color:var(--pdf-muted,#8fa2bb)}',
      '@media(max-width:700px){.wm-image-drop{grid-template-columns:1fr}.wm-image-thumb{width:100%;height:140px}.wm-image-controls{grid-template-columns:1fr 1fr}.wm-preview-frame{height:420px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function watermarkOptionsHtml(){
    return ''+
      '<input type="hidden" id="watermarkMode" value="image">'+
      '<div class="wm-image-picker">'+
        '<div><label class="block text-sm font-medium">Ảnh dấu / Stamp image</label><span class="wm-note">PNG, JPG/JPEG. Chọn ảnh rồi căn trực tiếp trên bản xem trước PDF bên dưới.</span></div>'+
        '<div class="wm-image-drop">'+
          '<div class="wm-image-thumb"><img id="wmImagePreview"><span id="wmImageEmpty">Chưa chọn ảnh<br>No image</span></div>'+
          '<div class="wm-image-meta"><strong id="wmImageName">Chưa có ảnh dấu / No stamp image</strong><small id="wmImageInfo">Chọn ảnh để đóng dấu.</small>'+
            '<div class="wm-image-actions"><label for="watermarkImageInput" id="wmChooseLabel">Chọn ảnh / Choose</label><button type="button" id="wmPreviewButton" disabled>Xem ảnh / Preview</button><button type="button" id="wmRemoveButton" class="danger" disabled>Xóa / Remove</button></div>'+
            '<input type="file" id="watermarkImageInput" accept="image/png,image/jpeg,.png,.jpg,.jpeg" class="hidden">'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="wm-image-controls">'+
        '<div><label class="block text-sm font-medium">Vị trí / Position</label><select id="watermarkPosition"><option value="middle-center">Giữa / Center</option><option value="top-left">Trên-Trái / Top-left</option><option value="top-right">Trên-Phải / Top-right</option><option value="bottom-left">Dưới-Trái / Bottom-left</option><option value="bottom-right">Dưới-Phải / Bottom-right</option></select></div>'+
        '<div><label class="block text-sm font-medium">Độ trong suốt / Opacity</label><select id="watermarkTransparency"><option value="100">100%</option><option value="75">75%</option><option value="50" selected>50%</option><option value="25">25%</option></select></div>'+
        '<div><label class="block text-sm font-medium">Góc xoay / Rotation</label><input type="number" id="watermarkRotation" value="0" min="-360" max="360"></div>'+
        '<div><label class="block text-sm font-medium">Kích thước (%) / Size (%)</label><input type="number" id="watermarkImageScale" value="30" min="1" max="100"></div>'+
      '</div>'+
      '<div class="wm-preview-box" id="wmLivePreview">'+
        '<div class="wm-preview-head"><strong>Xem trước thực tế / Live preview</strong><select id="wmPreviewFile"></select><span>Trang / Page</span><button type="button" class="pdf-v3-btn" id="wmPrevPage">‹</button><input id="wmPreviewPage" type="number" min="1" value="1" style="width:68px"><button type="button" class="pdf-v3-btn" id="wmNextPage">›</button><span id="wmPreviewStatus" class="wm-note">Chọn PDF để xem trước.</span></div>'+
        '<div id="wmPreviewEmpty" class="wm-preview-empty">Chọn PDF ở phía trên để xem trang thật và vị trí ảnh dấu.<br>Select a PDF above to preview the actual stamp placement.</div>'+
        '<iframe id="wmPreviewFrame" class="wm-preview-frame" style="display:none" title="PDF watermark live preview"></iframe>'+
      '</div>';
  }

  function clearWatermarkFile(){
    try{window.watermarkFile=null}catch(_){}
    var input=el('watermarkImageInput'); if(input)input.value='';
    if(watermarkObjectUrl){URL.revokeObjectURL(watermarkObjectUrl);watermarkObjectUrl=null}
    var img=el('wmImagePreview'),empty=el('wmImageEmpty');
    if(img){img.removeAttribute('src');img.style.display='none'} if(empty)empty.style.display='';
    if(el('wmImageName'))el('wmImageName').textContent='Chưa có ảnh dấu / No stamp image';
    if(el('wmImageInfo'))el('wmImageInfo').textContent='Chọn ảnh để đóng dấu.';
    if(el('wmPreviewButton'))el('wmPreviewButton').disabled=true;
    if(el('wmRemoveButton'))el('wmRemoveButton').disabled=true;
    if(el('wmChooseLabel'))el('wmChooseLabel').textContent='Chọn ảnh / Choose';
    schedulePreview();
  }
  function setWatermarkFile(file){
    if(!file)return clearWatermarkFile();
    if(!/^image\/(png|jpeg)$/i.test(file.type)&&!/\.(png|jpe?g)$/i.test(file.name||'')){
      if(typeof setStatus==='function')setStatus('Ảnh dấu chỉ hỗ trợ PNG hoặc JPG/JPEG. / PNG or JPG/JPEG only.','error');
      return clearWatermarkFile();
    }
    try{window.watermarkFile=file}catch(_){}
    if(watermarkObjectUrl)URL.revokeObjectURL(watermarkObjectUrl);
    watermarkObjectUrl=URL.createObjectURL(file);
    var img=el('wmImagePreview'),empty=el('wmImageEmpty');
    if(img){img.src=watermarkObjectUrl;img.style.display='block'} if(empty)empty.style.display='none';
    if(el('wmImageName'))el('wmImageName').textContent=file.name;
    if(el('wmImageInfo'))el('wmImageInfo').textContent=Math.max(1,Math.round(file.size/1024))+' KB · '+(file.type||'image');
    if(el('wmPreviewButton'))el('wmPreviewButton').disabled=false;
    if(el('wmRemoveButton'))el('wmRemoveButton').disabled=false;
    if(el('wmChooseLabel'))el('wmChooseLabel').textContent='Thay đổi / Change';
    schedulePreview();
  }
  function previewWatermark(){if(watermarkObjectUrl)window.open(watermarkObjectUrl,'_blank','noopener,noreferrer')}

  function bindWatermarkUi(){
    var input=el('watermarkImageInput'); if(!input||input.dataset.wmBound==='1')return;
    input.dataset.wmBound='1';
    input.addEventListener('change',function(e){setWatermarkFile(e.target.files&&e.target.files[0])});
    if(el('wmPreviewButton'))el('wmPreviewButton').onclick=previewWatermark;
    if(el('wmRemoveButton'))el('wmRemoveButton').onclick=clearWatermarkFile;
    ['watermarkPosition','watermarkTransparency','watermarkRotation','watermarkImageScale'].forEach(function(id){
      var n=el(id); if(n)n.addEventListener('input',schedulePreview);
    });
    if(el('wmPreviewFile'))el('wmPreviewFile').addEventListener('change',function(){if(el('wmPreviewPage'))el('wmPreviewPage').value='1';schedulePreview()});
    if(el('wmPreviewPage'))el('wmPreviewPage').addEventListener('change',schedulePreview);
    if(el('wmPrevPage'))el('wmPrevPage').onclick=function(){var n=el('wmPreviewPage');n.value=Math.max(1,Number(n.value||1)-1);schedulePreview()};
    if(el('wmNextPage'))el('wmNextPage').onclick=function(){var n=el('wmPreviewPage'),m=Number(n.max||9999);n.value=Math.min(m,Number(n.value||1)+1);schedulePreview()};
  }

  function applyWatermarkUi(){
    if(!isPdfWatermark())return;
    var options=el('toolOptions'); if(!options)return;
    if(options.dataset.wmImageOnlyV3==='1'){bindWatermarkUi();syncFileManager();schedulePreview();return}
    options.innerHTML=watermarkOptionsHtml();
    options.dataset.wmImageOnlyV3='1';
    options.classList.remove('hidden');
    bindWatermarkUi();
    clearWatermarkFile();
    syncFileManager();
  }

  async function readBytes(file){return new Uint8Array(await file.arrayBuffer())}
  async function embedStamp(doc,file){
    var bytes=await readBytes(file);
    return (file.type==='image/png'||/\.png$/i.test(file.name||''))?doc.embedPng(bytes):doc.embedJpg(bytes);
  }
  function getStampXY(pageW,pageH,drawW,drawH,position){
    var margin=Math.min(pageW,pageH)*0.05;
    switch(position){
      case'top-left':return{x:margin,y:pageH-drawH-margin};
      case'top-right':return{x:pageW-drawW-margin,y:pageH-drawH-margin};
      case'bottom-left':return{x:margin,y:margin};
      case'bottom-right':return{x:pageW-drawW-margin,y:margin};
      default:return{x:(pageW-drawW)/2,y:(pageH-drawH)/2};
    }
  }
  async function drawStamp(doc,page){
    if(!window.watermarkFile)return;
    var stamp=await embedStamp(doc,window.watermarkFile);
    var scalePercent=Math.max(1,Math.min(100,Number(el('watermarkImageScale').value||30)));
    var opacity=Math.max(0,Math.min(1,Number(el('watermarkTransparency').value||50)/100));
    var rotation=Number(el('watermarkRotation').value||0);
    var position=el('watermarkPosition').value||'middle-center';
    var pageW=page.getWidth(),pageH=page.getHeight(),aspect=stamp.height/stamp.width;
    var drawW=pageW*scalePercent/100,drawH=drawW*aspect,maxH=pageH*.9;
    if(drawH>maxH){drawH=maxH;drawW=drawH/aspect}
    var xy=getStampXY(pageW,pageH,drawW,drawH,position);
    page.drawImage(stamp,{x:xy.x,y:xy.y,width:drawW,height:drawH,opacity:opacity,rotate:PDFLib.degrees(rotation)});
  }

  function schedulePreview(){
    clearTimeout(previewTimer);
    previewTimer=setTimeout(renderLivePreview,280);
  }
  async function renderLivePreview(){
    if(!isPdfWatermark()||!window.PDFLib)return;
    var files=selected(),select=el('wmPreviewFile'),frame=el('wmPreviewFrame'),empty=el('wmPreviewEmpty'),status=el('wmPreviewStatus'),pageInput=el('wmPreviewPage');
    if(!select||!frame)return;
    var old=select.value;
    select.innerHTML='';
    files.forEach(function(f,i){var o=document.createElement('option');o.value=String(i);o.textContent=(i+1)+'. '+f.name;select.appendChild(o)});
    if(old!==''&&Number(old)<files.length)select.value=old;
    if(!files.length){
      frame.style.display='none'; if(empty)empty.style.display='block'; if(status)status.textContent='Chọn PDF để xem trước.';
      if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null}
      return;
    }
    try{
      if(status)status.textContent='Đang dựng xem trước… / Rendering…';
      var file=files[Math.max(0,Number(select.value||0))];
      var src=await PDFLib.PDFDocument.load(await readBytes(file),{ignoreEncryption:false});
      var count=src.getPageCount();
      var pageNo=Math.max(1,Math.min(count,Number(pageInput&&pageInput.value||1)));
      if(pageInput){pageInput.max=String(count);pageInput.value=String(pageNo)}
      var doc=await PDFLib.PDFDocument.create();
      var copied=await doc.copyPages(src,[pageNo-1]); doc.addPage(copied[0]);
      await drawStamp(doc,copied[0]);
      var blob=new Blob([await doc.save()],{type:'application/pdf'});
      if(previewObjectUrl)URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl=URL.createObjectURL(blob);
      frame.src=previewObjectUrl+'#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
      frame.style.display='block'; if(empty)empty.style.display='none';
      if(status)status.textContent='Trang '+pageNo+'/'+count+' · '+file.name;
    }catch(err){
      frame.style.display='none';if(empty){empty.style.display='block';empty.textContent='Không thể dựng xem trước: '+err.message}
      if(status)status.textContent='Preview error';
    }
  }

  function findMainPdfInput(){
    var inputs=Array.prototype.slice.call(document.querySelectorAll('input[type="file"]'));
    return inputs.find(function(n){if(n.id==='watermarkImageInput')return false;return String(n.getAttribute('accept')||'').toLowerCase().indexOf('pdf')!==-1})||null;
  }
  function ensureFileManager(){
    var input=findMainPdfInput(); if(!input)return null;
    var wrap=el('pdfFileActionsHotfix');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='pdfFileActionsHotfix';
      wrap.innerHTML='<button type="button" id="pdfAddFilesHotfix" class="pdf-v3-btn">Thêm PDF / Add PDF</button><div id="pdfPerFileActions" class="pdf-v3-files"></div>';
      var host=input.closest('label')||input.parentElement||input;
      if(host.parentElement)host.parentElement.insertBefore(wrap,host.nextSibling);
      if(el('pdfAddFilesHotfix'))el('pdfAddFilesHotfix').onclick=function(){input.value='';input.click()};
      input.addEventListener('change',function(){setTimeout(function(){syncFileManager();schedulePreview()},0)});
    }
    return wrap;
  }
  function removePdfAt(index){
    var files=selected(); if(index<0||index>=files.length)return;
    files.splice(index,1);
    setSelected([]);
    var input=findMainPdfInput();
    if(input){
      try{
        var dt=new DataTransfer();files.forEach(function(f){dt.items.add(f)});input.files=dt.files;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(_){setSelected(files)}
    }else setSelected(files);
    hotfixResults=[];
    if(el('resultContainer'))el('resultContainer').classList.add('hidden');
    setTimeout(function(){syncFileManager();schedulePreview()},0);
    if(typeof setStatus==='function')setStatus('Đã xóa 1 PDF khỏi danh sách. / One PDF removed.','info');
  }
  function syncFileManager(){
    ensureFileManager();
    var box=el('pdfPerFileActions');if(!box)return;
    var files=selected();
    var sig=files.map(function(f){return f.name+':'+f.size+':'+f.lastModified}).join('|');
    if(sig===lastFilesSignature&&box.children.length===files.length)return;
    lastFilesSignature=sig;box.innerHTML='';
    files.forEach(function(f,i){
      var row=document.createElement('div');row.className='pdf-v3-file';
      row.innerHTML='<div><strong></strong><small></small></div><button type="button" class="pdf-v3-btn pdf-v3-danger">Xóa / Remove</button>';
      row.querySelector('strong').textContent=(i+1)+'. '+f.name;
      row.querySelector('small').textContent=Math.max(1,Math.round(f.size/1024))+' KB';
      row.querySelector('button').onclick=function(){removePdfAt(i)};
      box.appendChild(row);
    });
    if(el('pdfFileActionsHotfix'))el('pdfFileActionsHotfix').style.display='block';
    schedulePreview();
  }

  async function stampFullFile(file){
    var doc=await PDFLib.PDFDocument.load(await readBytes(file),{ignoreEncryption:false});
    var pages=doc.getPages();
    for(var i=0;i<pages.length;i++)await drawStamp(doc,pages[i]);
    return new Blob([await doc.save()],{type:'application/pdf'});
  }
  async function processOfflineAll(){
    if(!window.PDFLib)throw new Error('pdf-lib is not loaded.');
    var files=selected();if(!files.length)throw new Error('Vui lòng chọn PDF. / Please select PDF.');
    if(!window.watermarkFile)throw new Error('Vui lòng chọn ảnh dấu. / Please choose a stamp image.');
    var results=[];
    for(var i=0;i<files.length;i++){
      if(typeof setStatus==='function')setStatus('Đang xử lý '+(i+1)+'/'+files.length+': '+files[i].name,'info');
      results.push({blob:await stampFullFile(files[i]),name:files[i].name.replace(/\.pdf$/i,'')+'-stamped.pdf'});
    }
    return results;
  }
  function setBusy(on){
    var loader=el('loader'),text=el('processButtonText'),button=el('processButton');
    if(loader)loader.style.display=on?'block':'none';if(text)text.style.display=on?'none':'block';if(button)button.disabled=on||!selected().length;
  }
  function showResults(results){
    hotfixResults=results;
    var container=el('resultContainer'),link=el('downloadLink');
    if(link)link.textContent=results.length===1?'Tải / Download: '+results[0].name:'Tải '+results.length+' PDF đã đóng dấu / Download stamped PDFs';
    if(container)container.classList.remove('hidden');
    if(typeof setStatus==='function')setStatus('Đã đóng dấu '+results.length+' PDF. / '+results.length+' PDF(s) stamped.','success');
  }
  async function interceptOfflineProcess(event){
    if(!isPdfWatermark()||!offlineMode())return;
    event.preventDefault();event.stopImmediatePropagation();
    try{setBusy(true);if(el('resultContainer'))el('resultContainer').classList.add('hidden');showResults(await processOfflineAll())}
    catch(err){if(typeof setStatus==='function')setStatus('Lỗi / Error: '+err.message,'error')}
    finally{setBusy(false)}
  }
  function interceptOfflineDownload(event){
    if(!isPdfWatermark()||!offlineMode()||!hotfixResults.length)return;
    event.preventDefault();event.stopImmediatePropagation();
    hotfixResults.forEach(function(item,i){setTimeout(function(){var u=URL.createObjectURL(item.blob),a=document.createElement('a');a.href=u;a.download=item.name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove()},1000)},i*300)});
  }

  injectStyles();
  window.addEventListener('load',function(){
    ensureFileManager();applyWatermarkUi();syncFileManager();
    setInterval(function(){var sig=selected().map(function(f){return f.name+':'+f.size+':'+f.lastModified}).join('|');if(sig!==lastFilesSignature)syncFileManager()},800);
    var select=el('apiTool');if(select)select.addEventListener('change',function(){setTimeout(function(){applyWatermarkUi();syncFileManager()},0)});
    document.querySelectorAll('[data-tool]').forEach(function(b){b.addEventListener('click',function(){setTimeout(function(){applyWatermarkUi();syncFileManager()},0)})});
    var process=el('processButton');if(process)process.addEventListener('click',interceptOfflineProcess,true);
    var download=el('downloadLink');if(download)download.addEventListener('click',interceptOfflineDownload,true);
    if(process)process.addEventListener('click',function(event){
      if(!isPdfWatermark()||offlineMode())return;
      if(!window.watermarkFile){event.preventDefault();event.stopImmediatePropagation();if(typeof setStatus==='function')setStatus('Vui lòng chọn ảnh dấu trước khi xử lý. / Please choose a stamp image.','error')}
    },true);
  });
})();