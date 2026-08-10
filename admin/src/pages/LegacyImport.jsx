import React,{useState}from"react";
import{AdminPage}from"./_shared";
import{invoke}from"../lib/supabase";
import{notify}from"../lib/notify";

function Box({title,value,children}){return <div style={{border:"1px solid var(--line)",borderRadius:16,padding:18,background:"var(--panel)"}}><strong>{title}</strong>{value!==undefined?<div style={{fontSize:30,fontWeight:800,marginTop:8}}>{value}</div>:null}{children}</div>}
export default function LegacyImport({access}){
 const[preview,setPreview]=useState(null),[report,setReport]=useState(null),[loading,setLoading]=useState(false);
 const[opts,setOpts]=useState({software:true,cv:true,data:true,brandMedia:true});
 async function loadPreview(){setLoading(true);try{const r=await invoke("legacy-import",{action:"preview"});setPreview(r.preview);notify("Đã đọc dữ liệu tĩnh từ repo NLKH_KOHA.")}catch(e){notify(e.message||String(e),"error",7000)}finally{setLoading(false)}}
 async function run(){if(!confirm("Nhập dữ liệu từ repo NLKH_KOHA vào Supabase/R2? Các mục có cùng slug sẽ được cập nhật. Mật khẩu legacy KHÔNG được nhập."))return;setLoading(true);try{const r=await invoke("legacy-import",{action:"run",...opts});setReport(r.report);notify("Đã nhập dữ liệu cũ vào Supabase/R2.","success",6000)}catch(e){notify(e.message||String(e),"error",8000)}finally{setLoading(false)}}
 return <AdminPage access={access}><section className="adminSection"><div className="sectionHead"><div><p className="eyebrow">MIGRATION / LEGACY</p><h1>Nhập dữ liệu cũ</h1><p>Đọc trực tiếp repo <b>koha2002/NLKH_KOHA</b>. Không cần thêm tay từng phần mềm. Metadata đi vào Supabase; ảnh/PDF nhỏ đi R2; code tool vẫn ở Git.</p></div></div>
 <div className="notice"><b>Không nhập mật khẩu cũ.</b> File <code>accounts.json</code> của web tĩnh chứa password dạng plaintext nên V4.6 cố tình bỏ qua. Người dùng/quyền dùng Supabase Auth + Admin hiện tại.</div>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"18px 0"}}><button onClick={loadPreview} disabled={loading}>{loading?"Đang đọc…":"1. Xem trước dữ liệu cũ"}</button><button onClick={run} disabled={loading||!preview}>{loading?"Đang nhập…":"2. Nhập vào Supabase + R2"}</button></div>
 {preview?<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}><Box title="Phần mềm" value={preview.software?.items}/><Box title="Icon phần mềm → R2" value={preview.software?.icons}/><Box title="Tài liệu/link" value={preview.data?.resources}/><Box title="Tài khoản legacy bỏ qua" value={preview.legacyAccounts?.count}/></div>
 <div style={{marginTop:18,display:"grid",gap:10}}><label><input type="checkbox" checked={opts.software} onChange={e=>setOpts(x=>({...x,software:e.target.checked}))}/> Phần mềm: metadata → Supabase, icon → R2, link tải giữ dạng Link ngoài</label><label><input type="checkbox" checked={opts.cv} onChange={e=>setOpts(x=>({...x,cv:e.target.checked}))}/> CV: nội dung → Supabase, ảnh + PDF → R2</label><label><input type="checkbox" checked={opts.data} onChange={e=>setOpts(x=>({...x,data:e.target.checked}))}/> Dữ liệu: resources.json → nhóm/tài liệu dạng Link</label><label><input type="checkbox" checked={opts.brandMedia} onChange={e=>setOpts(x=>({...x,brandMedia:e.target.checked}))}/> Media thương hiệu nhỏ → thư viện R2</label></div>
 <div className="notice" style={{marginTop:18}}><b>Giữ trong source/Git:</b> <code>app/</code>, <code>components/</code>, <code>lib/</code>, CSS, scripts build, Edge Functions và toàn bộ <code>public/tool-modules/**</code> (Quiz/PDF/COMTRADE HTML/CSS/JS/vendor). Đây là code chạy, không phải dữ liệu CMS.</div></>:null}
 {report?<div style={{marginTop:20}}><h2>Kết quả lần nhập</h2><pre style={{whiteSpace:"pre-wrap",overflow:"auto",padding:16,border:"1px solid var(--line)",borderRadius:12}}>{JSON.stringify(report,null,2)}</pre></div>:null}
 </section></AdminPage>
}
