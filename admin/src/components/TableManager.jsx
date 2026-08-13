import React,{useEffect,useMemo,useState}from"react";
import{supabase}from"../lib/supabase";
import MediaPicker from"./MediaPicker";
import{notify}from"../lib/notify";

const empty=v=>v===null||v===undefined||v===""||(Array.isArray(v)&&v.length===0);
const isRequired=(f,form={})=>!!(typeof f.requiredWhen==="function"?f.requiredWhen(form):f.required);
function helpText(f,form={}){
  if(f.help)return f.help;
  if(f.type==="sort")return "Thứ tự hiển thị. Hệ thống tự đánh lại 1, 2, 3… sau khi lưu/xóa; số nhỏ đứng trước.";
  if(f.type==="relation")return "Chọn từ dữ liệu đã có; không cần nhớ hoặc nhập ID kỹ thuật.";
  if(f.type==="checks")return "Có thể tích nhiều mục. Bỏ tích để thu hồi lựa chọn/quyền tương ứng.";
  if(f.type==="media")return "Tải trực tiếp lên Cloudflare R2 hoặc chọn ID R2 đã có trong thư viện; không cần dán URL thủ công.";
  if(f.type==="checkbox")return "Tùy chọn bật/tắt. Có thể thay đổi lại bất cứ lúc nào.";
  if(f.type==="json")return "Cấu hình nâng cao dạng JSON. Nếu không dùng, giữ mẫu sẵn có hoặc {}. Hệ thống sẽ chỉ đúng ô nếu JSON sai.";
  if(f.type==="url")return "Nhập URL đầy đủ bắt đầu bằng https:// nếu dùng liên kết bên ngoài.";
  if(f.type==="datetime")return "Chọn ngày/giờ bằng ô lịch để tránh sai định dạng.";
  return isRequired(f,form)?`${f.label} là trường bắt buộc.`:`${f.label} là trường không bắt buộc; có thể để trống nếu chưa dùng.`;
}

function nlkhToDateTimeLocal(value){
  if(value===null||value===undefined||value==="")return "";
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return String(value).slice(0,16);
  const p=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function nlkhFromDateTimeLocal(value){
  if(value===null||value===undefined||value==="")return "";
  const d=new Date(value);
  return Number.isNaN(d.getTime())?String(value):d.toISOString();
}
function parseField(f,v){
  // Optional media/relation fields are backed by FK/UUID columns.
  // An unselected control uses an empty string in the browser, but Postgres UUID
  // columns require NULL rather than "".
  if((f.type==="media"||f.type==="relation")&&(v===""||v===undefined||v===null))return null;
  if(f.type==="number"||f.type==="sort")return v===""?null:Number(v);
  if(f.type==="checkbox")return!!v;
  if(f.type==="json"){
    if(typeof v!=="string")return v??{};
    if(!v.trim())return{};
    return JSON.parse(v);
  }
  if(f.type==="array"||f.type==="checks"){
    if(Array.isArray(v))return v;
    return String(v||"").split(",").map(x=>x.trim()).filter(Boolean);
  }
  return v===""&&f.nullable?null:v;
}
function display(v){if(v==null)return"";if(typeof v==="object")return JSON.stringify(v);return String(v)}

function extractServerError(error,fields){
  const constraint=String(error?.constraint||error?.message?.match(/constraint ["']([^"']+)["']/i)?.[1]||"");
  const byConstraint=fields.find(f=>constraint&&constraint.includes(`_${f.name}_`));
  const msg=error?.message||"Không thể lưu dữ liệu.";
  const details=error?.details||"";
  if(error?.code==="23505"){
    const match=details.match(/\(([^)]+)\)=\(([^)]*)\)/);
    if(match){
      const field=fields.find(f=>f.name===match[1]);
      return {field:match[1],message:`${field?.label||match[1]} “${match[2]}” đã tồn tại. Hãy đổi giá trị này.`};
    }
    return {message:"Có một giá trị bị trùng với dữ liệu đã có. Kiểm tra các trường mã/slug/đường dẫn."};
  }
  if(error?.code==="23502"){
    const name=error?.column||details.match(/column "([^"]+)"/)?.[1];
    const field=fields.find(f=>f.name===name);
    return{field:name,message:`${field?.label||name||"Một trường bắt buộc"} đang để trống. Hãy điền đúng ô này.`};
  }
  if(error?.code==="23503"){
    const name=byConstraint?.name||details.match(/Key \(([^)]+)\)=/)?.[1]||details.match(/column ["']?([^"' ]+)/i)?.[1];
    const field=fields.find(f=>f.name===name);
    return{field:name,message:field?`${field.label} đang trỏ tới một mục không còn tồn tại. Hãy chọn lại ngay ô “${field.label}”.`:`Không thể lưu vì một mục liên quan đã bị xóa/không còn tồn tại. Hãy chọn lại menu cha, nhóm, vai trò hoặc ID R2.`};
  }
  if(error?.code==="23514"){
    const field=byConstraint||fields.find(f=>`${msg} ${details}`.includes(f.name));
    return{field:field?.name,message:field?`${field.label} có giá trị không hợp lệ theo quy tắc hệ thống. ${details||msg}`:`Giá trị không đúng quy tắc của hệ thống. ${details||msg}`};
  }
  if(error?.code==="22P02")return{message:`Sai định dạng dữ liệu: ${details||msg}. Kiểm tra ô ID, số, ngày/giờ hoặc JSON vừa sửa.`};
  if(error?.code==="22007")return{message:"Ngày/giờ không đúng định dạng. Hãy chọn lại bằng ô ngày/giờ thay vì nhập chuỗi tự do."};
  if(error?.code==="PGRST204")return{message:`Cấu trúc Admin và database chưa đồng bộ: ${msg}. Hãy chạy migration V4 rồi thử lại.`};
  if(error?.code==="42501")return{message:"Tài khoản hiện tại không có quyền thực hiện thay đổi này. Kiểm tra vai trò/quyền của tài khoản."};
  return{message:[msg,details].filter(Boolean).join(" — ")};
}

