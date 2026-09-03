(function(){
'use strict';

const RATIOS={free:null,'1:1':1,'4:3':4/3,'3:4':3/4,'16:9':16/9};
let ratioKey='free';
let rect={x:0,y:0,w:0,h:0};
let imageSize={w:0,h:0};
let dragging=null;
let resizeObserver=null;
let lastFileKey='';
let renderLock=false;

function el(id){return document.getElementById(id)}
function tool(){return el('apiTool')?.value||''}
function isCrop(){return tool()==='cropimage'}
function en(){return String(document.documentElement.lang||'vi').toLowerCase().startsWith('en')}
function t(vi,enText){return en()?enText:vi}
function files(){try{return Array.from(window.selectedFiles||[])}catch(_){return[]}}
function fileKey(){const f=files()[0];return f?`${f.name}:${f.size}:${f.lastModified}`:''}
function clamp(n,a,b){return Math.min(b,Math.max(a,Number(n)||0))}
function round(n){return Math.max(0,Math.round(Number(n)||0))}
function ratio(){return RATIOS[ratioKey]}
function setStatus(msg){
  const p=el('cropV55Info');if(p)p.textContent=msg;
}
function fitRectToRatio(r){
  if(!imageSize.w||!imageSize.h)return;
  if(!r){rect={x:0,y:0,w:imageSize.w,h:imageSize.h};return}
  let w=imageSize.w,h=w/r;
  if(h>imageSize.h){h=imageSize.h;w=h*r}
  rect={x:(imageSize.w-w)/2,y:(imageSize.h-h)/2,w,h};
}
function normalizeRect(){
  rect.w=clamp(rect.w,1,imageSize.w);
  rect.h=clamp(rect.h,1,imageSize.h);
  rect.x=clamp(rect.x,0,Math.max(0,imageSize.w-rect.w));
  rect.y=clamp(rect.y,0,Math.max(0,imageSize.h-rect.h));
}
function writeInputs(){
  normalizeRect();
  const map={cropX:rect.x,cropY:rect.y,cropWidth:rect.w,cropHeight:rect.h};
  Object.entries(map).forEach(([id,v])=>{const n=el(id);if(n)n.value=String(round(v))});
  const dims=el('cropV55Dims');
  if(dims)dims.textContent=`${round(rect.w)} × ${round(rect.h)} px · X ${round(rect.x)} · Y ${round(rect.y)}`;
}
function readInputs(){
  const x=Number(el('cropX')?.value),y=Number(el('cropY')?.value),w=Number(el('cropWidth')?.value),h=Number(el('cropHeight')?.value);
  if(Number.isFinite(x))rect.x=x;if(Number.isFinite(y))rect.y=y;if(Number.isFinite(w)&&w>0)rect.w=w;if(Number.isFinite(h)&&h>0)rect.h=h;
  if(ratio()){
    const r=ratio();
    if(rect.w/rect.h>r)rect.w=rect.h*r;else rect.h=rect.w/r;
  }
  normalizeRect();writeInputs();updateOverlay();
}
function html(){
  return `<div class="crop-v55">
    <div class="crop-v55-head">
      <div><strong>${t('Cắt ảnh trực tiếp','Interactive image crop')}</strong><small>${t('Kéo vùng chọn trên ảnh; tọa độ được lưu theo pixel ảnh gốc.','Drag the selection on the image; coordinates are stored in original-image pixels.')}</small></div>
      <span>OFFLINE + ONLINE</span>
    </div>
    <div class="crop-v55-presets">
      ${Object.keys(RATIOS).map(k=>`<button type="button" data-crop-ratio="${k}" class="${ratioKey===k?'active':''}">${k==='free'?t('Tự do','Free'):k}</button>`).join('')}
      <button type="button" id="cropV55Reset">${t('Toàn ảnh','Full image')}</button>
    </div>
    <div class="crop-v55-summary">
      <span id="cropV55Dims">—</span>
      <small>${t('Kéo giữa vùng để di chuyển · kéo góc để thay đổi kích thước','Drag inside to move · drag a corner to resize')}</small>
    </div>
    <details class="crop-v55-advanced">
      <summary>${t('Tọa độ chính xác','Exact coordinates')}</summary>
      <div class="crop-v55-grid">
        <label>X <input id="cropX" type="number" min="0" step="1"></label>
        <label>Y <input id="cropY" type="number" min="0" step="1"></label>
        <label>${t('Rộng','Width')} <input id="cropWidth" type="number" min="1" step="1"></label>
        <label>${t('Cao','Height')} <input id="cropHeight" type="number" min="1" step="1"></label>
      </div>
    </details>
    <div id="cropV55Info" class="crop-v55-note">${t('Chọn một ảnh để bắt đầu.','Choose an image to begin.')}</div>
  </div>`;
}
function ensureOverlayMarkup(){
  const o=el('cropOverlay');if(!o)return;
  o.classList.add('crop-v55-overlay');
  if(!o.querySelector('.crop-v55-guides')){
    o.innerHTML=`<div class="crop-v55-guides"><i></i><i></i><i></i><i></i></div>
      <b class="crop-v55-handle nw" data-handle="nw"></b>
      <b class="crop-v55-handle ne" data-handle="ne"></b>
      <b class="crop-v55-handle sw" data-handle="sw"></b>
      <b class="crop-v55-handle se" data-handle="se"></b>`;
  }
  o.style.pointerEvents='auto';
}
function imageGeometry(){
  const img=el('previewImage'),container=img?.closest('.preview-container');
  if(!img||!container||!img.naturalWidth||!img.naturalHeight)return null;
  const ir=img.getBoundingClientRect(),cr=container.getBoundingClientRect();
  if(!ir.width||!ir.height)return null;
  return {
    img,container,
    left:ir.left-cr.left,top:ir.top-cr.top,
    displayW:ir.width,displayH:ir.height,
    scaleX:ir.width/img.naturalWidth,scaleY:ir.height/img.naturalHeight
  };
}
function updateOverlay(){
  if(!isCrop())return;
  const o=el('cropOverlay'),g=imageGeometry();
  if(!o||!g||!imageSize.w||!imageSize.h){if(o)o.style.display='none';return}
  normalizeRect();
  o.style.display='block';
  o.style.left=(g.left+rect.x*g.scaleX)+'px';
  o.style.top=(g.top+rect.y*g.scaleY)+'px';
  o.style.width=Math.max(1,rect.w*g.scaleX)+'px';
  o.style.height=Math.max(1,rect.h*g.scaleY)+'px';
  writeInputs();
}
function initializeFromImage(force=false){
  if(!isCrop())return;
  const img=el('previewImage');if(!img?.naturalWidth||!img?.naturalHeight)return;
  const key=fileKey();
  const changed=key!==lastFileKey||imageSize.w!==img.naturalWidth||imageSize.h!==img.naturalHeight;
  imageSize={w:img.naturalWidth,h:img.naturalHeight};
  if(force||changed||!rect.w||!rect.h){fitRectToRatio(ratio());lastFileKey=key}
  normalizeRect();writeInputs();ensureOverlayMarkup();updateOverlay();
  setStatus(t(`Ảnh gốc: ${imageSize.w} × ${imageSize.h}px. Vùng crop đang dùng tọa độ ảnh thật.`,
              `Original: ${imageSize.w} × ${imageSize.h}px. Crop coordinates use original-image pixels.`));
}
function setRatio(key){
  if(!(key in RATIOS))key='free';
  ratioKey=key;
  fitRectToRatio(ratio());
  renderUi(false);
  updateOverlay();
}
function renderUi(reinit=false){
  if(!isCrop()||renderLock)return;
  const box=el('toolOptions');if(!box)return;
  renderLock=true;
  try{
    box.innerHTML=html();box.classList.remove('hidden');box.dataset.cropProV55='1';
    bindUi();
    writeInputs();
    if(reinit)initializeFromImage(true);else updateOverlay();
  }finally{renderLock=false}
}
function bindUi(){
  document.querySelectorAll('[data-crop-ratio]').forEach(b=>b.onclick=()=>setRatio(b.dataset.cropRatio));
  const reset=el('cropV55Reset');if(reset)reset.onclick=()=>{ratioKey='free';fitRectToRatio(null);renderUi(false);updateOverlay()};
  ['cropX','cropY','cropWidth','cropHeight'].forEach(id=>{
    const n=el(id);if(!n)return;
    n.addEventListener('input',readInputs);n.addEventListener('change',readInputs);
  });
}
function naturalDelta(dx,dy){
  const g=imageGeometry();if(!g)return{x:0,y:0};
  return{x:dx/g.scaleX,y:dy/g.scaleY};
}
function startDrag(e){
  if(!isCrop()||e.button!==0)return;
  const o=el('cropOverlay');if(!o||o.style.display==='none')return;
  e.preventDefault();e.stopPropagation();
  const handle=e.target.closest?.('[data-handle]')?.dataset.handle||'move';
  dragging={handle,startX:e.clientX,startY:e.clientY,start:{...rect},pointerId:e.pointerId};
  try{o.setPointerCapture(e.pointerId)}catch(_){}
}
function resizeFree(handle,start,dx,dy){
  let x=start.x,y=start.y,w=start.w,h=start.h;
  if(handle.includes('w')){x=start.x+dx;w=start.w-dx}
  if(handle.includes('e'))w=start.w+dx;
  if(handle.includes('n')){y=start.y+dy;h=start.h-dy}
  if(handle.includes('s'))h=start.h+dy;
  if(w<1){if(handle.includes('w'))x-=1-w;w=1}
  if(h<1){if(handle.includes('n'))y-=1-h;h=1}
  return{x,y,w,h};
}
function resizeFixed(handle,start,dx,dy,r){
  const left=handle.includes('w'),top=handle.includes('n');
  const anchorX=left?start.x+start.w:start.x;
  const anchorY=top?start.y+start.h:start.y;
  let movingX=left?start.x+dx:start.x+start.w+dx;
  let movingY=top?start.y+dy:start.y+start.h+dy;
  let w=Math.abs(movingX-anchorX),h=Math.abs(movingY-anchorY);
  if(w/Math.max(h,.001)>r)h=w/r;else w=h*r;
  w=Math.max(1,w);h=Math.max(1,h);
  let x=left?anchorX-w:anchorX;
  let y=top?anchorY-h:anchorY;
  if(x<0){w+=x;x=0;h=w/r;y=top?anchorY-h:anchorY}
  if(y<0){h+=y;y=0;w=h*r;x=left?anchorX-w:anchorX}
  if(x+w>imageSize.w){w=imageSize.w-x;h=w/r;y=top?anchorY-h:anchorY}
  if(y+h>imageSize.h){h=imageSize.h-y;w=h*r;x=left?anchorX-w:anchorX}
  return{x,y,w,h};
}
function moveDrag(e){
  if(!dragging)return;
  e.preventDefault();
  const d=naturalDelta(e.clientX-dragging.startX,e.clientY-dragging.startY);
  const s=dragging.start;
  if(dragging.handle==='move'){
    rect={x:s.x+d.x,y:s.y+d.y,w:s.w,h:s.h};
  }else{
    rect=ratio()?resizeFixed(dragging.handle,s,d.x,d.y,ratio()):resizeFree(dragging.handle,s,d.x,d.y);
  }
  normalizeRect();writeInputs();updateOverlay();
}
function endDrag(e){
  if(!dragging)return;
  try{el('cropOverlay')?.releasePointerCapture(dragging.pointerId)}catch(_){}
  dragging=null;writeInputs();updateOverlay();
}
function hideWhenNotCrop(){
  const o=el('cropOverlay');if(o&&!isCrop()){o.style.display='none';o.style.pointerEvents='none'}
}
function sync(){
  if(isCrop()){
    const box=el('toolOptions');
    if(box?.dataset.cropProV55!=='1')renderUi(false);
    ensureOverlayMarkup();
    const img=el('previewImage');
    if(img?.complete&&img.naturalWidth)initializeFromImage(false);
  }else hideWhenNotCrop();
}
function boot(){
  const o=el('cropOverlay');if(o){
    o.addEventListener('pointerdown',startDrag);
    o.addEventListener('pointermove',moveDrag);
    o.addEventListener('pointerup',endDrag);
    o.addEventListener('pointercancel',endDrag);
  }
  const img=el('previewImage');if(img)img.addEventListener('load',()=>setTimeout(()=>initializeFromImage(true),0));
  window.addEventListener('resize',()=>updateOverlay());
  if('ResizeObserver'in window){
    resizeObserver=new ResizeObserver(()=>updateOverlay());
    const c=img?.closest('.preview-container');if(c)resizeObserver.observe(c);
    if(img)resizeObserver.observe(img);
  }
  el('apiTool')?.addEventListener('change',()=>setTimeout(sync,30));
  el('fileInput')?.addEventListener('change',()=>setTimeout(sync,60));
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-tool]'))setTimeout(sync,40)},true);
  new MutationObserver(m=>{
    if(m.some(x=>x.type==='attributes'&&x.attributeName==='lang')){if(isCrop())renderUi(false)}
    if(isCrop()&&el('toolOptions')?.dataset.cropProV55!=='1')setTimeout(sync,20);
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang'],childList:true,subtree:true});
  sync();
}
window.addEventListener('load',boot);
window.NLKH_CROP_IMAGE_V55=true;
})();
