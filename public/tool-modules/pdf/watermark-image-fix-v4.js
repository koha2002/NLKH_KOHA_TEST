(function(){
'use strict';

let offlineResults=[];
let stampObjectUrl=null;
let previewObjectUrl=null;
let previewTimer=null;
let lastTool='';
const state={
  mode:'text',
  text:'KOHA',
  fontFamily:'Arial',
  fontStyle:'Bold',
  fontSize:42,
  fontColor:'#111111',
  pages:'all',
  position:'middle-center',
  horizontalAdjust:0,
  verticalAdjust:0,
  transparency:50,
  rotation:0,
  mosaic:false,
  layer:'above',
  imageScale:30,
  previewPage:1,
  previewFile:0
};

function el(id){return document.getElementById(id)}
function isWatermark(){return el('apiTool')?.value==='watermark'}
function isOffline(){return (localStorage.getItem('nlkh_pdf_mode')||'offline')==='offline'}
function en(){return String(document.documentElement.lang||'vi').toLowerCase().startsWith('en')}
function t(vi,enText){return en()?enText:vi}
function selected(){try{return Array.from(window.selectedFiles||[])}catch(_){return[]}}
function setStatus(vi,enText,type='info'){
  if(typeof window.setStatus==='function'){window.setStatus(t(vi,enText),type);return}
  const s=el('statusMessage');if(!s)return;s.textContent=t(vi,enText);s.className='status-message status--'+type;
}
function clamp(n,a,b){return Math.min(b,Math.max(a,Number(n)||0))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function modeValue(){return state.mode==='image'?'image':'text'}
function saveState(){
  state.mode=el('watermarkMode')?.value||state.mode;
  state.text=el('watermarkText')?.value??state.text;
  state.fontFamily=el('watermarkFontFamily')?.value||state.fontFamily;
  state.fontStyle=el('watermarkFontStyle')?.value??state.fontStyle;
  state.fontSize=clamp(el('watermarkFontSize')?.value||state.fontSize,8,240);
  state.fontColor=el('watermarkFontColor')?.value||state.fontColor;
  state.pages=el('watermarkPages')?.value||state.pages;
  state.position=el('watermarkPosition')?.value||state.position;
  state.horizontalAdjust=Number(el('watermarkHorizontalAdjust')?.value||0);
  state.verticalAdjust=Number(el('watermarkVerticalAdjust')?.value||0);
  state.transparency=clamp(el('watermarkTransparency')?.value||state.transparency,1,100);
  state.rotation=((Number(el('watermarkRotation')?.value||0)%360)+360)%360;
  state.mosaic=!!el('watermarkMosaic')?.checked;
  state.layer=el('watermarkLayer')?.value||state.layer;
  state.imageScale=clamp(el('watermarkImageScale')?.value||state.imageScale,3,95);
  state.previewPage=Math.max(1,Number(el('wmPreviewPage')?.value||state.previewPage));
  state.previewFile=Math.max(0,Number(el('wmPreviewFile')?.value||state.previewFile));
}
function option(v,label,current){return `<option value="${v}"${v===current?' selected':''}>${label}</option>`}
function field(label,html,note=''){return `<div class="wm54-field"><label>${label}</label>${html}${note?`<small>${note}</small>`:''}</div>`}
function commonHtml(){
  return `<div class="wm54-grid wm54-grid-3">
    ${field(t('Trang áp dụng','Pages'),`<input id="watermarkPages" value="${esc(state.pages)}" placeholder="all · 1,3,5-9">`,t('all hoặc 1,3,5-9','all or 1,3,5-9'))}
    ${field(t('Vị trí','Position'),`<select id="watermarkPosition">
      ${option('top-left',t('Trên trái','Top left'),state.position)}
      ${option('top-center',t('Trên giữa','Top center'),state.position)}
      ${option('top-right',t('Trên phải','Top right'),state.position)}
      ${option('middle-left',t('Giữa trái','Middle left'),state.position)}
      ${option('middle-center',t('Giữa','Center'),state.position)}
      ${option('middle-right',t('Giữa phải','Middle right'),state.position)}
      ${option('bottom-left',t('Dưới trái','Bottom left'),state.position)}
      ${option('bottom-center',t('Dưới giữa','Bottom center'),state.position)}
      ${option('bottom-right',t('Dưới phải','Bottom right'),state.position)}
    </select>`)}
    ${field(t('Độ đậm (%)','Opacity (%)'),`<input id="watermarkTransparency" type="number" min="1" max="100" value="${state.transparency}">`)}
    ${field(t('Lệch ngang (px)','Horizontal offset (px)'),`<input id="watermarkHorizontalAdjust" type="number" step="1" value="${state.horizontalAdjust}">`)}
    ${field(t('Lệch dọc (px)','Vertical offset (px)'),`<input id="watermarkVerticalAdjust" type="number" step="1" value="${state.verticalAdjust}">`)}
    ${field(t('Góc xoay','Rotation'),`<input id="watermarkRotation" type="number" min="0" max="360" value="${state.rotation}">`)}
  </div>
  <div class="wm54-checkrow">
    <label><input id="watermarkMosaic" type="checkbox"${state.mosaic?' checked':''}><span>${t('Lặp dấu 3×3','3×3 mosaic')}</span></label>
    ${isOffline()?'':`<label class="wm54-layer"><span>${t('Lớp','Layer')}</span><select id="watermarkLayer">${option('above',t('Trên nội dung','Above content'),state.layer)}${option('below',t('Dưới nội dung','Below content'),state.layer)}</select></label>`}
  </div>`;
}
function textHtml(){
  return `<div class="wm54-panel">
    ${field(t('Nội dung dấu','Watermark text'),`<textarea id="watermarkText" rows="3" placeholder="${t('Nhập nội dung watermark','Enter watermark text')}">${esc(state.text)}</textarea>`)}
    <div class="wm54-grid wm54-grid-4">
      ${field(t('Font','Font'),`<select id="watermarkFontFamily">
        ${option('Arial Unicode MS','Arial Unicode MS',state.fontFamily)}
        ${option('Arial','Arial',state.fontFamily)}
        ${option('Verdana','Verdana',state.fontFamily)}
        ${option('Courier','Courier',state.fontFamily)}
        ${option('Times New Roman','Times New Roman',state.fontFamily)}
      </select>`)}
      ${field(t('Kiểu chữ','Style'),`<select id="watermarkFontStyle">
        ${option('',t('Thường','Regular'),state.fontStyle)}
        ${option('Bold',t('Đậm','Bold'),state.fontStyle)}
        ${option('Italic',t('Nghiêng','Italic'),state.fontStyle)}
      </select>`)}
      ${field(t('Cỡ chữ','Font size'),`<input id="watermarkFontSize" type="number" min="8" max="240" value="${state.fontSize}">`)}
      ${field(t('Màu','Color'),`<input id="watermarkFontColor" type="color" value="${esc(state.fontColor)}">`)}
    </div>
    ${isOffline()?`<div class="wm54-note">${t('Offline: chữ được render thành ảnh trong trình duyệt rồi nhúng vào PDF, nên hỗ trợ tiếng Việt mà không tải font lên server.','Offline: text is rendered to an image in the browser and embedded into the PDF, so Vietnamese works without uploading fonts.')}</div>`:''}
  </div>`;
}
function imageHtml(){
  const f=window.watermarkFile;
  return `<div class="wm54-panel">
    <div class="wm54-imagebox">
      <div class="wm54-thumb">${f&&stampObjectUrl?`<img src="${stampObjectUrl}" alt="">`:`<span>${t('Chưa chọn ảnh','No image')}</span>`}</div>
      <div class="wm54-imagecopy">
        <strong>${f?esc(f.name):t('Ảnh dấu PNG/JPG','PNG/JPG stamp image')}</strong>
        <small>${f?`${Math.max(1,Math.round(f.size/1024))} KB`:t('Chọn PNG hoặc JPG/JPEG.','Choose PNG or JPG/JPEG.')}</small>
        <div class="wm54-imageactions">
          <label for="watermarkImageInput">${f?t('Đổi ảnh','Change image'):t('Chọn ảnh','Choose image')}</label>
          ${f?`<button type="button" id="wmRemoveImage">${t('Xóa ảnh','Remove')}</button>`:''}
          <input id="watermarkImageInput" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" hidden>
        </div>
      </div>
    </div>
    ${isOffline()?field(t('Kích thước ảnh (% chiều rộng trang)','Image size (% of page width)'),`<input id="watermarkImageScale" type="range" min="3" max="95" value="${state.imageScale}"><output id="wmScaleValue">${state.imageScale}%</output>`,t('Online dùng kích thước ảnh theo engine dịch vụ; thanh này chỉ áp dụng Offline/preview.','Online sizing is handled by the service; this slider applies to Offline/preview only.')):''}
  </div>`;
}
function previewHtml(){
  const list=selected();
  return `<div class="wm54-preview">
    <div class="wm54-previewhead">
      <strong>${t('Xem trước PDF thật','Live PDF preview')}</strong>
      <select id="wmPreviewFile">${list.map((f,i)=>option(String(i),`${i+1}. ${esc(f.name)}`,String(Math.min(state.previewFile,list.length-1)))).join('')}</select>
      <span>${t('Trang','Page')}</span>
      <button type="button" id="wmPrevPage">‹</button>
      <input id="wmPreviewPage" type="number" min="1" value="${state.previewPage}">
      <button type="button" id="wmNextPage">›</button>
      <small id="wmPreviewStatus"></small>
    </div>
    <div id="wmPreviewEmpty" class="wm54-previewempty">${t('Chọn PDF để xem vị trí watermark trước khi xử lý.','Choose a PDF to preview watermark placement before processing.')}</div>
    <iframe id="wmPreviewFrame" class="wm54-frame" title="PDF watermark preview" hidden></iframe>
  </div>`;
}
function html(){
  return `<div class="wm54">
    <div class="wm54-top">
      <div><strong>${t('Đóng dấu PDF','Watermark PDF')}</strong><small>${isOffline()?t('Tài liệu không rời thiết bị','Document stays on device'):t('File sẽ được gửi đến dịch vụ xử lý','File will be sent to processing service')}</small></div>
      <div class="wm54-tabs" role="tablist">
        <button type="button" data-wm-mode="text" class="${modeValue()==='text'?'active':''}">${t('Văn bản','Text')}</button>
        <button type="button" data-wm-mode="image" class="${modeValue()==='image'?'active':''}">${t('Hình ảnh','Image')}</button>
      </div>
    </div>
    <input type="hidden" id="watermarkMode" value="${modeValue()}">
    ${modeValue()==='text'?textHtml():imageHtml()}
    ${commonHtml()}
    ${previewHtml()}
  </div>`;
}
function ensureStyles(){
  if(el('wm54-style'))return;
  const s=document.createElement('style');s.id='wm54-style';s.textContent=`
  .wm54{display:grid;gap:12px}.wm54-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
  .wm54-top>div:first-child strong{display:block;font-size:13px}.wm54-top>div:first-child small{display:block;margin-top:3px;color:var(--pdf-muted);font-size:9px}
  .wm54-tabs{display:flex;gap:4px;padding:3px;border:1px solid var(--pdf-line);border-radius:9px;background:var(--pdf-surface)}
  .wm54-tabs button{border:0;border-radius:6px;background:transparent;color:var(--pdf-muted);padding:7px 11px;font-size:10px;font-weight:800;cursor:pointer}
  .wm54-tabs button.active{background:var(--pdf-blue);color:#fff}.wm54-panel{display:grid;gap:10px}
  .wm54-grid{display:grid;gap:9px}.wm54-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}.wm54-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
  .wm54-field{display:grid;gap:5px}.wm54-field>label{font-size:9px;font-weight:800;color:var(--pdf-ink)}.wm54-field>small{font-size:8px;line-height:1.4;color:var(--pdf-muted)}
  .wm54-field input:not([type=color]):not([type=range]),.wm54-field select,.wm54-field textarea{width:100%;min-height:36px;border:1px solid var(--pdf-line);border-radius:8px;background:var(--pdf-surface);color:var(--pdf-ink);padding:8px 9px}
  .wm54-field textarea{resize:vertical;min-height:74px}.wm54-field input[type=color]{width:100%;height:36px;border:1px solid var(--pdf-line);border-radius:8px;background:var(--pdf-surface);padding:4px}
  .wm54-field input[type=range]{width:100%}.wm54-field output{font-size:9px;color:var(--pdf-blue);font-weight:800}
  .wm54-checkrow{display:flex;flex-wrap:wrap;gap:8px}.wm54-checkrow>label{display:flex;align-items:center;gap:7px;padding:8px 9px;border:1px solid var(--pdf-line);border-radius:8px;background:var(--pdf-surface);font-size:9px;font-weight:700}
  .wm54-checkrow input{accent-color:var(--pdf-blue)}.wm54-layer select{border:0;background:transparent;color:var(--pdf-ink);font-size:9px}
  .wm54-note{padding:9px 10px;border:1px solid var(--pdf-line);border-radius:8px;background:var(--pdf-surface-soft);color:var(--pdf-muted);font-size:9px;line-height:1.5}
  .wm54-imagebox{display:grid;grid-template-columns:92px 1fr;gap:12px;align-items:center;padding:10px;border:1px dashed var(--pdf-line);border-radius:9px;background:var(--pdf-surface)}
  .wm54-thumb{width:92px;height:92px;display:grid;place-items:center;border:1px solid var(--pdf-line);border-radius:8px;overflow:hidden;background:var(--pdf-surface-soft);font-size:9px;color:var(--pdf-muted)}
  .wm54-thumb img{width:100%;height:100%;object-fit:contain}.wm54-imagecopy strong,.wm54-imagecopy small{display:block}.wm54-imagecopy strong{font-size:11px}.wm54-imagecopy small{margin-top:4px;font-size:9px;color:var(--pdf-muted)}
  .wm54-imageactions{display:flex;gap:7px;margin-top:9px}.wm54-imageactions label,.wm54-imageactions button{border:1px solid var(--pdf-line);border-radius:7px;background:var(--pdf-surface-soft);color:var(--pdf-ink);padding:7px 9px;font-size:9px;font-weight:800;cursor:pointer}
  .wm54-preview{border:1px solid var(--pdf-line);border-radius:9px;overflow:hidden;background:#20242b}.wm54-previewhead{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px;background:var(--pdf-surface);border-bottom:1px solid var(--pdf-line)}
  .wm54-previewhead strong{font-size:10px;margin-right:auto}.wm54-previewhead select,.wm54-previewhead input{min-height:30px;border:1px solid var(--pdf-line);border-radius:6px;background:var(--pdf-surface-soft);color:var(--pdf-ink);padding:5px 7px;font-size:9px}
  .wm54-previewhead select{max-width:210px}.wm54-previewhead input{width:58px}.wm54-previewhead button{width:30px;height:30px;border:1px solid var(--pdf-line);border-radius:6px;background:var(--pdf-surface-soft);color:var(--pdf-ink);cursor:pointer}
  .wm54-previewhead small{font-size:8px;color:var(--pdf-muted);flex-basis:100%}.wm54-previewempty{padding:34px 12px;text-align:center;color:#aeb6c3;font-size:9px}.wm54-frame{width:100%;height:480px;border:0;background:#30343b}
  @media(max-width:700px){.wm54-top{display:grid}.wm54-grid-3,.wm54-grid-4{grid-template-columns:1fr 1fr}.wm54-imagebox{grid-template-columns:1fr}.wm54-thumb{width:100%;height:140px}.wm54-frame{height:380px}}
  @media(max-width:480px){.wm54-grid-3,.wm54-grid-4{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
}
function captureBeforeRender(){if(isWatermark())saveState()}
function render(){
  if(!isWatermark())return;
  ensureStyles();captureBeforeRender();
  const box=el('toolOptions');if(!box)return;
  box.innerHTML=html();box.classList.remove('hidden');box.dataset.watermarkProV54='1';
  bind();
  schedulePreview();
}
function bind(){
  document.querySelectorAll('[data-wm-mode]').forEach(b=>b.onclick=()=>{saveState();state.mode=b.dataset.wmMode;render()});
  const img=el('watermarkImageInput');if(img)img.onchange=e=>{
    const f=e.target.files?.[0];if(!f)return;
    if(!/^image\/(png|jpeg)$/i.test(f.type)&&!/\.(png|jpe?g)$/i.test(f.name)){setStatus('Ảnh dấu chỉ hỗ trợ PNG/JPG.','Stamp image must be PNG/JPG.','error');return}
    window.watermarkFile=f;
    if(stampObjectUrl)URL.revokeObjectURL(stampObjectUrl);stampObjectUrl=URL.createObjectURL(f);render();
  };
  const rm=el('wmRemoveImage');if(rm)rm.onclick=()=>{window.watermarkFile=null;if(stampObjectUrl){URL.revokeObjectURL(stampObjectUrl);stampObjectUrl=null}render()};
  const scale=el('watermarkImageScale');if(scale)scale.oninput=()=>{el('wmScaleValue').textContent=scale.value+'%';saveState();schedulePreview()};
  ['watermarkText','watermarkFontFamily','watermarkFontStyle','watermarkFontSize','watermarkFontColor','watermarkPages','watermarkPosition','watermarkHorizontalAdjust','watermarkVerticalAdjust','watermarkTransparency','watermarkRotation','watermarkMosaic','watermarkLayer'].forEach(id=>{
    const n=el(id);if(!n)return;n.addEventListener('input',()=>{saveState();schedulePreview()});n.addEventListener('change',()=>{saveState();schedulePreview()});
  });
  const pf=el('wmPreviewFile');if(pf)pf.onchange=()=>{saveState();state.previewPage=1;render()};
  const pp=el('wmPreviewPage');if(pp)pp.onchange=()=>{saveState();schedulePreview()};
  const prev=el('wmPrevPage');if(prev)prev.onclick=()=>{state.previewPage=Math.max(1,Number(el('wmPreviewPage')?.value||1)-1);el('wmPreviewPage').value=state.previewPage;schedulePreview()};
  const next=el('wmNextPage');if(next)next.onclick=()=>{state.previewPage=Number(el('wmPreviewPage')?.value||1)+1;el('wmPreviewPage').value=state.previewPage;schedulePreview()};
}
async function ensurePdfLib(){
  if(window.PDFLib?.PDFDocument)return window.PDFLib;
  if(typeof window.ensurePDFLib!=='function')throw new Error('PDF engine loader unavailable.');
  return window.ensurePDFLib();
}
function hexToRgb(hex){
  const h=String(hex||'#000000').replace('#','').padEnd(6,'0');
  return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};
}
async function textPng(text,fontFamily,fontStyle,fontSize,color){
  const dpr=2,pad=Math.max(12,fontSize*.35),weight=fontStyle==='Bold'?'700':'400',italic=fontStyle==='Italic'?'italic':'normal';
  const probe=document.createElement('canvas'),pctx=probe.getContext('2d');
  pctx.font=`${italic} ${weight} ${fontSize*dpr}px "${fontFamily}", Arial, sans-serif`;
  const lines=String(text||'KOHA').split(/\r?\n/),width=Math.max(...lines.map(x=>pctx.measureText(x||' ').width),fontSize*dpr);
  const lineH=fontSize*dpr*1.25,w=Math.ceil(width+pad*dpr*2),h=Math.ceil(lines.length*lineH+pad*dpr*2);
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
  ctx.font=pctx.font;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle=color||'#000';
  lines.forEach((line,i)=>ctx.fillText(line||' ',pad*dpr,pad*dpr+i*lineH));
  const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Canvas export failed')),'image/png'));
  return {bytes:new Uint8Array(await blob.arrayBuffer()),width:w/dpr,height:h/dpr};
}
function parsePages(spec,total){
  const s=String(spec||'all').trim().toLowerCase();if(!s||s==='all')return Array.from({length:total},(_,i)=>i);
  const out=new Set();
  s.split(',').map(x=>x.trim()).filter(Boolean).forEach(part=>{
    if(part.includes('-')){
      const [aa,bb]=part.split('-'),a=aa===''?1:(aa==='end'?total:Number(aa)),b=bb==='end'?total:Number(bb);
      if(Number.isFinite(a)&&Number.isFinite(b))for(let n=Math.max(1,Math.min(a,b));n<=Math.min(total,Math.max(a,b));n++)out.add(n-1);
    }else{
      const n=part==='end'?total:Number(part);if(n>=1&&n<=total)out.add(n-1);
    }
  });
  return [...out].sort((a,b)=>a-b);
}
function placement(pageW,pageH,stampW,stampH){
  const [v,h]=String(state.position||'middle-center').split('-');
  const margin=24;
  let x=h==='left'?margin:h==='right'?pageW-stampW-margin:(pageW-stampW)/2;
  let y=v==='bottom'?margin:v==='top'?pageH-stampH-margin:(pageH-stampH)/2;
  x+=Number(state.horizontalAdjust||0);
  y+=Number(state.verticalAdjust||0);
  return {x,y};
}
function positions(pageW,pageH,stampW,stampH){
  if(!state.mosaic)return [placement(pageW,pageH,stampW,stampH)];
  const xs=[pageW*.18-stampW/2,pageW*.5-stampW/2,pageW*.82-stampW/2],ys=[pageH*.18-stampH/2,pageH*.5-stampH/2,pageH*.82-stampH/2],out=[];
  ys.forEach(y=>xs.forEach(x=>out.push({x:x+state.horizontalAdjust,y:y+state.verticalAdjust})));return out;
}
async function embedStamp(doc){
  if(modeValue()==='image'){
    const f=window.watermarkFile;if(!f)throw new Error(t('Hãy chọn ảnh dấu.','Choose a stamp image.'));
    const bytes=new Uint8Array(await f.arrayBuffer());
    const img=/png/i.test(f.type)||/\.png$/i.test(f.name)?await doc.embedPng(bytes):await doc.embedJpg(bytes);
    return {img,ratio:img.height/img.width};
  }
  if(!String(state.text||'').trim())throw new Error(t('Hãy nhập nội dung watermark.','Enter watermark text.'));
  const r=await textPng(state.text,state.fontFamily,state.fontStyle,state.fontSize,state.fontColor);
  return {img:await doc.embedPng(r.bytes),ratio:r.height/r.width,textWidth:r.width};
}
function stampSize(page,stamp){
  let w;
  if(modeValue()==='image')w=page.getWidth()*(state.imageScale/100);
  else w=Math.min(page.getWidth()*.78,Math.max(30,stamp.textWidth||state.fontSize*4));
  return {w,h:w*stamp.ratio};
}
async function stampDocument(file,onlyPage=null){
  await ensurePdfLib();saveState();
  const src=await PDFLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()),{ignoreEncryption:false});
  let doc=src;
  if(onlyPage!==null){
    const out=await PDFLib.PDFDocument.create(),idx=Math.max(0,Math.min(src.getPageCount()-1,onlyPage));
    const [p]=await out.copyPages(src,[idx]);out.addPage(p);doc=out;
  }
  const stamp=await embedStamp(doc),pages=doc.getPages();
  const targets=onlyPage!==null?[0]:parsePages(state.pages,pages.length);
  for(const idx of targets){
    const p=pages[idx];if(!p)continue;
    const size=stampSize(p,stamp);
    for(const pos of positions(p.getWidth(),p.getHeight(),size.w,size.h)){
      p.drawImage(stamp.img,{x:pos.x,y:pos.y,width:size.w,height:size.h,opacity:state.transparency/100,rotate:PDFLib.degrees(state.rotation)});
    }
  }
  return new Blob([await doc.save()],{type:'application/pdf'});
}
function schedulePreview(){
  clearTimeout(previewTimer);previewTimer=setTimeout(updatePreview,160);
}
async function updatePreview(){
  if(!isWatermark())return;
  saveState();const list=selected(),empty=el('wmPreviewEmpty'),frame=el('wmPreviewFrame'),status=el('wmPreviewStatus');
  if(!list.length){if(empty)empty.hidden=false;if(frame)frame.hidden=true;if(status)status.textContent='';return}
  const fi=Math.min(state.previewFile,list.length-1),file=list[fi];state.previewFile=fi;
  try{
    await ensurePdfLib();
    const src=await PDFLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()),{ignoreEncryption:true});
    const total=src.getPageCount();state.previewPage=Math.min(total,Math.max(1,state.previewPage));
    if(el('wmPreviewPage')){el('wmPreviewPage').max=String(total);el('wmPreviewPage').value=String(state.previewPage)}
    src.destroy?.();
    if(modeValue()==='image'&&!window.watermarkFile){if(empty){empty.hidden=false;empty.textContent=t('Chọn ảnh dấu để xem preview.','Choose a stamp image to preview.')}if(frame)frame.hidden=true;return}
    const blob=await stampDocument(file,state.previewPage-1);
    if(previewObjectUrl)URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=URL.createObjectURL(blob);
    if(frame){frame.src=previewObjectUrl+'#toolbar=0&navpanes=0&view=FitH';frame.hidden=false}
    if(empty)empty.hidden=true;
    if(status)status.textContent=`${t('Trang','Page')} ${state.previewPage}/${total}${!isOffline()&&state.layer==='below'?' · '+t('Preview hiển thị vị trí; layer below áp dụng khi xử lý Online.','Preview shows placement; below layer is applied during Online processing.'):''}`;
  }catch(err){
    console.error('[WM54 preview]',err);if(empty){empty.hidden=false;empty.textContent=t('Không tạo được preview: ','Preview unavailable: ')+err.message}if(frame)frame.hidden=true;
  }
}
function setBusy(on){
  const l=el('loader'),txt=el('processButtonText'),b=el('processButton');
  if(l)l.style.display=on?'block':'none';if(txt)txt.style.display=on?'none':'block';if(b)b.disabled=on||!selected().length;
}
function showOfflineResults(results){
  offlineResults=results;const c=el('resultContainer'),link=el('downloadLink');if(c)c.classList.remove('hidden');
  if(link)link.textContent=results.length===1?t('Tải: ','Download: ')+results[0].name:t('Tải ','Download ')+results.length+' PDF';
  setStatus('Đóng dấu Offline thành công. Tài liệu không rời thiết bị.','Offline watermark completed. The document stayed on this device.','success');
}
async function runOffline(){
  saveState();const list=selected();if(!list.length)throw new Error(t('Vui lòng chọn PDF.','Please choose a PDF.'));
  if(modeValue()==='image'&&!window.watermarkFile)throw new Error(t('Hãy chọn ảnh dấu.','Choose a stamp image.'));
  const results=[];
  for(let i=0;i<list.length;i++){
    setStatus(`Đang đóng dấu Offline ${i+1}/${list.length}…`,`Applying Offline watermark ${i+1}/${list.length}…`);
    results.push({blob:await stampDocument(list[i]),name:list[i].name.replace(/\.pdf$/i,'')+'-watermarked.pdf'});
  }
  showOfflineResults(results);
}
function saveBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},800)}
async function downloadOffline(){
  if(!offlineResults.length)return;
  if(offlineResults.length===1){saveBlob(offlineResults[0].blob,offlineResults[0].name);return}
  for(const r of offlineResults){saveBlob(r.blob,r.name);await new Promise(x=>setTimeout(x,180))}
}
function processOfflineIntercept(e){
  if(!isWatermark()||!isOffline())return;
  e.preventDefault();e.stopImmediatePropagation();
  (async()=>{try{setBusy(true);el('resultContainer')?.classList.add('hidden');await runOffline()}catch(err){console.error('[WM54]',err);setStatus('Lỗi: '+err.message,'Error: '+err.message,'error')}finally{setBusy(false)}})();
}
function downloadOfflineIntercept(e){
  if(!isWatermark()||!isOffline()||!offlineResults.length)return;
  e.preventDefault();e.stopImmediatePropagation();downloadOffline();
}
function sync(){
  const now=el('apiTool')?.value||'';
  if(now==='watermark'){
    if(lastTool!=='watermark'){offlineResults=[];state.previewPage=1}
    const box=el('toolOptions');
    if(box&&box.dataset.watermarkProV54!=='1')render();
  }
  lastTool=now;
}
window.addEventListener('load',()=>{
  ensureStyles();sync();
  el('apiTool')?.addEventListener('change',()=>setTimeout(sync,30));
  el('fileInput')?.addEventListener('change',()=>setTimeout(()=>{if(isWatermark())render()},60));
  el('processButton')?.addEventListener('click',processOfflineIntercept,true);
  el('downloadLink')?.addEventListener('click',downloadOfflineIntercept,true);
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-tool]'))setTimeout(sync,40)},true);
  new MutationObserver(m=>{
    if(m.some(x=>x.type==='attributes'&&x.attributeName==='lang')){if(isWatermark())render()}
    if(isWatermark()&&el('toolOptions')?.dataset.watermarkProV54!=='1')setTimeout(sync,20);
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang'],childList:true,subtree:true});
});
window.NLKH_WATERMARK_PDF_V54=true;
})();