function FieldLabel({f}){
  const help=f.help||helpText(f);
  return <div className="fieldLabel">
    <span>{f.label}{f.required&&<b className="requiredMark">*</b>}</span>
    <button className="helpDot" type="button" title={help} aria-label={`Trợ giúp ${f.label}`}>?</button>
  </div>
}

function RelationInput({f,value,onChange}){
  const[options,setOptions]=useState([]),[error,setError]=useState("");
  useEffect(()=>{
    let q=supabase.from(f.relation.table).select(f.relation.select||"*");
    if(f.relation.filter)Object.entries(f.relation.filter).forEach(([k,v])=>q=q.eq(k,v));
    if(f.relation.orderBy)q=q.order(f.relation.orderBy,{ascending:f.relation.ascending!==false});
    q.then(({data,error})=>{if(error)setError(error.message);else setOptions(data||[])});
  },[f.relation.table]);
  const valueKey=f.relation.valueKey||"id",labelKey=f.relation.labelKey||"name";
  return <><select value={value??""} onChange={e=>onChange(e.target.value)}>
    <option value="">{f.placeholder||"— Không chọn —"}</option>
    {options.map(o=><option key={o[valueKey]} value={o[valueKey]}>{typeof f.relation.label==="function"?f.relation.label(o):(o[labelKey]||o[valueKey])}</option>)}
  </select>{error&&<small className="fieldError">{error}</small>}</>
}
function ChecksInput({f,value,onChange}){
  const[options,setOptions]=useState(f.options||[]);
  useEffect(()=>{
    if(f.options){setOptions(f.options);return;}
    if(!f.relation)return;
    let q=supabase.from(f.relation.table).select(f.relation.select||"*");
    if(f.relation.filter)Object.entries(f.relation.filter).forEach(([k,v])=>q=q.eq(k,v));
    if(f.relation.orderBy)q=q.order(f.relation.orderBy,{ascending:true});
    q.then(({data})=>setOptions(data||[]));
  },[f.relation?.table,JSON.stringify(f.options||[])]);
  const current=Array.isArray(value)?value:[];
  const valueKey=f.relation?.valueKey||"value",labelKey=f.relation?.labelKey||"label";
  const toggle=(v,checked)=>onChange(checked?[...new Set([...current,v])]:current.filter(x=>x!==v));
  return <div className="checkGrid">{options.map(o=>{
    const val=typeof o==="string"?o:o[valueKey],label=typeof o==="string"?o:(typeof f.relation?.label==="function"?f.relation.label(o):(o[labelKey]||val));
    const note=typeof o==="object"?o.note:null;
    return <label className="checkCard" key={val}><input type="checkbox" checked={current.includes(val)} onChange={e=>toggle(val,e.target.checked)}/><span><b>{label}</b>{note&&<small>{note}</small>}</span></label>
  })}</div>
}

