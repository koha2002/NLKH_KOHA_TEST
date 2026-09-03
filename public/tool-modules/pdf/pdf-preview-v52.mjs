import * as pdfjsLib from './vendor/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;

const PAGE_TOOLS=new Set(['split','deletepages','reorderpages','rotate','pdfjpg']);
const MERGE_TOOL='merge';
let generation=0;
let currentDoc=null;
let currentKey='';
let observer=null;
let selectedPages=new Set();
let reorderPages=[];
let renderTimer=null;
let mergeOriginal=[];
let mergeOriginalSetKey='';

function en(){return String(document.documentElement.lang||'vi').toLowerCase().startsWith('en')}
function t(vi,enText){return en()?enText:vi}
function el(id){return document.getElementById(id)}
function tool(){return el('apiTool')?.value||''}
function files(){try{return Array.from(window.selectedFiles||[])}catch(_){return[]}}
function sig(f){return f?`${f.name}:${f.size}:${f.lastModified}`:''}
function workspace(){
  let w=el('pdfPageWorkspaceV52');
  if(w)return w;
  w=document.createElement('section');
  w.id='pdfPageWorkspaceV52';
  w.className='pdf-page-workspace-v52 hidden';
  const status=el('statusMessage');
  if(status?.parentNode)status.parentNode.insertBefore(w,status);
  return w;
}
function hideWorkspace(){
  const w=workspace();w.classList.add('hidden');w.innerHTML='';
  if(observer){observer.disconnect();observer=null}
  currentDoc=null;currentKey='';selectedPages.clear();reorderPages=[];
}
function formatSize(n){
  if(n<1024)return n+' B';
  if(n<1024*1024)return (n/1024).toFixed(1)+' KB';
  return (n/1024/1024).toFixed(1)+' MB';
}
function compressPages(values){
  const a=[...new Set(values)].sort((x,y)=>x-y);if(!a.length)return'';
  const out=[];let start=a[0],prev=a[0];
  for(let i=1;i<=a.length;i++){
    const cur=a[i];
    if(cur===prev+1){prev=cur;continue}
    out.push(start===prev?String(start):`${start}-${prev}`);
    start=cur;prev=cur;
  }
  return out.join(',');
}
function parseRanges(text,total){
  const out=[];
  String(text||'').split(',').map(x=>x.trim()).filter(Boolean).forEach(part=>{
    if(part.includes('-')){
      const [a,b]=part.split('-').map(Number);
      if(a&&b)for(let n=Math.min(a,b);n<=Math.max(a,b);n++)if(n>=1&&n<=total)out.push(n);
    }else{
      const n=Number(part);if(n>=1&&n<=total)out.push(n);
    }
  });
  return [...new Set(out)];
}
function setInput(id,value){
  const n=el(id);if(!n)return;
  n.value=value;
  n.dispatchEvent(new Event('input',{bubbles:true}));
}
function managedFields(k){
  const del=el('deletePageRange')?.closest('.nlkh-field');
  const reo=el('reorderPageOrder')?.closest('.nlkh-field');
  if(del)del.classList.toggle('pdf-v52-hidden-field',k==='deletepages');
  if(reo)reo.classList.toggle('pdf-v52-hidden-field',k==='reorderpages');
}
function actionButton(action,label){return `<button type="button" data-page-action="${action}">${label}</button>`}
function toolbarHtml(k){
  if(k==='deletepages')return `<div class="pdf-v57-actions">${actionButton('odd',t('Chọn trang lẻ','Select odd'))}${actionButton('even',t('Chọn trang chẵn','Select even'))}${actionButton('clear',t('Bỏ chọn','Clear'))}</div>`;
  if(k==='reorderpages')return `<div class="pdf-v57-actions">${actionButton('reset-order',t('Khôi phục thứ tự','Reset order'))}</div>`;
  if(k==='split')return `<div class="pdf-v57-actions">${actionButton('clear',t('Bỏ chọn nhanh','Clear selection'))}</div>`;
  if(k==='merge')return `<div class="pdf-v57-actions">${actionButton('reset-merge',t('Khôi phục thứ tự file','Reset file order'))}</div>`;
  return '';
}
function headerHtml(k,count,file){
  const copy={
    split:[t('Chọn trang để tạo nhanh các khoảng tách','Select pages to quickly build split ranges'),
           t('Click thumbnail để thêm/bỏ trang; các trang liền nhau tự gộp thành một khoảng.','Click thumbnails to add/remove pages; consecutive pages become one range.')],
    deletepages:[t('Chọn trang cần xóa','Select pages to delete'),
                 t('Click thumbnail hoặc dùng chọn nhanh trang lẻ/chẵn.','Click thumbnails or use odd/even quick selection.')],
    reorderpages:[t('Kéo thả để sắp xếp trang','Drag to reorder pages'),
                  t('Kéo thumbnail sang vị trí mới; thứ tự xử lý cập nhật ngay.','Drag thumbnails to a new position; processing order updates immediately.')],
    rotate:[t('Xem trước các trang sẽ xoay','Preview pages to be rotated'),
            t('Góc xoay được áp dụng cho toàn bộ PDF.','The rotation angle is applied to the entire PDF.')],
    pdfjpg:[t('Xem trước các trang PDF','Preview PDF pages'),
            t('Ở chế độ “Pages”, mỗi trang sẽ được xuất thành JPG.','In “Pages” mode, each page will be exported as JPG.')]
  }[k]||['',''];
  return `<div class="pdf-v52-head">
    <div class="pdf-v57-headcopy"><strong>${copy[0]}</strong><small>${copy[1]}</small></div>
    <div class="pdf-v57-headright"><div class="pdf-v52-meta"><span>${count} ${t('trang','pages')}</span><span>${formatSize(file.size)}</span></div>${toolbarHtml(k)}</div>
  </div>`;
}
function cardShell(pageNum,k){
  const c=document.createElement('article');
  c.className='pdf-v52-page';
  c.dataset.page=String(pageNum);
  c.draggable=k==='reorderpages';
  c.innerHTML=`<div class="pdf-v52-canvasbox"><div class="pdf-v52-skeleton"></div><canvas></canvas></div>
    <footer><span>${t('Trang','Page')} ${pageNum}</span><b class="pdf-v52-state"></b></footer>`;
  if(k==='split'||k==='deletepages'){
    c.addEventListener('click',()=>{
      if(selectedPages.has(pageNum))selectedPages.delete(pageNum);else selectedPages.add(pageNum);
      syncSelectionUi(k);
    });
  }
  if(k==='reorderpages')bindPageDrag(c);
  return c;
}
function syncSelectionUi(k){
  document.querySelectorAll('#pdfPageWorkspaceV52 .pdf-v52-page:not(.pdf-v52-file)').forEach(c=>{
    const n=Number(c.dataset.page),active=selectedPages.has(n);
    c.classList.toggle(k==='deletepages'?'is-delete':'is-selected',active);
    const s=c.querySelector('.pdf-v52-state');
    if(s)s.textContent=active?(k==='deletepages'?t('XÓA','DELETE'):t('ĐÃ CHỌN','SELECTED')):'';
  });
  if(k==='deletepages')setInput('deletePageRange',compressPages(selectedPages));
  if(k==='split')setInput('splitRange',compressPages(selectedPages));
}
function selectPattern(kind){
  if(!currentDoc)return;
  selectedPages.clear();
  for(let n=1;n<=currentDoc.numPages;n++){
    if(kind==='odd'&&n%2===1)selectedPages.add(n);
    if(kind==='even'&&n%2===0)selectedPages.add(n);
  }
  syncSelectionUi(tool());
}
function bindPageDrag(c){
  c.addEventListener('dragstart',e=>{
    c.classList.add('is-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',c.dataset.page);
  });
  c.addEventListener('dragend',()=>{c.classList.remove('is-dragging');syncReorderFromDom()});
  c.addEventListener('dragover',e=>{
    e.preventDefault();
    const grid=c.parentElement,drag=grid.querySelector('.is-dragging');if(!drag||drag===c)return;
    const r=c.getBoundingClientRect();
    const before=e.clientY<r.top+r.height/2 || (Math.abs(e.clientY-(r.top+r.height/2))<r.height*.25 && e.clientX<r.left+r.width/2);
    grid.insertBefore(drag,before?c:c.nextSibling);
  });
}
function syncReorderFromDom(){
  reorderPages=Array.from(document.querySelectorAll('#pdfPageWorkspaceV52 .pdf-v52-page:not(.pdf-v52-file)')).map(c=>Number(c.dataset.page));
  setInput('reorderPageOrder',reorderPages.join(','));
  document.querySelectorAll('#pdfPageWorkspaceV52 .pdf-v52-page:not(.pdf-v52-file)').forEach((c,i)=>{
    const state=c.querySelector('.pdf-v52-state');
    if(state)state.textContent=`${i+1}`;
  });
}
function resetPageOrder(){
  const grid=workspace().querySelector('.pdf-v52-grid');if(!grid)return;
  [...grid.querySelectorAll('.pdf-v52-page')].sort((a,b)=>Number(a.dataset.page)-Number(b.dataset.page)).forEach(c=>grid.appendChild(c));
  syncReorderFromDom();
}
function replaceSelectedFiles(list){
  if(!Array.isArray(window.selectedFiles))return;
  window.selectedFiles.splice(0,window.selectedFiles.length,...list);
  if(typeof window.renderFileList==='function')try{window.renderFileList()}catch(_){}
  const name=el('fileName');
  if(name)name.textContent=list.length>1?`${list.length} ${t('tệp đã được chọn','files selected')}`:(list[0]?.name||t('Chưa có tệp nào được chọn','No file selected'));
}
function mergeSetKey(list){return list.map(sig).sort().join('|')}
function syncMergeFromDom(){
  const cards=[...workspace().querySelectorAll('.pdf-v52-file')];
  const ordered=cards.map(c=>c._kohaFile).filter(Boolean);
  if(ordered.length!==cards.length)return;
  replaceSelectedFiles(ordered);
  workspace().dataset.mergeKey=ordered.map(sig).join('|');
}
function bindMergeDrag(card){
  card.draggable=true;
  card.addEventListener('dragstart',e=>{
    card.classList.add('is-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','merge');
  });
  card.addEventListener('dragend',()=>{card.classList.remove('is-dragging');syncMergeFromDom()});
  card.addEventListener('dragover',e=>{
    e.preventDefault();
    const grid=card.parentElement,drag=grid.querySelector('.is-dragging');if(!drag||drag===card)return;
    const r=card.getBoundingClientRect();
    const before=e.clientX<r.left+r.width/2;
    grid.insertBefore(drag,before?card:card.nextSibling);
  });
}
function resetMergeOrder(){
  if(!mergeOriginal.length)return;
  replaceSelectedFiles(mergeOriginal);
  workspace().dataset.mergeKey='';
  refresh();
}
function bindWorkspaceActions(k){
  workspace().querySelectorAll('[data-page-action]').forEach(b=>b.addEventListener('click',()=>{
    const a=b.dataset.pageAction;
    if(a==='clear'){selectedPages.clear();syncSelectionUi(k)}
    if(a==='odd'||a==='even')selectPattern(a);
    if(a==='reset-order')resetPageOrder();
    if(a==='reset-merge')resetMergeOrder();
  }));
}
async function renderPage(card,doc,myGen){
  if(card.dataset.rendered==='1')return;
  card.dataset.rendered='1';
  try{
    const num=Number(card.dataset.page),page=await doc.getPage(num);
    if(myGen!==generation)return;
    const base=page.getViewport({scale:1});
    const target=150,scale=Math.min(0.42,Math.max(0.16,target/base.width));
    const vp=page.getViewport({scale});
    const canvas=card.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
    const dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.max(1,Math.floor(vp.width*dpr));
    canvas.height=Math.max(1,Math.floor(vp.height*dpr));
    canvas.style.aspectRatio=`${vp.width}/${vp.height}`;
    await page.render({canvasContext:ctx,viewport:page.getViewport({scale:scale*dpr})}).promise;
    if(myGen!==generation)return;
    card.querySelector('.pdf-v52-skeleton')?.remove();
    card.classList.add('is-rendered');
  }catch(err){
    card.classList.add('is-error');
    const sk=card.querySelector('.pdf-v52-skeleton');if(sk)sk.textContent=t('Không render được','Render failed');
  }
}
function observeCards(doc,myGen){
  if(observer)observer.disconnect();
  observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);renderPage(e.target,doc,myGen)}});
  },{rootMargin:'500px 0px'});
  document.querySelectorAll('#pdfPageWorkspaceV52 .pdf-v52-page').forEach(c=>observer.observe(c));
}
async function loadSingle(k,file){
  const myGen=++generation,key=sig(file);
  const w=workspace();w.classList.remove('hidden');w.innerHTML='<div class="pdf-v52-loading">'+t('Đang đọc cấu trúc PDF…','Reading PDF structure…')+'</div>';
  el('emptyPreview')?.classList.add('hidden');
  const data=new Uint8Array(await file.arrayBuffer());
  const doc=await pdfjsLib.getDocument({data}).promise;
  if(myGen!==generation)return;
  currentDoc=doc;currentKey=key;
  w.innerHTML=headerHtml(k,doc.numPages,file)+'<div class="pdf-v52-grid"></div>';
  bindWorkspaceActions(k);
  const grid=w.querySelector('.pdf-v52-grid');
  selectedPages.clear();
  if(k==='split')parseRanges(el('splitRange')?.value,doc.numPages).forEach(n=>selectedPages.add(n));
  if(k==='deletepages')parseRanges(el('deletePageRange')?.value,doc.numPages).forEach(n=>selectedPages.add(n));
  reorderPages=Array.from({length:doc.numPages},(_,i)=>i+1);
  for(let n=1;n<=doc.numPages;n++)grid.appendChild(cardShell(n,k));
  if(k==='split'||k==='deletepages')syncSelectionUi(k);
  if(k==='reorderpages')syncReorderFromDom();
  observeCards(doc,myGen);
}
async function renderMerge(list){
  const setKey=mergeSetKey(list);
  if(setKey!==mergeOriginalSetKey){mergeOriginal=[...list];mergeOriginalSetKey=setKey}
  const myGen=++generation,w=workspace();w.classList.remove('hidden');el('emptyPreview')?.classList.add('hidden');
  w.dataset.mergeKey=list.map(sig).join('|');
  w.innerHTML=`<div class="pdf-v52-head">
    <div class="pdf-v57-headcopy"><strong>${t('Kéo thumbnail để đổi thứ tự gộp','Drag thumbnails to set merge order')}</strong><small>${t('Thứ tự nhìn thấy chính là thứ tự PDF đầu ra.','The visible order is the final PDF order.')}</small></div>
    <div class="pdf-v57-headright"><div class="pdf-v52-meta"><span>${list.length} ${t('tệp','files')}</span></div>${toolbarHtml('merge')}</div>
  </div><div class="pdf-v52-grid pdf-v52-files"></div>`;
  bindWorkspaceActions('merge');
  const grid=w.querySelector('.pdf-v52-grid');
  for(let i=0;i<list.length;i++){
    const file=list[i],card=document.createElement('article');card.className='pdf-v52-page pdf-v52-file';
    card._kohaFile=file;
    card.innerHTML=`<div class="pdf-v52-canvasbox"><div class="pdf-v52-skeleton"></div><canvas></canvas></div><footer><span title="${file.name.replace(/"/g,'&quot;')}">${i+1}. ${file.name}</span><b>${formatSize(file.size)}</b></footer>`;
    bindMergeDrag(card);
    grid.appendChild(card);
    try{
      const doc=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      if(myGen!==generation)return;
      const p=await doc.getPage(1),base=p.getViewport({scale:1}),scale=Math.min(.42,150/base.width),vp=p.getViewport({scale});
      const canvas=card.querySelector('canvas'),dpr=Math.min(2,window.devicePixelRatio||1);
      canvas.width=Math.floor(vp.width*dpr);canvas.height=Math.floor(vp.height*dpr);canvas.style.aspectRatio=`${vp.width}/${vp.height}`;
      await p.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport:p.getViewport({scale:scale*dpr})}).promise;
      card.querySelector('.pdf-v52-skeleton')?.remove();card.classList.add('is-rendered');
      doc.destroy();
    }catch(_){card.classList.add('is-error')}
  }
}
async function refresh(){
  clearTimeout(renderTimer);
  renderTimer=setTimeout(async()=>{
    const k=tool(),list=files();managedFields(k);
    if(k===MERGE_TOOL){
      if(list.length)await renderMerge(list);else hideWorkspace();
      return;
    }
    if(!PAGE_TOOLS.has(k)||!list.length){hideWorkspace();return}
    const key=sig(list[0]);
    if(currentKey===key&&currentDoc&&workspace().querySelector('.pdf-v52-grid')){
      const title=workspace().querySelector('.pdf-v52-head');
      if(title){title.outerHTML=headerHtml(k,currentDoc.numPages,list[0]);bindWorkspaceActions(k)}
      return;
    }
    try{await loadSingle(k,list[0])}
    catch(err){
      console.error('[PDF preview V57]',err);
      const w=workspace();w.classList.remove('hidden');w.innerHTML='<div class="pdf-v52-error">'+t('Không thể tạo thumbnail cho PDF này. Công cụ xử lý vẫn có thể dùng bình thường.','Could not create thumbnails for this PDF. The processing tool can still be used.')+'</div>';
    }
  },80);
}
function bind(){
  el('fileInput')?.addEventListener('change',()=>setTimeout(refresh,40));
  el('apiTool')?.addEventListener('change',()=>{currentKey='';currentDoc=null;setTimeout(refresh,80)});
  document.addEventListener('input',e=>{
    if(e.target?.id==='splitRange'&&currentDoc&&tool()==='split'){
      selectedPages=new Set(parseRanges(e.target.value,currentDoc.numPages));syncSelectionUi('split');
    }
  });
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-tool]'))setTimeout(refresh,100);
  });
  new MutationObserver(m=>{
    if(m.some(x=>x.type==='attributes'&&x.attributeName==='lang'))setTimeout(refresh,50);
    if(m.some(x=>x.type==='childList'))managedFields(tool());
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang'],childList:true,subtree:true});
  setInterval(()=>{
    const list=files(),k=tool();
    if((PAGE_TOOLS.has(k)||k===MERGE_TOOL)&&list.length){
      const key=k===MERGE_TOOL?list.map(sig).join('|'):sig(list[0]);
      const old=k===MERGE_TOOL?workspace().dataset.mergeKey:currentKey;
      if(key!==old)refresh();
    }
  },900);
  refresh();
}
window.addEventListener('load',bind);
window.NLKH_PDFJS_VERSION='6.3.289';
window.NLKH_PDF_PAGE_UX_V57=true;
