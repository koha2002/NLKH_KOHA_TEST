import React,{useEffect,useMemo,useState}from"react";
import{supabase}from"../lib/supabase";

const ONLINE_MS=75000;

function fmt(v){
  if(!v)return"—";
  try{
    return new Intl.DateTimeFormat("vi-VN",{
      dateStyle:"short",
      timeStyle:"medium"
    }).format(new Date(v))
  }catch{
    return String(v)
  }
}

export default function UserTraffic(){
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState("all");
  const[error,setError]=useState("");
  const[now,setNow]=useState(Date.now());

  async function load(){
    setLoading(true);
    const{data,error}=await supabase
      .from("site_presence")
      .select("visitor_id,user_id,first_seen_at,last_seen_at,current_path,page_views,profiles(email,display_name,status,role_id)")
      .order("last_seen_at",{ascending:false})
      .limit(300);

    if(error){
      setError(error.message||String(error));
    }else{
      setError("");
      setRows(data||[]);
    }
    setNow(Date.now());
    setLoading(false);
  }

  useEffect(()=>{
    load();
    const id=setInterval(load,5000);
    const clock=setInterval(()=>setNow(Date.now()),5000);
    return()=>{
      clearInterval(id);
      clearInterval(clock);
    }
  },[]);

  const isOnline=(r)=>now-new Date(r.last_seen_at).getTime()<=ONLINE_MS;
  const online=rows.filter(isOnline).length;

  const shown=useMemo(
    ()=>rows.filter(r=>
      filter==="all"||
      (filter==="online"&&isOnline(r))||
      (filter==="member"&&r.user_id)
    ),
    [rows,filter,now]
  );

  async function clean(){
    if(!confirm("Xóa lịch sử visitor không hoạt động quá 30 ngày?"))return;
    const cut=new Date(Date.now()-30*86400000).toISOString();
    const{error}=await supabase.from("site_presence").delete().lt("last_seen_at",cut);
    if(error)setError(error.message||String(error));
    await load();
  }

  return <section className="adminSection">
    <div className="sectionTitle">
      <div>
        <h1>Người dùng truy cập / đang online</h1>
        <p className="sectionDescription">
          Realtime hiện lấy từ <b>Supabase site_presence</b>. Website gửi heartbeat ngay khi mở trang
          và mỗi 30 giây; online = heartbeat trong 75 giây gần nhất. Cloudflare/Google Analytics là
          số liệu tổng hợp và không thay thế heartbeat theo từng trình duyệt/tài khoản.
        </p>
      </div>
      <div className="rowActions">
        <button onClick={load}>{loading?"Đang tải…":"Làm mới"}</button>
        <button onClick={clean}>Dọn &gt;30 ngày</button>
      </div>
    </div>

    {error?<div className="noticeErr"><b>Lỗi đọc presence:</b> {error}</div>:null}

    <div className="trafficStats">
      <article><strong>{online}</strong><span>Đang online</span></article>
      <article><strong>{rows.length}</strong><span>Visitor gần đây</span></article>
      <article><strong>{rows.filter(r=>r.user_id).length}</strong><span>Đã đăng nhập</span></article>
    </div>

    <div className="trafficFilter">
      <button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Tất cả</button>
      <button className={filter==="online"?"active":""} onClick={()=>setFilter("online")}>Đang online</button>
      <button className={filter==="member"?"active":""} onClick={()=>setFilter("member")}>Có tài khoản</button>
    </div>

    {loading&&!rows.length
      ? <p>Đang tải…</p>
      : <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Người dùng</th>
                <th>Trang hiện tại</th>
                <th>Lần cuối</th>
                <th>Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(r=>{
                const p=Array.isArray(r.profiles)?r.profiles[0]:r.profiles;
                const on=isOnline(r);
                return <tr key={r.visitor_id}>
                  <td><span className={`presenceDot ${on?"online":"offline"}`}>{on?"Online":"Offline"}</span></td>
                  <td>
                    <strong>{p?.display_name||p?.email||"Khách"}</strong>
                    <small className="trafficSub">
                      {p
                        ? `${p.email||""} · ${p.role_id||""} · ${p.status||""}`
                        : `Visitor ${String(r.visitor_id).slice(0,8)}`}
                    </small>
                  </td>
                  <td><code>{r.current_path||"/"}</code></td>
                  <td>{fmt(r.last_seen_at)}</td>
                  <td>{Number(r.page_views||0)}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>}
  </section>;
}