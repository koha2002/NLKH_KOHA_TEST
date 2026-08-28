(function(){
'use strict';
const $ = id => document.getElementById(id);
let file = null;
let outputBlob = null;
let srcUrl = null;
let outUrl = null;
let removeBgFn = null;
let currentLang = 'vi';
let lastSiteLang = null;
let statusState = { key: 'ready', params: {}, percent: 0 };

const I18N = {
  vi: {
    subtitle: 'Tách nền ảnh trực tiếp trên trình duyệt',
    localState: '● Ảnh xử lý trong browser',
    openImage: 'Mở ảnh', removeBg: 'Tách nền', export: 'Xuất',
    exportFormatTitle: 'Định dạng xuất', exportPng: 'Xuất PNG', exportWebp: 'Xuất WebP', exportJpg: 'Xuất JPG',
    statusTitle: 'TRẠNG THÁI', originalImage: 'Ảnh gốc', result: 'Kết quả', noneYet: 'Chưa có',
    controlsTitle: 'THAO TÁC',
    hintZoom: '• Lăn chuột để phóng to / thu nhỏ.',
    hintPan: '• Giữ chuột trái và kéo để pan ảnh.',
    hintFit: '• Bấm Khớp ảnh để fit lại khung.',
    hintActual: '• Bấm 100% để xem ảnh rõ nét theo kích thước thật.',
    originalTitle: 'ẢNH GỐC', resultTitle: 'KẾT QUẢ', fit: 'Khớp ảnh',
    openPreview: 'Mở ảnh để xem trước', transparentOutput: 'PNG trong suốt', notRemovedYet: 'Chưa tách nền', transparentBackground: 'Nền trong suốt',
    ready: 'Sẵn sàng.\nBấm “Mở ảnh” để bắt đầu.\nCó thể chuyển VI / EN ở thanh trên.',
    notImage: 'File đã chọn không phải ảnh.',
    opened: 'Đã mở ảnh thành công.\nBấm “Tách nền” để xử lý AI.\nCó thể lăn chuột để zoom và kéo chuột để pan.',
    loadingEngine: 'Đang nạp engine AI...\nNguồn {current}/{total}\n{url}',
    missingEngine: 'Module tải được nhưng không có hàm remove background.',
    cannotLoadEngine: 'Không thể nạp engine AI.',
    openFirst: 'Hãy mở ảnh trước.',
    removing: 'Đang tách nền...\nƯu tiên GPU, nếu không được sẽ tự thử CPU.',
    loadingAsset: 'Đang tải {asset}...\n{device} · {percent}%',
    invalidOutput: 'Engine không trả về PNG hợp lệ.',
    removeFailed: 'Không tách được nền.',
    done: 'Tách nền xong.\nKiểm tra mép tóc, vai, tay và chân ở khung bên phải.\nChọn định dạng xuất ở góc trên phải rồi bấm Xuất.',
    aiError: 'Lỗi khi chạy AI:\n{message}\n\nNếu lỗi chỉ xảy ra lúc Tách nền, nguyên nhân thường là CDN / WASM / sandbox iframe.',
    noExport: 'Chưa có kết quả để xuất.',
    convertFailed: 'Không chuyển được định dạng xuất.',
    exported: 'Đã xuất file {format}.\nPNG và WebP giữ nền trong suốt. JPG sẽ tự chèn nền trắng.',
    exportError: 'Lỗi khi xuất file:\n{message}'
  },
  en: {
    subtitle: 'Remove image backgrounds directly in your browser',
    localState: '● Images processed in browser',
    openImage: 'Open image', removeBg: 'Remove background', export: 'Export',
    exportFormatTitle: 'Export format', exportPng: 'Export PNG', exportWebp: 'Export WebP', exportJpg: 'Export JPG',
    statusTitle: 'STATUS', originalImage: 'Original', result: 'Result', noneYet: 'None yet',
    controlsTitle: 'CONTROLS',
    hintZoom: '• Scroll the mouse wheel to zoom in / out.',
    hintPan: '• Hold the left mouse button and drag to pan.',
    hintFit: '• Click Fit to fit the image to the viewer.',
    hintActual: '• Click 100% to view at actual pixel size.',
    originalTitle: 'ORIGINAL', resultTitle: 'RESULT', fit: 'Fit',
    openPreview: 'Open an image to preview', transparentOutput: 'Transparent PNG', notRemovedYet: 'Background not removed yet', transparentBackground: 'Transparent background',
    ready: 'Ready.\nClick “Open image” to start.\nYou can switch VI / EN in the top bar.',
    notImage: 'The selected file is not an image.',
    opened: 'Image opened successfully.\nClick “Remove background” to run AI processing.\nUse the mouse wheel to zoom and drag to pan.',
    loadingEngine: 'Loading AI engine...\nSource {current}/{total}\n{url}',
    missingEngine: 'The module loaded but no background-removal function was found.',
    cannotLoadEngine: 'Unable to load the AI engine.',
    openFirst: 'Open an image first.',
    removing: 'Removing background...\nGPU is preferred; CPU will be used as fallback.',
    loadingAsset: 'Loading {asset}...\n{device} · {percent}%',
    invalidOutput: 'The engine did not return a valid PNG.',
    removeFailed: 'Background removal failed.',
    done: 'Background removed.\nInspect hair, shoulders, hands and feet in the result viewer.\nChoose an export format at the top right, then click Export.',
    aiError: 'AI processing error:\n{message}\n\nIf the error only occurs during background removal, it is usually related to CDN / WASM / iframe sandbox restrictions.',
    noExport: 'There is no result to export yet.',
    convertFailed: 'Unable to convert the export format.',
    exported: '{format} file exported.\nPNG and WebP preserve transparency. JPG uses a white background.',
    exportError: 'Export error:\n{message}'
  }
};

function normalizeLang(value){
  const v = String(value || '').toLowerCase();
  if(v.startsWith('en')) return 'en';
  if(v.startsWith('vi')) return 'vi';
  return null;
}

function formatText(template, params){
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => params && params[key] != null ? String(params[key]) : '');
}

function tr(key, params){
  const dict = I18N[currentLang] || I18N.vi;
  return formatText(dict[key] != null ? dict[key] : (I18N.vi[key] || key), params || {});
}

function renderStatus(){
  $('status').textContent = tr(statusState.key, statusState.params);
  if(typeof statusState.percent === 'number') $('bar').style.width = Math.max(0, Math.min(100, statusState.percent)) + '%';
}

function setStatusKey(key, params, percent){
  statusState = { key, params: params || {}, percent: typeof percent === 'number' ? percent : statusState.percent };
  renderStatus();
}

function applyLanguage(lang, persist){
  const normalized = normalizeLang(lang) || 'vi';
  currentLang = normalized;
  document.documentElement.lang = normalized;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(key) el.textContent = tr(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if(key) el.title = tr(key);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-lang') === normalized));
  if(!outputBlob) $('result').textContent = tr('noneYet');
  renderStatus();
  if(persist !== false){
    try { localStorage.setItem('nlkh-remove-background-lang', normalized); } catch(_) {}
  }
}

function readSiteLanguage(){
  const queryLang = normalizeLang(new URLSearchParams(location.search).get('lang'));
  if(queryLang) return queryLang;
  const keys = ['language','lang','locale','site-language','siteLang','nlkh-language','nlkh_lang'];
  try{
    if(window.parent && window.parent !== window){
      for(const key of keys){
        const val = normalizeLang(window.parent.localStorage && window.parent.localStorage.getItem(key));
        if(val) return val;
      }
      const htmlLang = normalizeLang(window.parent.document && window.parent.document.documentElement && window.parent.document.documentElement.lang);
      if(htmlLang) return htmlLang;
    }
  }catch(_){}
  try{
    for(const key of keys){
      const val = normalizeLang(localStorage.getItem(key));
      if(val) return val;
    }
    const own = normalizeLang(localStorage.getItem('nlkh-remove-background-lang'));
    if(own) return own;
  }catch(_){}
  return normalizeLang(navigator.language) || 'vi';
}

const viewers = {
  src: { root: $('srcViewer'), stage: document.querySelector('.stage[data-view="src"]'), wrap: $('srcWrap'), img: $('srcImg'), zoomText: $('srcZoom'), scale: 1, x: 0, y: 0, fitted: true, dragging: false, naturalW: 0, naturalH: 0 },
  out: { root: $('outViewer'), stage: document.querySelector('.stage[data-view="out"]'), wrap: $('outWrap'), img: $('outImg'), zoomText: $('outZoom'), scale: 1, x: 0, y: 0, fitted: true, dragging: false, naturalW: 0, naturalH: 0 }
};

function revoke(url){ if(url) URL.revokeObjectURL(url); }
function clearOutput(){
  outputBlob = null;
  revoke(outUrl); outUrl = null;
  viewers.out.root.classList.remove('ready');
  viewers.out.img.removeAttribute('src');
  viewers.out.img.style.visibility = 'hidden';
  viewers.out.naturalW = 0; viewers.out.naturalH = 0;
  $('result').textContent = tr('noneYet');
  $('outZoom').textContent = '—';
}
function updateTransform(v){
  if(!v.naturalW || !v.naturalH) return;
  v.wrap.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.scale})`;
  v.zoomText.textContent = Math.round(v.scale * 100) + '%';
}
function fitViewer(key){
  const v = viewers[key];
  if(!v.naturalW || !v.naturalH) return;
  const rect = v.root.getBoundingClientRect();
  const pad = 26;
  const scale = Math.min(Math.max(20, rect.width-pad*2)/v.naturalW, Math.max(20, rect.height-pad*2)/v.naturalH);
  v.scale = scale; v.x = -(v.naturalW*scale)/2; v.y = -(v.naturalH*scale)/2; v.fitted = true; updateTransform(v);
}
function setActualSize(key){
  const v = viewers[key]; if(!v.naturalW || !v.naturalH) return;
  v.scale = 1; v.x = -v.naturalW/2; v.y = -v.naturalH/2; v.fitted = false; updateTransform(v);
}
function zoomViewer(key, factor, anchorClientX, anchorClientY){
  const v = viewers[key]; if(!v.naturalW || !v.naturalH) return;
  const rect = v.root.getBoundingClientRect();
  const ax = (anchorClientX ?? (rect.left+rect.width/2))-rect.left;
  const ay = (anchorClientY ?? (rect.top+rect.height/2))-rect.top;
  const px = (ax-rect.width/2-v.x)/v.scale, py = (ay-rect.height/2-v.y)/v.scale;
  const newScale = Math.max(.05,Math.min(20,v.scale*factor));
  v.x = ax-rect.width/2-px*newScale; v.y = ay-rect.height/2-py*newScale; v.scale = newScale; v.fitted = false; updateTransform(v);
}
function loadIntoViewer(key,url,naturalW,naturalH){
  const v=viewers[key]; v.root.classList.remove('ready'); v.img.style.visibility='hidden'; v.img.src=url; v.naturalW=naturalW; v.naturalH=naturalH; v.root.classList.add('ready'); v.img.style.visibility='visible'; fitViewer(key);
}
async function openFile(f){
  if(!f) return;
  if(!String(f.type||'').startsWith('image/')){ setStatusKey('notImage',{},0); return; }
  file=f; clearOutput(); revoke(srcUrl); srcUrl=URL.createObjectURL(f); $('srcName').textContent=f.name||'image';
  const bmp=await createImageBitmap(f); $('size').textContent=`${bmp.width} × ${bmp.height}`; loadIntoViewer('src',srcUrl,bmp.width,bmp.height); if(bmp.close) bmp.close(); setStatusKey('opened',{},0);
}
async function loadEngine(){
  if(removeBgFn) return removeBgFn;
  const urls=['https://esm.sh/@imgly/background-removal@1.7.0?bundle','https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm']; let lastErr=null;
  for(let i=0;i<urls.length;i++){
    const url=urls[i];
    try{
      setStatusKey('loadingEngine',{current:i+1,total:urls.length,url},10+i*8);
      const mod=await import(url); const fn=mod.default||mod.removeBackground||mod.imglyRemoveBackground;
      if(typeof fn!=='function') throw new Error(tr('missingEngine')); removeBgFn=fn; return fn;
    }catch(err){ console.error('Dynamic import failed:',url,err); lastErr=err; }
  }
  throw lastErr||new Error(tr('cannotLoadEngine'));
}
async function runAI(){
  if(!file){ setStatusKey('openFirst',{},0); return; }
  $('runBtn').disabled=true;
  try{
    const removeBackground=await loadEngine(); setStatusKey('removing',{},35); let blob=null; const attempts=[{model:'isnet',device:'gpu'},{model:'isnet',device:'cpu'}]; let lastError=null;
    for(const attempt of attempts){
      try{
        const result=await removeBackground(file,{model:attempt.model,device:attempt.device,proxyToWorker:false,debug:false,output:{format:'image/png',quality:1},progress:(key,current,total)=>{const pct=total?Math.round(current/total*100):0;setStatusKey('loadingAsset',{asset:key,device:attempt.device.toUpperCase(),percent:pct},Math.min(90,35+Math.round(pct*.45)));}});
        blob=result instanceof Blob?result:(result&&result.blob instanceof Blob?result.blob:null); if(blob) break; throw new Error(tr('invalidOutput'));
      }catch(err){lastError=err;console.warn('Attempt failed:',attempt,err);}
    }
    if(!blob) throw lastError||new Error(tr('removeFailed'));
    outputBlob=blob; revoke(outUrl); outUrl=URL.createObjectURL(blob); const bmp=await createImageBitmap(blob); loadIntoViewer('out',outUrl,bmp.width,bmp.height); $('result').textContent=`${Math.round(blob.size/1024)} KB`; if(bmp.close) bmp.close(); setStatusKey('done',{},100);
  }catch(err){console.error(err);setStatusKey('aiError',{message:err&&err.message?err.message:String(err)},0);}finally{$('runBtn').disabled=false;}
}
async function exportBlobAs(type){
  if(!outputBlob) throw new Error(tr('noExport')); if(type==='png') return {blob:outputBlob,ext:'png'};
  const bmp=await createImageBitmap(outputBlob), canvas=document.createElement('canvas'); canvas.width=bmp.width; canvas.height=bmp.height; const ctx=canvas.getContext('2d');
  if(type==='jpg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);} ctx.drawImage(bmp,0,0); if(bmp.close) bmp.close();
  const mime=type==='webp'?'image/webp':'image/jpeg', quality=type==='webp'?.96:.94; const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,quality)); if(!blob) throw new Error(tr('convertFailed')); return {blob,ext:type};
}
async function saveExport(){
  if(!outputBlob){setStatusKey('noExport',{},100);return;}
  try{
    const type=$('exportFormat').value||'png', exported=await exportBlobAs(type), a=document.createElement('a'), href=URL.createObjectURL(exported.blob); a.href=href; a.download=(file&&file.name?file.name.replace(/\.[^.]+$/,''):'image')+'-nobg.'+exported.ext; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(href),2000); setStatusKey('exported',{format:type.toUpperCase()},100);
  }catch(err){console.error(err);setStatusKey('exportError',{message:err&&err.message?err.message:String(err)},100);}
}
function bindViewer(key){
  const v=viewers[key];let startX=0,startY=0,baseX=0,baseY=0;
  v.stage.addEventListener('pointerdown',e=>{if(!v.naturalW||!v.naturalH)return;v.dragging=true;v.stage.classList.add('dragging');startX=e.clientX;startY=e.clientY;baseX=v.x;baseY=v.y;v.stage.setPointerCapture(e.pointerId);});
  v.stage.addEventListener('pointermove',e=>{if(!v.dragging)return;v.x=baseX+(e.clientX-startX);v.y=baseY+(e.clientY-startY);v.fitted=false;updateTransform(v);});
  const end=e=>{if(!v.dragging)return;v.dragging=false;v.stage.classList.remove('dragging');try{v.stage.releasePointerCapture(e.pointerId);}catch(_){}}; v.stage.addEventListener('pointerup',end);v.stage.addEventListener('pointercancel',end);
  v.stage.addEventListener('wheel',e=>{if(!v.naturalW||!v.naturalH)return;e.preventDefault();zoomViewer(key,e.deltaY<0?1.1:1/1.1,e.clientX,e.clientY);},{passive:false}); v.stage.addEventListener('dblclick',()=>fitViewer(key));
}
bindViewer('src'); bindViewer('out');
document.querySelectorAll('.controls button').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.getAttribute('data-view'),act=btn.getAttribute('data-act');if(act==='fit')fitViewer(key);else if(act==='100')setActualSize(key);else if(act==='in')zoomViewer(key,1.15);else if(act==='out')zoomViewer(key,1/1.15);}));
document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>applyLanguage(btn.getAttribute('data-lang'),true)));
$('file').addEventListener('change',e=>openFile(e.target.files&&e.target.files[0])); $('openBtn').addEventListener('click',()=>$('file').click()); $('runBtn').addEventListener('click',runAI); $('saveBtn').addEventListener('click',saveExport);
window.addEventListener('resize',()=>{if(viewers.src.fitted)fitViewer('src');if(viewers.out.fitted)fitViewer('out');}); document.addEventListener('dragover',e=>e.preventDefault()); document.addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)openFile(f);});
window.addEventListener('message',e=>{const lang=normalizeLang(e&&e.data&&(e.data.lang||e.data.locale));if(lang)applyLanguage(lang,false);});
lastSiteLang=readSiteLanguage(); applyLanguage(lastSiteLang||'vi',false); setStatusKey('ready',{},0);
setInterval(()=>{const next=readSiteLanguage();if(next&&next!==lastSiteLang){lastSiteLang=next;applyLanguage(next,false);}},1000);
})();