function Input({f,value,onChange,onMirror,form={}}){
  if(f.type==="media"){
    const mediaVisibility=typeof f.visibility==="function"?f.visibility(form):(f.visibility||"public");
    return <MediaPicker value={value} onChange={onChange} kind={f.kind||"image"} visibility={mediaVisibility} label={f.label} help={f.help} required={f.required} onMirrorUrl={onMirror}/>;
  }
  if(f.type==="relation")return <RelationInput f={f} value={value} onChange={onChange}/>;
  if(f.type==="checks")return <ChecksInput f={f} value={value} onChange={onChange}/>;
  if(f.type==="textarea"||f.type==="html")return <textarea rows={f.rows||8} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={f.placeholder||""}/>;
  if(f.type==="json")return <textarea rows={f.rows||9} value={typeof value==="string"?value:JSON.stringify(value??{},null,2)} onChange={e=>onChange(e.target.value)} placeholder={f.placeholder||'{\n  "key": "value"\n}'}/>;
  if(f.type==="array")return <input value={Array.isArray(value)?value.join(", "):(value??"")} onChange={e=>onChange(e.target.value)} placeholder={f.placeholder||"Nhập nhiều giá trị, cách nhau bằng dấu phẩy"}/>;
  if(f.type==="checkbox")return <label className="switchRow"><input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)}/><span>{f.trueLabel||"Bật"}</span></label>;
  if(f.type==="select")return <select value={value??""} onChange={e=>onChange(e.target.value)}>{f.placeholder&&<option value="">{f.placeholder}</option>}{(f.options||[]).map(o=><option key={String(o.value)} value={o.value}>{o.label}</option>)}</select>;
  if(f.type==="color")return <div className="colorInput"><input type="color" value={/^#[0-9a-f]{6}$/i.test(value||"")?value:"#3157f6"} onChange={e=>onChange(e.target.value)}/><input value={value??""} onChange={e=>onChange(e.target.value)} placeholder="#3157f6"/></div>;
  if(f.type==="datetime")return <input
    type="datetime-local"
    min={f.min}
    max={f.max}
    step={f.step||60}
    value={nlkhToDateTimeLocal(value)}
    onChange={e=>onChange(nlkhFromDateTimeLocal(e.target.value))}
    placeholder={f.placeholder||""}
  />;
  const type=f.type==="number"||f.type==="sort"?"number":f.type==="url"?"url":"text";
  return <input type={type} min={f.min} max={f.max} step={f.step} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={f.placeholder||""}/>;
}


