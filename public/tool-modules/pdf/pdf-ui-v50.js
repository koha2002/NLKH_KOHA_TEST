(function(){
'use strict';

const PUBLIC_KEY='project_public_b518756fab3a8e6942a9330c23a7859a_YUAga5611529e21b17310f7e19ec3547395e1';

const CAP={
  compress:{offline:false,online:true},
  merge:{offline:true,online:true},
  split:{offline:true,online:true},
  splitsmart:{offline:false,online:true},
  pdfocr:{offline:false,online:true},
  unlock:{offline:false,online:true},
  protect:{offline:false,online:true},
  rotate:{offline:true,online:true},
  watermark:{offline:true,online:true},
  pdfa:{offline:false,online:true},
  wordpdf:{offline:false,online:true},
  powerpointpdf:{offline:false,online:true},
  excelpdf:{offline:false,online:true},
  pdfjpg:{offline:false,online:true},
  imagepdf:{offline:true,online:true},
  pagenumber:{offline:true,online:false},
  extract:{offline:false,online:true},
  repair:{offline:false,online:true},
  deletepages:{offline:true,online:false},
  reorderpages:{offline:true,online:false},
  compressimage:{offline:true,online:true},
  resizeimage:{offline:true,online:true},
  cropimage:{offline:true,online:true},
  rotateimage:{offline:true,online:true},
  convertimage:{offline:true,online:true},
  watermarkimage:{offline:true,online:true},
  removebackgroundimage:{offline:false,online:true}
};

const API_ALIAS={wordpdf:'officepdf',powerpointpdf:'officepdf',excelpdf:'officepdf'};
const OFFICE=new Set(['wordpdf','powerpointpdf','excelpdf']);
const PROTECTED_UI=new Set(['watermark','pagenumber','cropimage']);
let lastTool='';
let renderQueued=false;

function en(){return String(document.documentElement.lang||'vi').toLowerCase().startsWith('en')}
function t(vi,enText){return en()?enText:vi}
function el(id){return document.getElementById(id)}
function tool(){return el('apiTool')?.value||''}
function files(){try{return Array.from(window.selectedFiles||[])}catch(_){return[]}}
function mode(){return (localStorage.getItem('nlkh_pdf_mode')||'offline').toLowerCase()==='online'?'online':'offline'}
function modeBtn(m){return document.querySelector('.processing-mode [data-mode="'+m+'"]')}
function cap(k){return CAP[k]||{offline:false,online:true}}
function setStatus(vi,enText,type='info'){
  const s=el('statusMessage'); if(!s)return;
  s.textContent=t(vi,enText); s.className='status-message status--'+type;
}
function setBusy(on){
  const l=el('loader'),txt=el('processButtonText'),b=el('processButton');
  if(l)l.style.display=on?'block':'none';
  if(txt)txt.style.display=on?'none':'block';
  if(b)b.disabled=on||files().length===0;
}
function setMode(m){
  const b=modeBtn(m);
  if(b&&!b.hidden&&!b.disabled){
    if(mode()!==m)b.click();
  }else localStorage.setItem('nlkh_pdf_mode',m);
}
function addTools(){
  const s=el('apiTool'); if(!s)return;
  const g=Array.from(s.querySelectorAll('optgroup')).find(x=>/PDF/i.test(x.label||''))||s;
  if(!s.querySelector('[value="splitsmart"]')){
    const o=document.createElement('option'); o.value='splitsmart'; o.textContent='Tách PDF thông minh bằng AI';
    const a=s.querySelector('[value="split"]'); a?a.insertAdjacentElement('afterend',o):g.appendChild(o);
  }
  if(!s.querySelector('[value="pdfocr"]')){
    const o=document.createElement('option'); o.value='pdfocr'; o.textContent='OCR PDF';
    const a=s.querySelector('[value="splitsmart"]'); a?a.insertAdjacentElement('afterend',o):g.appendChild(o);
  }
}
const TOOL_GROUPS_V57={
  organize:['Sắp xếp & trang','Organize & Pages'],
  improve:['Tối ưu & nhận dạng','Optimize & OCR'],
  edit:['Chỉnh sửa & đánh dấu','Edit & Mark'],
  topdf:['Chuyển sang PDF','Convert to PDF'],
  frompdf:['Xuất từ PDF','Export from PDF'],
  security:['Bảo mật PDF','PDF Security'],
  images:['Công cụ hình ảnh','Image Tools']
};
const TOOL_META_V57={
  merge:{g:'organize',vi:'Gộp PDF',en:'Merge PDF',k:'gop noi merge combine join'},
  split:{g:'organize',vi:'Tách PDF',en:'Split PDF',k:'tach cat chia split ranges'},
  splitsmart:{g:'organize',vi:'Tách PDF thông minh bằng AI',en:'Smart Split PDF with AI',k:'tach ai smart hoa don hop dong chuong invoice contract'},
  deletepages:{g:'organize',vi:'Xóa trang PDF',en:'Delete PDF Pages',k:'xoa trang delete remove page'},
  reorderpages:{g:'organize',vi:'Sắp xếp trang PDF',en:'Reorder PDF Pages',k:'sap xep trang thu tu reorder organize page'},
  rotate:{g:'organize',vi:'Xoay PDF',en:'Rotate PDF',k:'xoay rotate page'},
  compress:{g:'improve',vi:'Nén PDF',en:'Compress PDF',k:'nen giam dung luong compress size zip'},
  pdfocr:{g:'improve',vi:'OCR PDF',en:'OCR PDF',k:'ocr scan nhan dang chu searchable text'},
  repair:{g:'improve',vi:'Sửa PDF',en:'Repair PDF',k:'sua hong repair corrupt fix'},
  pdfa:{g:'improve',vi:'PDF → PDF/A',en:'PDF → PDF/A',k:'pdfa luu tru archive long term'},
  watermark:{g:'edit',vi:'Đóng dấu PDF',en:'Watermark PDF',k:'dong dau watermark ban quyen text image'},
  pagenumber:{g:'edit',vi:'Đánh số trang',en:'Page Numbers',k:'danh so trang number page'},
  wordpdf:{g:'topdf',vi:'Word → PDF',en:'Word → PDF',k:'word doc docx office pdf'},
  powerpointpdf:{g:'topdf',vi:'PowerPoint → PDF',en:'PowerPoint → PDF',k:'powerpoint ppt pptx office pdf'},
  excelpdf:{g:'topdf',vi:'Excel → PDF',en:'Excel → PDF',k:'excel xls xlsx office pdf'},
  imagepdf:{g:'topdf',vi:'Ảnh → PDF',en:'Image → PDF',k:'anh hinh jpg png image pdf'},
  pdfjpg:{g:'frompdf',vi:'PDF → JPG',en:'PDF → JPG',k:'pdf jpg jpeg image export'},
  extract:{g:'frompdf',vi:'Trích xuất văn bản',en:'Extract Text',k:'trich xuat van ban text extract data'},
  protect:{g:'security',vi:'Bảo vệ PDF',en:'Protect PDF',k:'bao ve mat khau password encrypt security'},
  unlock:{g:'security',vi:'Mở khóa PDF',en:'Unlock PDF',k:'mo khoa mat khau password unlock decrypt'},
  compressimage:{g:'images',vi:'Nén ảnh',en:'Compress Image',k:'nen anh image compress'},
  resizeimage:{g:'images',vi:'Đổi kích thước ảnh',en:'Resize Image',k:'doi kich thuoc resize image width height'},
  cropimage:{g:'images',vi:'Cắt ảnh',en:'Crop Image',k:'cat anh crop image'},
  rotateimage:{g:'images',vi:'Xoay ảnh',en:'Rotate Image',k:'xoay anh rotate image'},
  convertimage:{g:'images',vi:'Đổi định dạng ảnh',en:'Convert Image',k:'doi dinh dang convert jpg png gif heic'},
  watermarkimage:{g:'images',vi:'Đóng dấu ảnh',en:'Watermark Image',k:'dong dau anh watermark image'},
  removebackgroundimage:{g:'images',vi:'Xóa nền ảnh',en:'Remove Image Background',k:'xoa nen background remove image'}
};
function normalizeToolQueryV57(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ').trim();
}
function chooseToolV57(id){
  const s=el('apiTool');if(!s||!s.querySelector('[value="'+id+'"]'))return;
  s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));
  const q=el('toolSearchV57'),r=el('toolSearchResultsV57');if(q)q.value='';if(r){r.classList.add('hidden');r.innerHTML=''}
}
function renderToolFinderV57(){
  const q=el('toolSearchV57'),box=el('toolSearchResultsV57');if(!q||!box)return;
  const term=normalizeToolQueryV57(q.value);
  q.setAttribute('aria-expanded',term?'true':'false');
  if(!term){box.classList.add('hidden');box.innerHTML='';return}
  const matches=Object.entries(TOOL_META_V57).map(([id,m])=>{
    const hay=normalizeToolQueryV57([m.vi,m.en,m.k,TOOL_GROUPS_V57[m.g][0],TOOL_GROUPS_V57[m.g][1]].join(' '));
    let score=hay.includes(term)?1:0;
    const name=normalizeToolQueryV57(en()?m.en:m.vi);
    if(name.startsWith(term))score+=3;else if(name.includes(term))score+=2;
    return {id,m,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(en()?a.m.en.localeCompare(b.m.en):a.m.vi.localeCompare(b.m.vi))).slice(0,8);
  if(!matches.length){box.innerHTML='<div class="tool-finder-v57__empty">'+t('Không tìm thấy công cụ phù hợp.','No matching tool found.')+'</div>';box.classList.remove('hidden');return}
  box.innerHTML=matches.map((x,i)=>'<button type="button" role="option" data-find-tool="'+x.id+'" data-result-index="'+i+'"><span><strong>'+(en()?x.m.en:x.m.vi)+'</strong><small>'+TOOL_GROUPS_V57[x.m.g][en()?1:0]+'</small></span><i>→</i></button>').join('');
  box.classList.remove('hidden');
  box.querySelectorAll('[data-find-tool]').forEach(b=>b.addEventListener('click',()=>chooseToolV57(b.dataset.findTool)));
}
function ensureToolFinderV57(){
  const q=el('toolSearchV57');if(!q||q.dataset.boundV57==='1')return;
  q.dataset.boundV57='1';
  q.addEventListener('input',renderToolFinderV57);
  q.addEventListener('focus',renderToolFinderV57);
  q.addEventListener('keydown',e=>{
    const box=el('toolSearchResultsV57'),items=[...box.querySelectorAll('[data-find-tool]')];
    if(e.key==='Escape'){box.classList.add('hidden');q.blur();return}
    if(!items.length)return;
    const active=document.activeElement?.dataset?.resultIndex;
    let i=Number.isFinite(Number(active))?Number(active):-1;
    if(e.key==='ArrowDown'){e.preventDefault();items[Math.min(items.length-1,i+1)].focus()}
    if(e.key==='ArrowUp'){e.preventDefault();items[Math.max(0,i<=0?0:i-1)].focus()}
    if(e.key==='Enter'&&items[0]){e.preventDefault();chooseToolV57(items[0].dataset.findTool)}
  });
  const box=el('toolSearchResultsV57');
  if(box)box.addEventListener('keydown',e=>{
    const items=[...box.querySelectorAll('[data-find-tool]')],i=items.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){e.preventDefault();items[Math.min(items.length-1,i+1)]?.focus()}
    if(e.key==='ArrowUp'){e.preventDefault();if(i<=0)q.focus();else items[i-1]?.focus()}
    if(e.key==='Escape'){box.classList.add('hidden');q.focus()}
    if(e.key==='Enter'&&document.activeElement?.dataset?.findTool)chooseToolV57(document.activeElement.dataset.findTool)
  });
  document.addEventListener('click',e=>{if(!e.target.closest?.('#toolFinderV57'))el('toolSearchResultsV57')?.classList.add('hidden')});
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();q.focus()}
  });
}
function localizeToolNames(){
  const s=el('apiTool'); if(!s)return;
  Object.entries(TOOL_META_V57).forEach(([id,m])=>{const o=s.querySelector('[value="'+id+'"]');if(o)o.textContent=en()?m.en:m.vi});
  s.querySelectorAll('optgroup[data-group]').forEach(g=>{const v=TOOL_GROUPS_V57[g.dataset.group];if(v)g.label=v[en()?1:0]});
  document.querySelectorAll('.quick-tool[data-tool]').forEach(b=>{const m=TOOL_META_V57[b.dataset.tool],strong=b.querySelector('strong');if(m&&strong)strong.textContent=en()?m.en:m.vi});
  const title=el('selectedToolName'),o=s.options[s.selectedIndex];if(title&&o)title.textContent=o.textContent;
  const finderLabel=el('toolFinderLabelV57');if(finderLabel)finderLabel.textContent=t('Tìm nhanh công cụ','Find a tool');
  const q=el('toolSearchV57');if(q)q.placeholder=t('Gõ: gộp, OCR, Word, mật khẩu...','Try: merge, OCR, Word, password...');
  const browse=document.querySelector('.select-label[for="apiTool"]');if(browse)browse.textContent=t('Duyệt theo nhóm','Browse by category');
  const intro=document.querySelector('.studio-intro');if(intro)intro.textContent=t('27 công cụ được sắp theo việc bạn muốn làm: trang, tối ưu, chỉnh sửa, chuyển đổi, bảo mật và hình ảnh.','27 tools are organized by what you want to do: pages, optimize, edit, convert, secure, and images.');
  const metric=document.querySelector('.studio-metrics div:nth-child(2) span');if(metric)metric.textContent=t('Nhóm tác vụ rõ ràng','Clear task groups');
  ensureToolFinderV57();renderToolFinderV57();
}
function placeMode(){
  const s=el('apiTool'),m=document.querySelector('.processing-mode');
  if(!s||!m)return;
  if(m.previousElementSibling!==s)s.insertAdjacentElement('afterend',m);
  const old=document.querySelector('.offline-note'); if(old)old.style.display='none';
}
function card(){
  let c=el('nlkh-capability-v51');
  if(!c){c=document.createElement('div');c.id='nlkh-capability-v51';c.className='nlkh-capability-v51'}
  const m=document.querySelector('.processing-mode');
  if(m&&c.previousElementSibling!==m)m.insertAdjacentElement('afterend',c);
  return c;
}
function renderCapability(changed){
  const k=tool(),c=cap(k),off=modeBtn('offline'),on=modeBtn('online');
  if(off){off.hidden=!c.offline;off.disabled=!c.offline}
  if(on){on.hidden=!c.online;on.disabled=!c.online}
  if(changed){
    if(c.offline)setMode('offline'); else if(c.online)setMode('online');
  }else{
    if(mode()==='offline'&&!c.offline&&c.online)setMode('online');
    if(mode()==='online'&&!c.online&&c.offline)setMode('offline');
  }
  const box=card(); if(!box)return;
  const active=mode();
  const badge=c.offline&&c.online?'OFFLINE + ONLINE':c.offline?t('CHỈ OFFLINE','OFFLINE ONLY'):t('CHỈ ONLINE','ONLINE ONLY');
  const privacy=active==='offline'
    ? t('Tài liệu không rời thiết bị.','The document stays on this device.')
    : t('File sẽ được gửi đến dịch vụ xử lý Online.','The file will be sent to the Online processing service.');
  box.innerHTML='<div class="nlkh-capability-head"><strong>'+badge+'</strong><span>'+privacy+'</span></div>'+
    ((!c.offline&&c.online)?'<div class="nlkh-capability-warning">'+
      t('Không có bản Offline đã được kiểm chứng cho tác vụ này.','No verified Offline implementation is enabled for this task.')+
    '</div>':'');
}
function field(label,html,note=''){return '<div class="nlkh-field"><label>'+label+'</label>'+html+(note?'<small>'+note+'</small>':'')+'</div>'}
function select(id,options,value){
  return '<select id="'+id+'">'+options.map(x=>'<option value="'+x[0]+'"'+(x[0]===value?' selected':'')+'>'+x[1]+'</option>').join('')+'</select>';
}
function input(id,type='text',value='',attrs=''){return '<input id="'+id+'" type="'+type+'" value="'+String(value).replace(/"/g,'&quot;')+'" '+attrs+'>'}
function checkbox(id,label,checked=false){
  return '<label class="nlkh-check"><input id="'+id+'" type="checkbox" '+(checked?'checked':'')+'><span>'+label+'</span></label>';
}
function note(vi,enText){return '<div class="nlkh-task-note">'+t(vi,enText)+'</div>'}
function onlineBadge(){return '<span class="nlkh-inline-badge">ONLINE</span>'}
function offlineBadge(){return '<span class="nlkh-inline-badge is-local">OFFLINE</span>'}

function officeHtml(k){
  const m={wordpdf:['Word','DOC / DOCX'],excelpdf:['Excel','XLS / XLSX'],powerpointpdf:['PowerPoint','PPT / PPTX']}[k];
  return '<div class="nlkh-task-head">'+onlineBadge()+'<strong>'+m[0]+' → PDF</strong></div>'+
    note('Không có setting giả. iLoveAPI Office → PDF tự chuyển tài liệu sang PDF. Hỗ trợ '+m[1]+'.',
         'No fake settings are shown. iLoveAPI Office → PDF converts the document directly. Supports '+m[1]+'.');
}
function optionsHtml(k){
  const m=mode();
  if(OFFICE.has(k))return officeHtml(k);
  if(k==='splitsmart')return '<div class="nlkh-task-head">'+onlineBadge()+'<strong>'+t('Tách PDF thông minh','Smart Split PDF')+'</strong></div>'+
    field(t('Yêu cầu tách','Split instructions'),'<textarea id="smartSplitPrompt" rows="5" placeholder="'+t('Ví dụ: Tách mỗi hóa đơn thành một file PDF riêng.','Example: Split each invoice into a separate PDF file.')+'"></textarea>')+
    '<div class="nlkh-prompt-presets"><button type="button" data-prompt="'+t('Tách mỗi hóa đơn thành một file PDF riêng.','Split each invoice into a separate PDF file.')+'">'+t('Mỗi hóa đơn','Each invoice')+'</button><button type="button" data-prompt="'+t('Tách mỗi hợp đồng hoặc phụ lục độc lập thành một file.','Split each independent contract or appendix into a separate file.')+'">'+t('Mỗi hợp đồng','Each contract')+'</button><button type="button" data-prompt="'+t('Tách tài liệu theo từng chương chính.','Split the document by main chapters.')+'">'+t('Theo chương','By chapter')+'</button></div>'+
    note('AI cần đọc nội dung PDF trên dịch vụ Online để xác định điểm tách.','AI reads the PDF through the Online service to determine split points.');
  if(k==='pdfocr')return '<div class="nlkh-task-head">'+onlineBadge()+'<strong>'+t('OCR PDF','OCR PDF')+'</strong></div>'+
    note('Dùng cho PDF scan/ảnh để tạo lớp chữ có thể tìm kiếm và sao chép.','Use scanned/image PDFs to create searchable and copyable text.')+
    field(t('Ngôn ngữ tài liệu','Document languages'),'<div class="nlkh-ocr-langs"><label><input type="checkbox" name="ocrLang" value="vie" checked> '+t('Tiếng Việt','Vietnamese')+'</label><label><input type="checkbox" name="ocrLang" value="eng" checked> English</label><label><input type="checkbox" name="ocrLang" value="chi_sim"> '+t('Trung giản thể','Chinese (Simplified)')+'</label><label><input type="checkbox" name="ocrLang" value="jpn"> '+t('Tiếng Nhật','Japanese')+'</label></div>');
  if(k==='compress')return field(t('Mức độ nén','Compression level'),select('compressionLevel',[
    ['low',t('Nén thấp · chất lượng cao','Low · high quality')],
    ['recommended',t('Khuyến nghị','Recommended')],
    ['extreme',t('Nén cao · file nhỏ','Extreme · smaller file')]
  ],'recommended'));
  if(k==='merge')return note('Thêm nhiều PDF rồi kéo sắp xếp ở bảng bên phải. Không có setting thừa.','Add multiple PDFs and drag to reorder them in the right panel. No unnecessary settings.');
  if(k==='split'){
    const splitModes=m==='offline'
      ? [['ranges',t('Theo khoảng trang','Page ranges')],['fixed_range',t('Mỗi N trang','Every N pages')]]
      : [['ranges',t('Theo khoảng trang','Page ranges')],['fixed_range',t('Mỗi N trang','Every N pages')],['filesize',t('Theo dung lượng tối đa','Maximum file size')]];
    let sm=el('splitMode')?.value||'ranges';
    if(!splitModes.some(x=>x[0]===sm))sm='ranges';
    return field(t('Kiểu tách','Split mode'),select('splitMode',splitModes,sm))+
    (sm==='ranges'?field(t('Khoảng trang','Page ranges'),input('splitRange','text','', 'placeholder="1-3,5,8-10"'),t('Mỗi khoảng tạo thành một PDF riêng.','Each range becomes a separate PDF.')):'')+
    (sm==='fixed_range'?field(t('Số trang mỗi file','Pages per file'),input('splitFixedRange','number','1','min="1" step="1"')):'')+
    (sm==='filesize'?field(t('Dung lượng tối đa','Maximum file size'),input('splitFilesize','number','10','min="1" step="1"'),t('MB trên mỗi file đầu ra.','MB per output file.')):'')+
    (m==='offline'?note('Offline tạo nhiều PDF thật ngay trên thiết bị. Chế độ chia theo dung lượng chỉ có ở Online.','Offline creates real multiple PDFs on-device. Maximum-file-size splitting is available Online only.'):'');
  }
  if(k==='unlock')return field(t('Mật khẩu hiện tại','Current password'),input('passwordInput','password','','autocomplete="current-password"'))+
    checkbox('showPassword',t('Hiện mật khẩu','Show password'))+
    note('Chỉ mở khóa khi bạn biết mật khẩu. Công cụ không dò hoặc bẻ khóa mật khẩu.','Unlock only when you know the password. This tool does not crack passwords.');
  if(k==='protect')return field(t('Mật khẩu mới','New password'),input('passwordInput','password','','autocomplete="new-password"'))+
    field(t('Nhập lại mật khẩu','Confirm password'),input('passwordConfirm','password','','autocomplete="new-password"'))+
    checkbox('showPassword',t('Hiện mật khẩu','Show password'));
  if(k==='rotate'||k==='rotateimage')return field(t('Góc xoay','Rotation'),select('rotateAngle',[
    ['90',t('90° sang phải','90° right')],['180','180°'],['270',t('270° · sang trái','270° · left')]
  ],'90'))+note(k==='rotate'?t('Áp dụng cho toàn bộ trang của PDF.','Applied to all PDF pages.'):t('Xoay ảnh đã chọn.','Rotate the selected image.'));
  if(k==='pdfa')return field(t('Chuẩn PDF/A','PDF/A conformance'),select('pdfaConformance',[
    ['pdfa-2b','PDF/A-2b · '+t('khuyến nghị','recommended')],
    ['pdfa-1b','PDF/A-1b'],['pdfa-1a','PDF/A-1a'],['pdfa-2u','PDF/A-2u'],['pdfa-2a','PDF/A-2a'],
    ['pdfa-3b','PDF/A-3b'],['pdfa-3u','PDF/A-3u'],['pdfa-3a','PDF/A-3a']
  ],'pdfa-2b'))+checkbox('pdfaDowngrade',t('Cho phép hạ chuẩn nếu chuyển đổi lỗi','Allow conformance downgrade if needed'),true);
  if(k==='pdfjpg')return field(t('Chế độ','Mode'),select('pdfJpgMode',[
    ['pages',t('Chuyển từng trang thành JPG','Convert every page to JPG')],
    ['extract',t('Trích xuất ảnh có trong PDF','Extract embedded images')]
  ],'pages'));
  if(k==='imagepdf'){
    if(m==='offline')return note('Offline hiện ghép ảnh thành PDF theo đúng kích thước ảnh, không thêm lề. Chuyển Online để chọn A4/Letter, hướng trang và lề.','Offline currently creates PDF pages at image size with no margin. Switch Online for A4/Letter, orientation and margin.');
    return '<div class="nlkh-grid-3">'+
      field(t('Khổ trang','Page size'),select('imagePdfPageSize',[['fit',t('Vừa ảnh','Fit image')],['A4','A4'],['letter','Letter']],'fit'))+
      field(t('Hướng trang','Orientation'),select('imagePdfOrientation',[['portrait',t('Dọc','Portrait')],['landscape',t('Ngang','Landscape')]],'portrait'))+
      field(t('Lề (px)','Margin (px)'),input('imagePdfMargin','number','0','min="0" step="1"'))+
    '</div>'+checkbox('imagePdfMerge',t('Gộp tất cả ảnh vào một PDF','Merge all images into one PDF'),true);
  }
  if(k==='extract')return checkbox('extractDetailed',t('Xuất dữ liệu chi tiết: trang, vị trí, font, cỡ chữ…','Detailed output: page, position, font, font size…'))+
    note('API Extract hiện trích xuất văn bản. Không ghi nhãn “text + ảnh” khi engine chưa làm việc đó.','The Extract API currently extracts text. It is not labelled “text + images” unless the engine supports both.');
  if(k==='repair')return note('Không có setting bổ sung. Hệ thống sẽ thử khôi phục cấu trúc PDF bị lỗi.','No extra settings. The service will attempt to recover the damaged PDF structure.');
  if(k==='deletepages')return field(t('Trang cần xóa','Pages to delete'),input('deletePageRange','text','', 'placeholder="2,4-6"'),t('Ví dụ: 2,4-6. Không thể xóa toàn bộ trang.','Example: 2,4-6. You cannot delete every page.'));
  if(k==='reorderpages')return field(t('Thứ tự trang mới','New page order'),input('reorderPageOrder','text','', 'placeholder="3,1,2,4-6"'),t('Trang không ghi sẽ được nối ở cuối theo thứ tự cũ.','Unlisted pages are appended in their original order.'));
  if(k==='compressimage')return field(t('Mức độ nén','Compression level'),select('compressionLevel',[
    ['low',t('Nén thấp','Low')],['recommended',t('Khuyến nghị','Recommended')],['extreme',t('Nén cao','Extreme')]
  ],'recommended'));
  if(k==='resizeimage'){
    const rm=(m==='online'?(el('resizeMode')?.value||'pixels'):'pixels');
    return (m==='online'?field(t('Cách đổi kích thước','Resize mode'),select('resizeMode',[
      ['pixels',t('Theo pixel','Pixels')],['percentage',t('Theo phần trăm','Percentage')]
    ],rm)):'')+
    (rm==='pixels'?'<div class="nlkh-grid-2">'+field(t('Rộng (px)','Width (px)'),input('resizeWidth','number','','min="1"'))+field(t('Cao (px)','Height (px)'),input('resizeHeight','number','','min="1"'))+'</div>':
      field(t('Tỷ lệ (%)','Percentage (%)'),input('resizePercentage','number','50','min="1" max="1000"')))+
    checkbox('maintainAspectRatio',t('Giữ nguyên tỷ lệ','Keep aspect ratio'),true)+
    (m==='online'?checkbox('noEnlargeIfSmaller',t('Không phóng to ảnh nhỏ hơn kích thước yêu cầu','Do not enlarge smaller images'),true):'');
  }
  if(k==='cropimage')return '<div class="nlkh-grid-2">'+
    field('X',input('cropX','number','0','min="0"'))+field('Y',input('cropY','number','0','min="0"'))+
    field(t('Rộng','Width'),input('cropWidth','number','','min="1"'))+field(t('Cao','Height'),input('cropHeight','number','','min="1"'))+
    '</div>'+note('V51 giữ nhập tọa độ chính xác. Crop kéo-thả cần renderer canvas riêng và chưa được giả lập.','V51 keeps precise numeric cropping. Drag-to-crop needs a dedicated canvas renderer and is not faked.');
  if(k==='convertimage'){
    const opts=m==='offline'
      ? [['jpg','JPG'],['png','PNG']]
      : [['jpg','JPG'],['png','PNG'],['gif','GIF'],['gif_animation',t('GIF động','Animated GIF')],['heic','HEIC']];
    const to=el('convertTo')?.value||'jpg';
    return field(t('Định dạng đầu ra','Output format'),select('convertTo',opts,opts.some(x=>x[0]===to)?to:'jpg'))+
      ((m==='online'&&(to==='gif_animation'))?'<div class="nlkh-grid-2">'+
        field(t('Thời gian mỗi ảnh (1/100 giây)','Frame time (1/100 sec)'),input('gifTime','number','50','min="1"'))+
        field(t('Lặp','Loop'),select('gifLoop',[['1',t('Có','Yes')],['0',t('Không','No')]],'1'))+'</div>':'');
  }
  if(k==='watermarkimage'){
    const wm=m==='offline'?'text':(el('watermarkMode')?.value||'text');
    return (m==='online'?field(t('Loại dấu','Watermark type'),select('watermarkMode',[['text',t('Văn bản','Text')],['image',t('Hình ảnh','Image')]],wm)):'<input type="hidden" id="watermarkMode" value="text">')+
      (wm==='text'?field(t('Nội dung','Text'),input('watermarkText','text','KOHA'))+
        '<div class="nlkh-grid-3">'+
        field(t('Font','Font'),select('watermarkFontFamily',[['Arial Unicode MS','Arial Unicode MS'],['Arial','Arial'],['Verdana','Verdana'],['Courier','Courier'],['Times New Roman','Times New Roman']],'Arial Unicode MS'))+
        field(t('Kiểu chữ','Font style'),select('watermarkFontStyle',[['',t('Thường','Regular')],['Bold',t('Đậm','Bold')],['Italic',t('Nghiêng','Italic')]],''))+
        field(t('Cỡ chữ','Font size'),input('watermarkFontSize','number','48','min="1"'))+'</div>'+
        field(t('Màu chữ','Text color'),input('watermarkFontColor','color','#000000')) :
        field(t('Ảnh dấu','Watermark image'),'<input id="watermarkImageInput" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg">'))+
      '<div class="nlkh-grid-3">'+
      field(t('Vị trí','Position'),select('watermarkPosition',[
        ['Center',t('Giữa','Center')],['NorthWest',t('Trên trái','Top left')],['NorthEast',t('Trên phải','Top right')],
        ['SouthWest',t('Dưới trái','Bottom left')],['SouthEast',t('Dưới phải','Bottom right')]
      ],'Center'))+
      field(t('Độ trong suốt','Opacity'),input('watermarkTransparency','number','50','min="1" max="100"'))+
      field(t('Góc xoay','Rotation'),input('watermarkRotation','number','0','min="0" max="360"'))+
      '</div>'+(m==='online'?checkbox('watermarkMosaic',t('Lặp dấu 9 vị trí','Mosaic watermark')):'')+
      (m==='offline'?note('Offline đóng dấu ảnh hiện chỉ hỗ trợ văn bản.','Offline image watermark currently supports text only.'):'');
  }
  if(k==='removebackgroundimage')return note('Không có setting API bổ sung. Ảnh được gửi đến dịch vụ Online để tách nền.','No extra API settings. The image is sent to the Online service for background removal.');
  return '';
}
function processLabel(k){
  const m={
    compress:['Nén PDF','Compress PDF'],merge:['Gộp PDF','Merge PDF'],split:['Tách PDF','Split PDF'],
    splitsmart:['Phân tích & tách PDF','Analyze & split PDF'],pdfocr:['OCR PDF','OCR PDF'],
    unlock:['Mở khóa PDF','Unlock PDF'],protect:['Bảo vệ PDF','Protect PDF'],rotate:['Xoay PDF','Rotate PDF'],
    watermark:['Đóng dấu PDF','Watermark PDF'],pdfa:['Chuyển sang PDF/A','Convert to PDF/A'],
    wordpdf:['Chuyển Word sang PDF','Convert Word to PDF'],powerpointpdf:['Chuyển PowerPoint sang PDF','Convert PowerPoint to PDF'],
    excelpdf:['Chuyển Excel sang PDF','Convert Excel to PDF'],pdfjpg:['Chuyển PDF sang JPG','Convert PDF to JPG'],
    imagepdf:['Tạo PDF từ ảnh','Create PDF from images'],pagenumber:['Đánh số trang','Add page numbers'],
    extract:['Trích xuất văn bản','Extract text'],repair:['Sửa PDF','Repair PDF'],deletepages:['Xóa trang','Delete pages'],
    reorderpages:['Sắp xếp trang','Reorder pages'],compressimage:['Nén ảnh','Compress image'],resizeimage:['Đổi kích thước','Resize image'],
    cropimage:['Cắt ảnh','Crop image'],rotateimage:['Xoay ảnh','Rotate image'],convertimage:['Chuyển đổi ảnh','Convert image'],
    watermarkimage:['Đóng dấu ảnh','Watermark image'],removebackgroundimage:['Xóa nền ảnh','Remove background']
  }[k]||['Bắt đầu xử lý','Start processing'];
  return t(m[0],m[1]);
}
function fileConfig(k){
  if(OFFICE.has(k))return {accept:k==='wordpdf'?'.doc,.docx':k==='excelpdf'?'.xls,.xlsx':'.ppt,.pptx',multi:false,label:t('Chọn tài liệu Office','Choose Office document')};
  if(['compressimage','resizeimage','cropimage','rotateimage','convertimage','watermarkimage','removebackgroundimage','imagepdf'].includes(k))
    return {accept:'image/*',multi:k==='imagepdf'||k==='watermarkimage',label:t('Chọn ảnh','Choose image')};
  return {accept:'application/pdf,.pdf',multi:k==='merge'||k==='watermark',label:t('Chọn PDF','Choose PDF')};
}
function applyFileConfig(k){
  const f=el('fileInput'),box=el('uploadBox'); if(!f||!box)return;
  const c=fileConfig(k); f.accept=c.accept; f.multiple=c.multi;
  const strong=box.querySelector('label strong'); if(strong)strong.textContent=c.label;
  const small=box.querySelector('label small'); if(small)small.textContent=t('Kéo thả hoặc nhấn để chọn đúng định dạng của công cụ.','Drop or click to choose a supported file type.');
}
function bindOptions(k){
  const box=el('toolOptions'); if(!box)return;
  box.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{const a=el('smartSplitPrompt');if(a)a.value=b.dataset.prompt||''}));
  ['splitMode','resizeMode','convertTo','watermarkMode'].forEach(id=>{const n=el(id);if(n)n.addEventListener('change',()=>renderOptions(k))});
  const show=el('showPassword'); if(show)show.addEventListener('change',()=>{['passwordInput','passwordConfirm'].forEach(id=>{const x=el(id);if(x)x.type=show.checked?'text':'password'})});
  const wm=el('watermarkImageInput'); if(wm)wm.addEventListener('change',e=>{window.watermarkFile=e.target.files?.[0]||null});
  box.querySelectorAll('input,select,textarea').forEach(n=>{
    n.addEventListener('input',()=>{if(typeof window.updateImagePreview==='function')try{window.updateImagePreview()}catch(_){}});
    n.addEventListener('change',()=>{if(typeof window.updateImagePreview==='function')try{window.updateImagePreview()}catch(_){}});
  });
}
function renderOptions(k){
  if(PROTECTED_UI.has(k))return;
  const box=el('toolOptions'); if(!box)return;
  box.innerHTML=optionsHtml(k); box.classList.remove('hidden'); bindOptions(k);
}
function resetFilesOnly(){
  try{
    if(typeof window.resetAll==='function')window.resetAll();
    else{
      window.selectedFiles=[]; const f=el('fileInput');if(f)f.value='';
      el('resultContainer')?.classList.add('hidden'); el('previewArea')?.classList.add('hidden');
    }
  }catch(_){}
}
function sync(reason=''){
  if(renderQueued)return; renderQueued=true;
  setTimeout(()=>{
    renderQueued=false; addTools();placeMode();localizeToolNames();
    const k=tool(),changed=k!==lastTool;
    if(changed&&lastTool)resetFilesOnly();
    lastTool=k;
    renderCapability(changed);
    applyFileConfig(k);
    const txt=el('processButtonText'); if(txt)txt.textContent=processLabel(k);
    renderOptions(k);
    localizeToolNames();
  },0);
}

