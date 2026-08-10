import React,{useEffect,useState}from"react";
import{NavLink,useNavigate}from"react-router-dom";
import{supabase,invoke}from"../lib/supabase";
import{notify}from"../lib/notify";

const baseNav=[
  ["/site","Cấu hình chung"],["/navigation","Menu & Footer"],["/content","Trang nội dung"],["/seo","SEO"],["/redirects","Redirect"],
  ["/tools","Danh sách Tool"],["/news","Tin tức"],["/software","Phần mềm"],["/data","Dữ liệu & quyền"],["/cv","CV"],["/users","Người dùng & quyền"],["/media","Thư viện R2"],["/migration","Nhập dữ liệu cũ"],["/api","API & lịch chạy"]
];
function initials(name=""){const p=name.trim().split(/\s+/).filter(Boolean);return(p.slice(-2).map(x=>x[0]?.toUpperCase()).join("")||"U")}
export default function AdminShell({children,access}){
 const go=useNavigate(),[tools,setTools]=useState([]),[publishing,setPublishing]=useState(false),[toast,setToast]=useState(null);
 async function loadTools(){const{data}=await supabase.from("tools").select("id,slug,code,title_vi,visible,sort_order").order("sort_order");setTools(data||[])}
 useEffect(()=>{loadTools();const fn=()=>loadTools();window.addEventListener("nlkh:tools-changed",fn);return()=>window.removeEventListener("nlkh:tools-changed",fn)},[]);
 useEffect(()=>{let timer;const fn=e=>{const d=e.detail||{};setToast({message:d.message||"Đã hoàn tất.",type:d.type||"success"});clearTimeout(timer);timer=setTimeout(()=>setToast(null),Number(d.duration||3200))};window.addEventListener("nlkh:admin-toast",fn);return()=>{clearTimeout(timer);window.removeEventListener("nlkh:admin-toast",fn)}},[]);
 async function logout(){await supabase.auth.signOut();go("/login")}
 async function publish(){
   if(publishing)return;
   const local=location.hostname==="localhost"||location.hostname==="127.0.0.1";
   const ok=confirm(`${local?"Bạn đang ở môi trường local. Nút này vẫn yêu cầu Render build WEBSITE PRODUCTION nếu Deploy Hook đã cấu hình.\n\n":""}Chỉ bấm sau khi đã Lưu các thay đổi cần build lại: Cấu hình chung, Menu/Footer, Tool, CV, Tin tức, SEO, Redirect hoặc route Trang nội dung.\n\nPhần mềm, Dữ liệu, tài khoản/quyền và file R2 đọc runtime nên thường không cần bấm.\n\nTiếp tục xuất bản frontend?`);
   if(!ok)return;
   setPublishing(true);notify("Đang gửi yêu cầu build frontend…","info",5000);
   try{const r=await invoke("render-deploy",{target:"frontend"});notify(r.message||"Đã yêu cầu Render build lại frontend.","success",5200)}
   catch(e){const raw=String(e?.message||e);const msg=raw.includes("Failed to fetch")?`Không gọi được Edge Function render-deploy. Admin hiện chạy tại ${location.origin}. Kiểm tra CORS/ALLOWED_ORIGINS và bảo đảm Admin local chạy đúng cổng 5174.`:raw;notify(msg,"error",8000)}
   finally{setPublishing(false)}
 }
 const avatar=access?.avatar_url;
 return <div className="adminLayout"><aside className="sidebar"><div className="logo">NLKH<br/><span>ADMIN</span></div><nav>{baseNav.map(([to,l])=><React.Fragment key={to}><NavLink to={to}>{l}</NavLink>{to==="/tools"&&tools.length>0&&<div className="toolSubNav">{tools.map(t=><NavLink key={t.id} to={`/tools/${t.id}`} className={({isActive})=>`toolSubItem ${isActive?"active":""}`}>{t.code||"TOOL"} · {t.title_vi}{!t.visible&&" (ẩn)"}</NavLink>)}</div>}</React.Fragment>)}</nav><div className="sidebarFoot"><button onClick={publish} disabled={publishing} title="Build lại frontend tĩnh từ dữ liệu Admin đã lưu">{publishing?"Đang xuất bản…":"Xuất bản frontend"}</button><small className="publishHint">Chỉ dùng cho nội dung cần build lại.</small><button onClick={logout}>Đăng xuất</button></div></aside><main className="adminMain"><header className="adminTop"><div className="adminIdentity"><div className="adminAvatar">{avatar?<img src={avatar} alt=""/>:<span>{initials(access?.display_name||access?.email)}</span>}</div><div><strong>{access?.display_name||access?.email}</strong><small>{access?.role_id}</small></div></div><a href={import.meta.env.VITE_SITE_URL||"/"} target="_blank" rel="noreferrer">Mở website ↗</a></header>{children}</main>{toast&&<div className={`adminToast ${toast.type||"success"}`} role="status" aria-live="polite"><span>{toast.type==="error"?"!":"✓"}</span><p>{toast.message}</p><button onClick={()=>setToast(null)} aria-label="Đóng thông báo">×</button></div>}</div>
}