/* NLKH_HTML_PREVIEW_HELPER_START */
function prepareHtmlToolPreview(raw=""){
  let html=String(raw||"");
  html=html.replace(/<script\b[^>]*\bsrc=["'](?:https?:)?\/\/local\.adguard\.org[^>]*>[\s\S]*?<\/script>/gi,"");

  const bootstrap = `
<style id="nlkh-preview-loading-style">
#nlkh-preview-loading{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#f7f9fc;color:#101828;font-family:Arial,sans-serif}
#nlkh-preview-loading .box{width:min(520px,82vw);text-align:center}
#nlkh-preview-loading .title{font-size:18px;font-weight:800;margin-bottom:8px}
#nlkh-preview-loading .sub{font-size:12px;color:#667085;margin-bottom:14px}
#nlkh-preview-loading .track{height:10px;border-radius:999px;background:#e4e7ec;overflow:hidden}
#nlkh-preview-loading .bar{height:100%;width:4%;background:#3157f6;transition:width .28s ease}
#nlkh-preview-loading .pct{font-size:12px;margin-top:8px;color:#475467}
</style>
<script>
(function(){
  function memoryStorage(){
    var data=Object.create(null);
    return {
      get length(){return Object.keys(data).length},
      key:function(i){return Object.keys(data)[i]||null},
      getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null},
      setItem:function(k,v){data[String(k)]=String(v)},
      removeItem:function(k){delete data[String(k)]},
      clear:function(){data=Object.create(null)}
    };
  }
  function ensureStorage(name){
    try{
      var store=window[name];
      var key="__nlkh_preview_probe__";
      store.setItem(key,"1"); store.removeItem(key);
    }catch(e){
      try{Object.defineProperty(window,name,{configurable:true,value:memoryStorage()})}catch(_){}
    }
  }
  ensureStorage("localStorage"); ensureStorage("sessionStorage");

  var progress=4, timer=null, finished=false;
  function ensureUi(){
    if(document.getElementById("nlkh-preview-loading"))return;
    var wrap=document.createElement("div");
    wrap.id="nlkh-preview-loading";
    wrap.innerHTML='<div class="box"><div class="title">Đang nạp bản xem thử / Loading preview</div><div class="sub" id="nlkh-preview-loading-text">Đang tải HTML và các thư viện bên ngoài…</div><div class="track"><div class="bar" id="nlkh-preview-loading-bar"></div></div><div class="pct" id="nlkh-preview-loading-pct">4%</div></div>';
    (document.body||document.documentElement).appendChild(wrap);
  }
  function paint(){
    ensureUi();
    var b=document.getElementById("nlkh-preview-loading-bar"),p=document.getElementById("nlkh-preview-loading-pct");
    if(b)b.style.width=progress+"%"; if(p)p.textContent=Math.round(progress)+"%";
  }
  function done(){
    if(finished)return; finished=true; progress=100; paint(); clearInterval(timer);
    var t=document.getElementById("nlkh-preview-loading-text"); if(t)t.textContent="Đã nạp xong / Preview ready";
    setTimeout(function(){var w=document.getElementById("nlkh-preview-loading");if(w){w.style.opacity="0";w.style.transition="opacity .25s";setTimeout(function(){w.remove()},280)}},350);
  }
  document.addEventListener("DOMContentLoaded",function(){
    paint();
    timer=setInterval(function(){
      if(finished)return;
      progress=Math.min(92,progress+(progress<55?8:progress<80?4:1.5)); paint();
    },320);
  });
  window.addEventListener("load",done);
  setTimeout(function(){
    if(!finished){
      var t=document.getElementById("nlkh-preview-loading-text");
      if(t)t.textContent="Một số CDN/tài nguyên đang tải chậm; vẫn tiếp tục chờ… / External resources are still loading…";
      progress=Math.max(progress,94);paint();
    }
  },7000);
  setTimeout(done,16000);
})();
<\/script>`;

  const base='<base target="_blank">';
  if(/<head(?:\s[^>]*)?>/i.test(html)){
    return html.replace(/<head(\s[^>]*)?>/i,m=>m+base+bootstrap);
  }
  return '<!doctype html><html><head>'+base+bootstrap+'</head><body>'+html+'</body></html>';
}
/* NLKH_HTML_PREVIEW_HELPER_END */

export default function TableManager({
  title,description="",table,fields,idField="id",orderBy="updated_at",ascending=false,
  allowDelete=true,allowAdd=true,defaults={},singleRow=false,openId=null,onChanged,deleteHandler=null,canDelete=null
}){
  const[rows,setRows]=useState([]),[edit,setEdit]=useState(null),[form,setForm]=useState({}),[msg,setMsg]=useState(""),
    [fieldErrors,setFieldErrors]=useState({}),[htmlPreview,setHtmlPreview]=useState("");
  const visible=useMemo(()=>fields.filter(f=>!f.hidden),[fields]);

  async function load(){
    let q=supabase.from(table).select("*");
    if(orderBy)q=q.order(orderBy,{ascending});
    const{data,error}=await q;
    if(error)setMsg(error.message);else{
      setRows(data||[]);
      if(singleRow&&data?.length&&!edit)start(data[0],data||[]);
      if(openId&&data?.length){
        const found=data.find(r=>String(r[idField])===String(openId));
        if(found)start(found,data||[]);
      }
    }
  }
  useEffect(()=>{load()},[table,openId]);

  function defaultFor(f){
    if(f.name in defaults)return typeof defaults[f.name]==="function"?defaults[f.name]():defaults[f.name];
    if(f.type==="checkbox")return false;
    if(f.type==="json")return{};
    if(f.type==="array"||f.type==="checks")return[];
    if(f.type==="sort")return rows.reduce((m,r)=>Math.max(m,Number(r[f.name]||0)),0)+1;
    return"";
  }
  function start(row=null,currentRows=rows){
    setEdit(row?row[idField]:"__new__");setMsg("");setFieldErrors({});
    const b={};
    fields.forEach(f=>{
      if(row)b[f.name]=row[f.name]??defaultFor(f);
      else if(f.type==="sort")b[f.name]=currentRows.reduce((m,r)=>Math.max(m,Number(r[f.name]||0)),0)+1;
      else b[f.name]=defaultFor(f);
    });
    setForm(b);
  }

  function validate(){
    const errors={};
    fields.forEach(f=>{
      if(f.hidden||f.readonly|| (f.showWhen && !f.showWhen(form)))return;
      const v=form[f.name];
      if(isRequired(f,form)&&empty(v))errors[f.name]=`${f.label} là trường bắt buộc trong lựa chọn hiện tại.`;
      if(!errors[f.name]&&f.type==="url"&&v){
        try{new URL(v)}catch{errors[f.name]=`${f.label} phải là URL đầy đủ, ví dụ https://...`}
      }
      if(!errors[f.name]&&f.type==="json"&&typeof v==="string"&&v.trim()){
        try{JSON.parse(v)}catch(e){errors[f.name]=`${f.label} có JSON sai cú pháp: ${e.message}`}
      }
      if(!errors[f.name]&&f.validate){
        const result=f.validate(v,form);
        if(result)errors[f.name]=result;
      }
    });
    setFieldErrors(errors);
    return Object.keys(errors).length===0;
  }

  async function normalizeSortRows(){
    const sortField=fields.find(f=>f.type==="sort");
    if(!sortField)return;
    const{data,error}=await supabase.from(table).select(`${idField},${sortField.name}`).order(sortField.name,{ascending:true}).order(idField,{ascending:true});
    if(error)return;
    for(let i=0;i<(data||[]).length;i++){
      const row=data[i],target=i+1;
      if(Number(row[sortField.name])!==target)await supabase.from(table).update({[sortField.name]:target}).eq(idField,row[idField]);
    }
  }

  async function save(e){
    e.preventDefault();setMsg("");
    if(!validate()){setMsg("Có trường chưa đúng. Mình đã đánh dấu đúng ô cần sửa bên dưới.");notify("Chưa thể lưu: có trường cần kiểm tra lại.","error");return}
    try{
      const payload={};
      for(const f of fields){
        if(f.readonly||f.skipSave)continue;
        try{const raw=typeof f.derive==="function"?f.derive(form):form[f.name];payload[f.name]=parseField(f,raw)}
        catch(err){setFieldErrors(x=>({...x,[f.name]:`${f.label}: ${err.message}`}));setMsg(`Không thể lưu vì trường “${f.label}” chưa đúng.`);return}
      }
      const result=edit==="__new__"?await supabase.from(table).insert(payload):await supabase.from(table).update(payload).eq(idField,edit);
      if(result.error)throw result.error;
      if(!singleRow)setEdit(null);await normalizeSortRows();setMsg("Đã lưu thành công.");notify("Đã lưu thay đổi thành công.","success");await load();
      if(table==="tools")window.dispatchEvent(new Event("nlkh:tools-changed"));
      onChanged?.();
    }catch(error){
      const info=extractServerError(error,fields);
      if(info.field)setFieldErrors(x=>({...x,[info.field]:info.message}));
      setMsg(info.message);notify(info.message,"error",6500);
    }
  }

  async function del(row){
    if(!confirm(`Xóa mục “${display(row[visible[0]?.name]||row[idField])}”?`))return;
    let error=null;
    try{
      if(deleteHandler)await deleteHandler(row);
      else{const result=await supabase.from(table).delete().eq(idField,row[idField]);error=result.error}
    }catch(err){
      const message=err instanceof Error?err.message:String(err);
      setMsg(message);notify(message,"error",6500);return;
    }
    if(error){const info=extractServerError(error,fields);setMsg(info.message);notify(info.message,"error",6500);return}
    await normalizeSortRows();setMsg("Đã xóa.");notify("Đã xóa mục.","success");await load();if(table==="tools")window.dispatchEvent(new Event("nlkh:tools-changed"));onChanged?.();
  }

  return <section className="adminSection">
    <div className="sectionTitle"><div><h1>{title}</h1>{description&&<p className="sectionDescription">{description}</p>}<small>{table}</small></div>{allowAdd&&!singleRow&&<button className="primary" onClick={()=>start()}>+ Thêm mới</button>}</div>
    {msg&&<div className={`notice ${Object.keys(fieldErrors).length?"noticeError":""}`}>{msg}</div>}
    {!singleRow&&<div className="tableWrap"><table><thead><tr>{visible.slice(0,5).map(f=><th key={f.name}>{f.label}</th>)}<th/></tr></thead><tbody>{rows.map((r,i)=><tr key={r[idField]??i}>{visible.slice(0,5).map(f=><td key={f.name}>{f.type==="checkbox"?(r[f.name]?"Có":"Không"):f.type==="media"?(r[f.name]?"Đã chọn R2":"—"):display(r[f.name]).slice(0,110)}</td>)}<td className="rowActions"><button onClick={()=>start(r)}>Sửa</button>{allowDelete&&(!canDelete||canDelete(r))&&<button onClick={()=>del(r)}>Xóa</button>}</td></tr>)}</tbody></table></div>}

    {edit&&<div className={singleRow?"inlineEditor":"modal"}><form className={singleRow?"editor inline":"editor"} onSubmit={save} noValidate>
      {!singleRow&&<div className="editorHead"><div><h2>{edit==="__new__"?"Thêm":"Chỉnh sửa"} · {title}</h2><small>Dấu <b className="requiredMark">*</b> là bắt buộc. Trường không có dấu * có thể để trống.</small></div><button type="button" onClick={()=>setEdit(null)}>✕</button></div>}
      <div className="formGrid">{fields.filter(f=>!f.hidden&&!f.readonly&&(!f.showWhen||f.showWhen(form))).map(f=>{
        const dynamicRequired=isRequired(f,form);
        const ef={...f,required:dynamicRequired,help:helpText({...f,required:dynamicRequired},form)};
        const mirror=(url)=>{if(f.mirrorUrlField)setForm(x=>({...x,[f.mirrorUrlField]:url}))};
        if(f.type==="media")return <div key={f.name} className="wide fieldBlock"><Input f={ef} value={form[f.name]} onChange={v=>setForm(x=>({...x,[f.name]:v}))} onMirror={mirror} form={form}/>{fieldErrors[f.name]&&<div className="fieldError">{fieldErrors[f.name]}</div>}</div>;
        return <div key={f.name} className={`${f.wide?"wide":""} fieldBlock`}>
          <FieldLabel f={ef}/>
          <Input f={ef} value={form[f.name]} onChange={v=>setForm(x=>({...x,[f.name]:v}))} form={form}/>
          <small className="fieldHelp">{ef.help}</small>
          {f.type==="html"&&form[f.name]&&<button type="button" className="previewCode" onClick={()=>setHtmlPreview(form[f.name])}>▶ Chạy thử HTML trong khung an toàn</button>}
          {fieldErrors[f.name]&&<div className="fieldError">{fieldErrors[f.name]}</div>}
        </div>
      })}</div>
      <div className="editorActions">{!singleRow&&<button type="button" onClick={()=>setEdit(null)}>Hủy</button>}<button className="primary">Lưu thay đổi</button></div>
    </form></div>}

    {htmlPreview&&<div className="modal"><div className="htmlPreviewPanel"><div className="editorHead"><div><h2>Xem thử code tool</h2><small>Chỉ là iframe thử nghiệm; chưa lưu thì website chưa thay đổi.</small></div><button type="button" onClick={()=>setHtmlPreview("")}>✕</button></div><iframe sandbox="allow-scripts allow-forms allow-downloads" srcDoc={prepareHtmlToolPreview(htmlPreview)} title="Tool HTML preview"/></div></div>}
  </section>
}