function validateFileType(k,list){
  const good=list.every(f=>{
    const n=(f.name||'').toLowerCase();
    if(k==='wordpdf')return /\.(doc|docx)$/.test(n);
    if(k==='excelpdf')return /\.(xls|xlsx)$/.test(n);
    if(k==='powerpointpdf')return /\.(ppt|pptx)$/.test(n);
    if(['compressimage','resizeimage','cropimage','rotateimage','convertimage','watermarkimage','removebackgroundimage','imagepdf'].includes(k))return /^image\//.test(f.type)||/\.(png|jpe?g|gif|webp|bmp|tiff?|heic)$/i.test(n);
    return f.type==='application/pdf'||/\.pdf$/i.test(n);
  });
  if(!good)throw new Error(t('Tệp đã chọn không đúng định dạng của công cụ.','The selected file type is not supported by this tool.'));
}
async function authToken(){
  const r=await fetch('https://api.ilovepdf.com/v1/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({public_key:PUBLIC_KEY})});
  if(!r.ok)throw new Error(t('Không lấy được token iLoveAPI.','Could not get iLoveAPI token.'));
  return (await r.json()).token;
}
async function uploadFile(server,task,auth,file){
  const fd=new FormData();fd.append('task',task);fd.append('file',file);
  const r=await fetch('https://'+server+'/v1/upload',{method:'POST',headers:{Authorization:auth},body:fd});
  if(!r.ok)throw new Error(await r.text());
  return (await r.json()).server_filename;
}
function requireValue(id,messageVi,messageEn){
  const v=String(el(id)?.value||'').trim(); if(!v)throw new Error(t(messageVi,messageEn)); return v;
}
function numberValue(id,fallback=0){const n=Number(el(id)?.value);return Number.isFinite(n)?n:fallback}
async function runOnline(){
  const k=tool(),list=files(); if(!list.length)throw new Error(t('Vui lòng chọn ít nhất một tệp.','Please select at least one file.'));
  validateFileType(k,list);
  if(k==='protect'){
    const p=requireValue('passwordInput','Hãy nhập mật khẩu mới.','Enter a new password.');
    if(p!==String(el('passwordConfirm')?.value||''))throw new Error(t('Hai mật khẩu không khớp.','Passwords do not match.'));
  }
  if(k==='splitsmart')requireValue('smartSplitPrompt','Hãy nhập yêu cầu tách PDF cho AI.','Enter Smart Split instructions.');
  if(k==='pdfocr'&&!document.querySelector('input[name="ocrLang"]:checked'))throw new Error(t('Hãy chọn ít nhất một ngôn ngữ OCR.','Select at least one OCR language.'));

  const api=API_ALIAS[k]||k;
  setStatus('Đang xác thực dịch vụ Online…','Authenticating Online service…');
  const token=await authToken(),auth='Bearer '+token;
  const sr=await fetch('https://api.ilovepdf.com/v1/start/'+api,{headers:{Authorization:auth}});
  if(!sr.ok)throw new Error(await sr.text());
  const task=await sr.json();

  let stampServer='';
  const needsStamp=(k==='watermark'||k==='watermarkimage')&&el('watermarkMode')?.value==='image';
  if(needsStamp){
    const stamp=window.watermarkFile;
    if(!stamp)throw new Error(t('Hãy chọn ảnh dấu.','Choose a watermark image.'));
    setStatus('Đang tải ảnh dấu…','Uploading watermark image…');
    stampServer=await uploadFile(task.server,task.task,auth,stamp);
  }

  const uploaded=[];
  for(let i=0;i<list.length;i++){
    setStatus('Đang tải tệp '+(i+1)+'/'+list.length+'…','Uploading file '+(i+1)+'/'+list.length+'…');
    const server_filename=await uploadFile(task.server,task.task,auth,list[i]);
    const item={server_filename,filename:list[i].name};
    if(k==='unlock')item.password=requireValue('passwordInput','Hãy nhập mật khẩu hiện tại.','Enter the current password.');
    if(k==='rotate'||k==='rotateimage')item.rotate=numberValue('rotateAngle',90);
    uploaded.push(item);
  }

  const body={task:task.task,tool:api,files:uploaded};
  if(k==='compress'||k==='compressimage')body.compression_level=el('compressionLevel')?.value||'recommended';
  if(k==='split'){
    const sm=el('splitMode')?.value||'ranges'; body.split_mode=sm;
    if(sm==='ranges')body.ranges=requireValue('splitRange','Hãy nhập khoảng trang.','Enter page ranges.');
    if(sm==='fixed_range')body.fixed_range=Math.max(1,numberValue('splitFixedRange',1));
    if(sm==='filesize')body.filesize=Math.max(1,numberValue('splitFilesize',10));
  }
  if(k==='splitsmart')body.prompt=requireValue('smartSplitPrompt','Hãy nhập yêu cầu tách PDF.','Enter split instructions.');
  if(k==='pdfocr')body.ocr_languages=Array.from(document.querySelectorAll('input[name="ocrLang"]:checked')).map(x=>x.value);
  if(k==='protect')body.password=requireValue('passwordInput','Hãy nhập mật khẩu mới.','Enter a new password.');
  if(k==='pdfa'){body.conformance=el('pdfaConformance')?.value||'pdfa-2b';body.allow_downgrade=!!el('pdfaDowngrade')?.checked}
  if(k==='pdfjpg')body.pdfjpg_mode=el('pdfJpgMode')?.value||'pages';
  if(k==='imagepdf'){
    body.orientation=el('imagePdfOrientation')?.value||'portrait';
    body.margin=Math.max(0,numberValue('imagePdfMargin',0));
    body.pagesize=el('imagePdfPageSize')?.value||'fit';
    body.merge_after=!!el('imagePdfMerge')?.checked;
  }
  if(k==='extract')body.detailed=!!el('extractDetailed')?.checked;
  if(k==='resizeimage'){
    const rm=el('resizeMode')?.value||'pixels'; body.resize_mode=rm;
    if(rm==='pixels'){body.pixels_width=numberValue('resizeWidth',0);body.pixels_height=numberValue('resizeHeight',0)}
    else body.percentage=Math.max(1,numberValue('resizePercentage',50));
    body.maintain_ratio=!!el('maintainAspectRatio')?.checked;
    body.no_enlarge_if_smaller=!!el('noEnlargeIfSmaller')?.checked;
  }
  if(k==='cropimage'){
    body.x=Math.max(0,numberValue('cropX',0)); body.y=Math.max(0,numberValue('cropY',0));
    body.width=Math.max(1,numberValue('cropWidth',0)); body.height=Math.max(1,numberValue('cropHeight',0));
    if(!numberValue('cropWidth',0)||!numberValue('cropHeight',0))throw new Error(t('Hãy nhập chiều rộng và chiều cao vùng cắt.','Enter crop width and height.'));
  }
  if(k==='convertimage'){
    body.to=el('convertTo')?.value||'jpg';
    if(body.to==='gif_animation'){body.gif_time=Math.max(1,numberValue('gifTime',50));body.gif_loop=Number(el('gifLoop')?.value||1)}
  }
  if(k==='watermark'){
    const pos=(el('watermarkPosition')?.value||'middle-center').split('-');
    body.mode=el('watermarkMode')?.value||'text';
    if(body.mode==='text'){
      body.text=el('watermarkText')?.value||'KOHA';
      body.font_size=Math.max(1,numberValue('watermarkFontSize',48));
      body.font_color=el('watermarkFontColor')?.value||'#000000';
      body.font_family=el('watermarkFontFamily')?.value||'Arial Unicode MS';
      body.font_style=el('watermarkFontStyle')?.value||null;
    }else body.image=stampServer;
    body.vertical_position=pos[0]||'middle'; body.horizontal_position=pos[1]||'center';
    body.transparency=Math.min(100,Math.max(1,numberValue('watermarkTransparency',50)));
    body.rotation=((numberValue('watermarkRotation',0)%360)+360)%360;
    body.vertical_position_adjustment=numberValue('watermarkVerticalAdjust',0);
    body.horizontal_position_adjustment=numberValue('watermarkHorizontalAdjust',0);
    if(el('watermarkPages'))body.pages=el('watermarkPages').value||'all';
    if(el('watermarkMosaic'))body.mosaic=!!el('watermarkMosaic').checked;
    if(el('watermarkLayer'))body.layer=el('watermarkLayer').value||'above';
  }
  if(k==='watermarkimage'){
    const wm=el('watermarkMode')?.value||'text';
    const e={
      type:wm,
      gravity:el('watermarkPosition')?.value||'Center',
      vertical_adjustment_percent:0,horizontal_adjustment_percent:0,
      rotation:((numberValue('watermarkRotation',0)%360)+360)%360,
      transparency:Math.min(100,Math.max(1,numberValue('watermarkTransparency',50))),
      mosaic:!!el('watermarkMosaic')?.checked
    };
    if(wm==='text'){
      e.text=el('watermarkText')?.value||'KOHA'; e.font_family=el('watermarkFontFamily')?.value||'Arial Unicode MS';
      e.font_style=el('watermarkFontStyle')?.value||null; e.font_size=Math.max(1,numberValue('watermarkFontSize',48));
      e.font_color=el('watermarkFontColor')?.value||'#000000';
    }else e.image=stampServer;
    body.elements=[e];
  }

  setStatus('Đang xử lý trên máy chủ…','Processing on server…');
  const pr=await fetch('https://'+task.server+'/v1/process',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!pr.ok)throw new Error(await pr.text());
  const result=await pr.json();
  if(result.status!=='TaskSuccess')throw new Error(result.status_text||result.status||'Task failed');
  window.finalDownloadUrl='https://'+task.server+'/v1/download/'+task.task;
  window.finalDownloadFilename=result.download_filename||'result';
  window.downloadAuthHeader=auth;
  const link=el('downloadLink');if(link)link.textContent=t('Tải: ','Download: ')+window.finalDownloadFilename;
  el('resultContainer')?.classList.remove('hidden');
  setStatus('Xử lý Online thành công.','Online processing completed.','success');
}

document.addEventListener('click',e=>{
  const p=e.target.closest?.('#processButton');
  if(p&&mode()==='online'){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    (async()=>{try{setBusy(true);el('resultContainer')?.classList.add('hidden');await runOnline()}catch(err){console.error('[PDF V51]',err);setStatus('Lỗi Online: '+err.message,'Online error: '+err.message,'error')}finally{setBusy(false)}})();
    return;
  }
  const q=e.target.closest?.('[data-tool]');
  if(q&&!q.closest('#toolOptions'))sync('quick');
},true);

document.addEventListener('change',e=>{
  if(e.target===el('apiTool'))sync('tool');
  if(e.target?.closest?.('.processing-mode'))sync('mode');
},true);

new MutationObserver(m=>{
  if(m.some(x=>x.type==='attributes'&&x.attributeName==='lang'))sync('lang');
}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

window.addEventListener('load',()=>sync('load'));
window.NLKH_PDF_CAPABILITIES_V51=CAP;
})();

