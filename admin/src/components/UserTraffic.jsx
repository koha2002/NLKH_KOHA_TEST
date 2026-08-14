import React,{useEffect,useMemo,useState}from"react";
import{supabase}from"../lib/supabase";

const ONLINE_MS=130000;
function fmt(v){if(!v)return"—";try{return new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeStyle:"medium"}).format(new Date(v))}catch{return String(v)}}
export default function UserTraffic(){
 const[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[filter,setFilter]=useState("all");
 async function load(){
  setLoading(true);
  const{data,error}=await supabase.from("site_presence")
   .select("visitor_id,user_id,first_seen_at,last_seen_at,current_path,page_views,profiles(email,display_name,status,role_id)")
   .order("last_seen_at",{ascending:false}).limit(200);
  if(!error)setRows(data||[]);
  setLoading(false);
 }
 useEffect(()=>{load();const id=setInterval(load,15000);return()=>clearInterval(id)},[]);
 const now=Date.now();
 const shown=useMemo(()=>rows.filter(r=>filter==="all"||(filter==="online"&&(now-new Date(r.last_seen_at).getTime()<=ONLINE_MS))||(filter==="member"&&r.user_id)),[rows,filter,now]);
 const online=rows.filter(r=>now-new Date(r.last_seen_at).getTime()<=ONLINE_MS).length;
 async function clean(){if(!confirm("Xóa lịch sử visitor không hoạt động quá 30 ngày?"))return;const cut=new Date(Date.now()-30*86400000).toISOString();await supabase.from("site_presence").delete().lt("last_seen_at",cut);load()}
 return <section className="adminSection">
  <div className="sectionTitle"><div><h1>Người dùng truy cập / đang online</h1><p className="sectionDescription">Online = trình duyệt gửi heartbeat trong khoảng 2 phút gần nhất. Tài khoản đăng ký vẫn quản lý vai trò/trạng thái ở bảng Người dùng bên dưới.</p></div><div className="rowActions"><button onClick={load}>Làm mới</button><button onClick={clean}>Dọn &gt;30 ngày</button></div></div>
  <div className="trafficStats"><article><strong>{online}</strong><span>Đang online</span></article><article><strong>{rows.length}</strong><span>Visitor gần đây</span></article><article><strong>{rows.filter(r=>r.user_id).length}</strong><span>Đã đăng nhập</span></article></div>
  <div className="trafficFilter"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Tất cả</button><button className={filter==="online"?"active":""} onClick={()=>setFilter("online")}>Đang online</button><button className={filter==="member"?"active":""} onClick={()=>setFilter("member")}>Có tài khoản</button></div>
  {loading&&!rows.length?<p>Đang tải…</p>:<div className="tableWrap"><table><thead><tr><th>Trạng thái</th><th>Người dùng</th><th>Trang hiện tại</th><th>Lần cuối</th><th>Lượt heartbeat/view</th></tr></thead><tbody>{shown.map(r=>{const p=Array.isArray(r.profiles)?r.profiles[0]:r.profiles,on=now-new Date(r.last_seen_at).getTime()<=ONLINE_MS;return <tr key={r.visitor_id}><td><span className={`presenceDot ${on?"online":"offline"}`}>{on?"Online":"Offline"}</span></td><td><strong>{p?.display_name||p?.email||"Khách"}</strong><small className="trafficSub">{p?`${p.email||""} · ${p.role_id||""} · ${p.status||""}`:`Visitor ${String(r.visitor_id).slice(0,8)}`}</small></td><td><code>{r.current_path||"/"}</code></td><td>{fmt(r.last_seen_at)}</td><td>{Number(r.page_views||0)}</td></tr>})}</tbody></table></div>}
 </section>;
}