import React,{useEffect,useMemo,useState}from"react";
import{invoke}from"../lib/supabase";

const LIMITS={
 database:500*1000*1000,
 supabaseStorage:1*1000*1000*1000,
 r2:10*1000*1000*1000
};

function fmtBytes(n){
 n=Number(n||0);
 if(!Number.isFinite(n))return"—";
 const units=["B","KB","MB","GB","TB"];let i=0,v=n;
 while(v>=1000&&i<units.length-1){v/=1000;i++}
 return`${i===0?Math.round(v):v<10?v.toFixed(2):v<100?v.toFixed(1):Math.round(v)} ${units[i]}`
}
function percent(v,max){return max?Math.max(0,Math.min(100,Number(v||0)/max*100)):0}
function level(p){return p>=95?"danger":p>=85?"warn2":p>=70?"warn":"ok"}

function Meter({label,value,max,note}){
 const p=percent(value,max);
 return <div className={`usageMeter ${level(p)}`}>
  <div className="usageMeterHead"><strong>{label}</strong><span>{fmtBytes(value)} / {fmtBytes(max)} · {p.toFixed(1)}%</span></div>
  <div className="usageBar"><i style={{width:`${p}%`}}/></div>
  {note&&<small>{note}</small>}
 </div>
}

function monthClock(){
 const now=new Date();
 const start=new Date(now.getFullYear(),now.getMonth(),1);
 const end=new Date(now.getFullYear(),now.getMonth()+1,1);
 const total=(end-start)/36e5;
 const elapsed=(now-start)/36e5;
 return{total,elapsed,remaining:Math.max(0,total-elapsed)}
}

export default function SystemUsage(){
 const[data,setData]=useState(null),[err,setErr]=useState(""),[loading,setLoading]=useState(true);
 async function load(){
  setLoading(true);setErr("");
  try{setData(await invoke("system-usage",{}))}
  catch(e){setErr(e?.message||String(e))}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);
 const clock=useMemo(monthClock,[]);

 return <section className="adminSection usagePanel">
  <div className="sectionHead usageTitle">
   <div>
    <p className="eyebrow">USAGE / FREE TIER</p>
    <h1>Dung lượng & hạn mức</h1>
    <p>Theo dõi trực tiếp Supabase và Cloudflare R2 để tránh chạm giới hạn Free.</p>
   </div>
   <button type="button" onClick={load} disabled={loading}>{loading?"Đang đo…":"Làm mới"}</button>
  </div>

  {err&&<div className="notice"><b>Lỗi đọc usage:</b> {err}</div>}

  <div className="usageGrid">
   <div className="usageCard">
    <h2>Supabase Free</h2>
    <Meter label="Postgres database" value={data?.supabase?.database_bytes} max={LIMITS.database} note="Ngưỡng theo dõi: 500 MB / project."/>
    <Meter label="Supabase Storage" value={data?.supabase?.storage_bytes} max={LIMITS.supabaseStorage} note={`${data?.supabase?.storage_objects??"—"} object · Ngưỡng theo dõi: 1 GB.`}/>
    <div className="usageInfo">
     <strong>Compute / số giờ trong tháng</strong>
     <p>Tháng hiện tại có <b>{clock.total.toFixed(0)} giờ</b>; đã trôi qua {clock.elapsed.toFixed(1)} giờ, còn {clock.remaining.toFixed(1)} giờ lịch.</p>
     <p><b>730/744 giờ không phải quota Free bị trừ dần.</b> Đây chỉ xấp xỉ số giờ một tháng và được dùng trong ví dụ tính compute của gói trả phí.</p>
     <small>Free project có thể bị pause khi hoạt động thấp trong khoảng 7 ngày.</small>
    </div>
   </div>

   <div className="usageCard">
    <h2>Cloudflare R2</h2>
    <Meter label="R2 Standard storage" value={data?.r2?.bytes} max={LIMITS.r2} note={`${data?.r2?.objects??"—"} object · Free tier: 10 GB-month/tháng.`}/>
    <div className="usageInfo">
     <strong>Free operations / tháng</strong>
     <p>Class A: <b>1.000.000</b> · Class B: <b>10.000.000</b> · Egress Internet: <b>miễn phí</b>.</p>
     {data?.r2?.error&&<small>R2 metric: {data.r2.error}</small>}
    </div>
   </div>
  </div>

  <div className="usageFoot">Đo lúc: {data?.checked_at?new Date(data.checked_at).toLocaleString("vi-VN"):"—"} · Supabase project: {data?.project_ref||"—"}</div>
 </section>
}