;(()=>{ 'use strict';
const OCR_V53_LANGS=[
['vie','Tiếng Việt','Vietnamese','popular'],
['eng','Tiếng Anh','English','popular'],
['chi_sim','Tiếng Trung giản thể','Chinese (Simplified)','popular'],
['chi_tra','Tiếng Trung phồn thể','Chinese (Traditional)','popular'],
['jpn','Tiếng Nhật','Japanese','popular'],
['kor','Tiếng Hàn','Korean','popular'],
['fra','Tiếng Pháp','French','popular'],
['deu','Tiếng Đức','German','popular'],
['spa','Tiếng Tây Ban Nha','Spanish','popular'],
['por','Tiếng Bồ Đào Nha','Portuguese','popular'],
['ita','Tiếng Ý','Italian','popular'],
['rus','Tiếng Nga','Russian','popular'],
['tha','Tiếng Thái','Thai','popular'],
['ind','Tiếng Indonesia','Indonesian','popular'],
['msa','Tiếng Mã Lai','Malay','popular'],
['khm','Tiếng Khmer','Khmer','popular'],
['lao','Tiếng Lào','Lao','popular'],
['ara','Tiếng Ả Rập','Arabic','popular'],
['hin','Tiếng Hindi','Hindi','popular'],
['nld','Tiếng Hà Lan','Dutch','popular'],
['pol','Tiếng Ba Lan','Polish','popular'],
['tur','Tiếng Thổ Nhĩ Kỳ','Turkish','popular'],
['ukr','Tiếng Ukraina','Ukrainian','popular'],
['ces','Tiếng Séc','Czech','popular'],
['dan','Tiếng Đan Mạch','Danish','popular'],
['fin','Tiếng Phần Lan','Finnish','popular'],
['nor','Tiếng Na Uy','Norwegian','popular'],
['swe','Tiếng Thụy Điển','Swedish','popular'],
['afr','Tiếng Afrikaans','Afrikaans','more'],
['amh','Tiếng Amhara','Amharic','more'],
['asm','Tiếng Assam','Assamese','more'],
['aze','Tiếng Azerbaijan','Azerbaijani','more'],
['aze_cyrl','Azerbaijan (Cyrillic)','Azerbaijani (Cyrillic)','more'],
['bel','Tiếng Belarus','Belarusian','more'],
['ben','Tiếng Bengal','Bengali','more'],
['bod','Tiếng Tây Tạng','Tibetan','more'],
['bos','Tiếng Bosnia','Bosnian','more'],
['bre','Tiếng Breton','Breton','more'],
['bul','Tiếng Bulgaria','Bulgarian','more'],
['cat','Tiếng Catalan','Catalan','more'],
['ceb','Tiếng Cebuano','Cebuano','more'],
['chr','Tiếng Cherokee','Cherokee','more'],
['cos','Tiếng Corsica','Corsican','more'],
['cym','Tiếng Wales','Welsh','more'],
['deu_latf','Đức Fraktur','German Fraktur','more'],
['dzo','Tiếng Dzongkha','Dzongkha','more'],
['ell','Tiếng Hy Lạp','Greek','more'],
['enm','Tiếng Anh Trung cổ','Middle English','more'],
['epo','Tiếng Esperanto','Esperanto','more'],
['equ','Tiếng Quechua Ecuador','Quechua (Ecuador)','more'],
['est','Tiếng Estonia','Estonian','more'],
['eus','Tiếng Basque','Basque','more'],
['fao','Tiếng Faroe','Faroese','more'],
['fas','Tiếng Ba Tư','Persian','more'],
['fil','Tiếng Filipino','Filipino','more'],
['frm','Tiếng Pháp Trung cổ','Middle French','more'],
['fry','Tiếng Tây Frisia','Western Frisian','more'],
['gla','Tiếng Gaelic Scotland','Scottish Gaelic','more'],
['gle','Tiếng Ireland','Irish','more'],
['glg','Tiếng Galicia','Galician','more'],
['grc','Tiếng Hy Lạp cổ','Ancient Greek','more'],
['guj','Tiếng Gujarat','Gujarati','more'],
['hat','Tiếng Creole Haiti','Haitian Creole','more'],
['heb','Tiếng Hebrew','Hebrew','more'],
['hrv','Tiếng Croatia','Croatian','more'],
['hun','Tiếng Hungary','Hungarian','more'],
['hye','Tiếng Armenia','Armenian','more'],
['iku','Tiếng Inuktitut','Inuktitut','more'],
['isl','Tiếng Iceland','Icelandic','more'],
['ita_old','Tiếng Ý cổ','Old Italian','more'],
['jav','Tiếng Java','Javanese','more'],
['kan','Tiếng Kannada','Kannada','more'],
['kat','Tiếng Georgia','Georgian','more'],
['kat_old','Tiếng Georgia cổ','Old Georgian','more'],
['kaz','Tiếng Kazakhstan','Kazakh','more'],
['kir','Tiếng Kyrgyz','Kyrgyz','more'],
['kmr','Tiếng Kurd Kurmanji','Kurdish (Kurmanji)','more'],
['kor_vert','Tiếng Hàn dọc','Korean Vertical','more'],
['lat','Tiếng Latin','Latin','more'],
['lav','Tiếng Latvia','Latvian','more'],
['lit','Tiếng Litva','Lithuanian','more'],
['ltz','Tiếng Luxembourg','Luxembourgish','more'],
['mal','Tiếng Malayalam','Malayalam','more'],
['mar','Tiếng Marathi','Marathi','more'],
['mkd','Tiếng Macedonia','Macedonian','more'],
['mlt','Tiếng Malta','Maltese','more'],
['mon','Tiếng Mông Cổ','Mongolian','more'],
['mri','Tiếng Māori','Māori','more'],
['mya','Tiếng Myanmar','Burmese','more'],
['nep','Tiếng Nepal','Nepali','more'],
['oci','Tiếng Occitan','Occitan','more'],
['ori','Tiếng Odia','Odia','more'],
['pan','Tiếng Punjab','Punjabi','more'],
['pus','Tiếng Pashto','Pashto','more'],
['que','Tiếng Quechua','Quechua','more'],
['ron','Tiếng Romania','Romanian','more'],
['san','Tiếng Phạn','Sanskrit','more'],
['sin','Tiếng Sinhala','Sinhala','more'],
['slk','Tiếng Slovakia','Slovak','more'],
['slv','Tiếng Slovenia','Slovenian','more'],
['snd','Tiếng Sindhi','Sindhi','more'],
['spa_old','Tiếng Tây Ban Nha cổ','Old Spanish','more'],
['sqi','Tiếng Albania','Albanian','more'],
['srp','Tiếng Serbia (Cyrillic)','Serbian (Cyrillic)','more'],
['srp_latn','Tiếng Serbia (Latin)','Serbian (Latin)','more'],
['sun','Tiếng Sunda','Sundanese','more'],
['swa','Tiếng Swahili','Swahili','more'],
['syr','Tiếng Syriac','Syriac','more'],
['tam','Tiếng Tamil','Tamil','more'],
['tat','Tiếng Tatar','Tatar','more'],
['tel','Tiếng Telugu','Telugu','more'],
['tgk','Tiếng Tajik','Tajik','more'],
['tgl','Tiếng Tagalog','Tagalog','more'],
['tir','Tiếng Tigrinya','Tigrinya','more'],
['ton','Tiếng Tonga','Tongan','more'],
['uig','Tiếng Uyghur','Uyghur','more'],
['urd','Tiếng Urdu','Urdu','more'],
['uzb','Tiếng Uzbek','Uzbek','more'],
['uzb_cyrl','Uzbek (Cyrillic)','Uzbek (Cyrillic)','more'],
['yid','Tiếng Yiddish','Yiddish','more'],
['yor','Tiếng Yoruba','Yoruba','more']
];
const OCR_V53_PRESETS={
  vi_en:['vie','eng'],
  east_asia:['chi_sim','chi_tra','jpn','kor'],
  asean:['vie','eng','tha','ind','msa','khm','lao','mya','tgl'],
  west_europe:['eng','fra','deu','spa','por','ita','nld'],
  east_europe:['rus','ukr','pol','ces','slk','hun','ron','bul','hrv','srp','srp_latn'],
  south_asia:['eng','hin','ben','tam','tel','mal','mar','guj','pan','urd','nep'],
  middle_east:['ara','fas','heb','tur','urd']
};
const $=id=>document.getElementById(id);
const isEn=()=>String(document.documentElement.lang||'vi').toLowerCase().startsWith('en');
const tx=(vi,en)=>isEn()?en:vi;
function isOcr(){return $('apiTool')?.value==='pdfocr'}
function selected(){return new Set(Array.from(document.querySelectorAll('input[name="ocrLang"]:checked')).map(x=>x.value))}
function setSelected(codes){
  const wanted=new Set(codes);
  document.querySelectorAll('#ocrLangGridV53 input[name="ocrLang"]').forEach(x=>x.checked=wanted.has(x.value));
  updateCount();
}
function updateCount(){
  const n=selected().size,c=$('ocrLangCountV53');
  if(c)c.textContent=n?tx(`${n} ngôn ngữ đã chọn`,`${n} language${n===1?'':'s'} selected`):tx('Chưa chọn ngôn ngữ','No language selected');
}
function filter(){
  const q=String($('ocrLangSearchV53')?.value||'').trim().toLowerCase();
  document.querySelectorAll('#ocrLangGridV53 .ocr-v53-lang').forEach(item=>{
    item.hidden=!!q&&!item.dataset.search.includes(q);
  });
}
function render(){
  if(!isOcr())return;
  const box=$('toolOptions');if(!box)return;
  if(box.dataset.ocrV53==='1'){localize();return}
  const before=selected();
  const initial=before.size?[...before]:['vie','eng'];
  box.dataset.ocrV53='1';
  box.innerHTML=`<div class="nlkh-task-head"><span class="nlkh-inline-badge">OCR · ONLINE</span><strong>OCR PDF</strong></div>
    <div class="nlkh-task-note">${tx('Dùng cho PDF scan/ảnh để tạo lớp chữ có thể tìm kiếm và sao chép.','Use scanned/image PDFs to create searchable and copyable text.')}</div>
    <div class="ocr-v53-auto-note"><strong>${tx('Về chế độ Tự động','About Auto mode')}</strong><span>${tx('iLoveAPI hiện yêu cầu gửi danh sách ocr_languages; tài liệu API không công bố chế độ tự nhận diện ngôn ngữ. Vì vậy KOHA không tạo Auto giả.','iLoveAPI currently expects an ocr_languages list; its API documentation does not expose automatic language detection. KOHA therefore does not fake an Auto mode.')}</span></div>
    <div class="ocr-v53-toolbar">
      <div class="ocr-v53-search"><span>⌕</span><input id="ocrLangSearchV53" type="search" placeholder="${tx('Tìm ngôn ngữ…','Search languages…')}"></div>
      <div id="ocrLangCountV53" class="ocr-v53-count"></div>
    </div>
    <div class="ocr-v53-presets">
      <button type="button" data-ocr-preset="vi_en">${tx('Việt + English','Vietnamese + English')}</button>
      <button type="button" data-ocr-preset="east_asia">${tx('Đông Á','East Asia')}</button>
      <button type="button" data-ocr-preset="asean">ASEAN</button>
      <button type="button" data-ocr-preset="west_europe">${tx('Tây Âu','Western Europe')}</button>
      <button type="button" data-ocr-preset="east_europe">${tx('Đông Âu','Eastern Europe')}</button>
      <button type="button" data-ocr-preset="south_asia">${tx('Nam Á','South Asia')}</button>
      <button type="button" data-ocr-preset="middle_east">${tx('Trung Đông','Middle East')}</button>
      <button type="button" id="ocrClearV53" class="is-muted">${tx('Xóa chọn','Clear')}</button>
    </div>
    <div class="ocr-v53-section"><div class="ocr-v53-section-title"><strong>${tx('Phổ biến','Common')}</strong><span>${tx('Chọn một hoặc nhiều ngôn ngữ có trong tài liệu.','Choose one or more languages present in the document.')}</span></div>
      <div id="ocrLangGridV53" class="ocr-v53-grid"></div>
    </div>
    <button type="button" id="ocrMoreToggleV53" class="ocr-v53-more">${tx('Hiện thêm ngôn ngữ','Show more languages')} <span>↓</span></button>
    <div id="ocrMoreV53" class="ocr-v53-morebox hidden"><div class="ocr-v53-section-title"><strong>${tx('Tất cả ngôn ngữ API','All API languages')}</strong><span>${tx('Danh sách theo mã OCR chính thức.','List based on official OCR language codes.')}</span></div><div id="ocrLangMoreGridV53" class="ocr-v53-grid"></div></div>`;
  const common=$('ocrLangGridV53'),more=$('ocrLangMoreGridV53');
  OCR_V53_LANGS.forEach(([code,vi,en,group])=>{
    const label=document.createElement('label');
    label.className='ocr-v53-lang';
    label.dataset.search=`${code} ${vi} ${en}`.toLowerCase();
    label.innerHTML=`<input type="checkbox" name="ocrLang" value="${code}"><span><strong>${isEn()?en:vi}</strong><small>${code}</small></span>`;
    (group==='popular'?common:more).appendChild(label);
  });
  setSelected(initial);
  $('ocrLangSearchV53')?.addEventListener('input',filter);
  box.querySelectorAll('[data-ocr-preset]').forEach(b=>b.addEventListener('click',()=>setSelected(OCR_V53_PRESETS[b.dataset.ocrPreset]||[])));
  $('ocrClearV53')?.addEventListener('click',()=>setSelected([]));
  $('ocrMoreToggleV53')?.addEventListener('click',()=>{
    const m=$('ocrMoreV53'),show=m.classList.contains('hidden');
    m.classList.toggle('hidden',!show);
    $('ocrMoreToggleV53').innerHTML=show?`${tx('Thu gọn','Show less')} <span>↑</span>`:`${tx('Hiện thêm ngôn ngữ','Show more languages')} <span>↓</span>`;
  });
  box.addEventListener('change',e=>{if(e.target.matches('input[name="ocrLang"]'))updateCount()});
}
function localize(){
  if(!isOcr())return;
  const box=$('toolOptions');if(!box||box.dataset.ocrV53!=='1')return;
  const keep=[...selected()];
  box.dataset.ocrV53='0';render();setSelected(keep);
}
document.addEventListener('change',e=>{if(e.target===$('apiTool'))setTimeout(render,50)},true);
document.addEventListener('click',e=>{if(e.target.closest?.('[data-tool]'))setTimeout(render,80)},true);
new MutationObserver(m=>{
  if(m.some(x=>x.type==='attributes'&&x.attributeName==='lang'))setTimeout(localize,20);
  if(isOcr()&&$('toolOptions')&&!$('toolOptions').querySelector('#ocrLangGridV53'))setTimeout(render,20);
}).observe(document.documentElement,{attributes:true,attributeFilter:['lang'],childList:true,subtree:true});
window.addEventListener('load',()=>setTimeout(render,80));
window.NLKH_OCR_LANGUAGES_V53=OCR_V53_LANGS.map(x=>x[0]);
})();
