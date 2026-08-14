import React,{
  useEffect,
  useMemo,
  useState,
}from"react";

import{
  invoke,
}from"../lib/supabase";

const ONLINE_MS=90000;

function fmt(v){
  if(!v)return"—";

  try{
    return new Intl.DateTimeFormat(
      "vi-VN",
      {
        dateStyle:"short",
        timeStyle:"medium",
      },
    ).format(
      new Date(v),
    );
  }catch{
    return String(v);
  }
}

export default function UserTraffic(){
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState("all");
  const[error,setError]=useState("");
  const[checkedAt,setCheckedAt]=useState("");
  const[now,setNow]=useState(Date.now());

  async function load(){
    setLoading(true);

    try{
      const out=
        await invoke(
          "site-traffic",
          {
            action:"summary",
          },
        );

      setRows(
        Array.isArray(out?.rows)
          ?out.rows
          :[],
      );

      setCheckedAt(
        out?.checked_at||"",
      );

      setError("");
    }catch(e){
      setError(
        e?.message||
        String(e),
      );
    }finally{
      setNow(Date.now());
      setLoading(false);
    }
  }

  useEffect(()=>{
    load();

    const poll=
      setInterval(
        load,
        5000,
      );

    const clock=
      setInterval(
        ()=>setNow(Date.now()),
        5000,
      );

    return()=>{
      clearInterval(poll);
      clearInterval(clock);
    };
  },[]);

  const isOnline=
    (r)=>
      now-
      new Date(
        r.last_seen_at,
      ).getTime()
      <=ONLINE_MS;

  const online=
    rows.filter(
      isOnline,
    ).length;

  const shown=
    useMemo(
      ()=>rows.filter(
        r=>
          filter==="all"||
          (
            filter==="online"&&
            isOnline(r)
          )||
          (
            filter==="member"&&
            r.user_id
          ),
      ),
      [rows,filter,now],
    );

  async function clean(){
    if(
      !confirm(
        "Xóa lịch sử visitor không hoạt động quá 30 ngày?",
      )
    )return;

    try{
      await invoke(
        "site-traffic",
        {
          action:"cleanup",
          days:30,
        },
      );

      await load();
    }catch(e){
      setError(
        e?.message||
        String(e),
      );
    }
  }

  return <section className="adminSection">
    <div className="sectionTitle">
      <div>
        <h1>Người dùng truy cập / đang online</h1>
        <p className="sectionDescription">
          Presence V4: website gọi Edge Function <b>site-traffic</b>; Edge dùng service role ghi/đọc Supabase.
          Trình duyệt không còn ghi trực tiếp bảng site_presence qua RPC/RLS. Heartbeat 30 giây, online 90 giây.
          {checkedAt?<> · Kiểm tra: {fmt(checkedAt)}</>:null}
        </p>
      </div>
      <div className="rowActions">
        <button onClick={load}>
          {loading?"Đang tải…":"Làm mới"}
        </button>
        <button onClick={clean}>
          Dọn &gt;30 ngày
        </button>
      </div>
    </div>

    {error
      ?<div className="noticeErr">
        <b>Lỗi site-traffic:</b> {error}
      </div>
      :null}

    <div className="trafficStats">
      <article>
        <strong>{online}</strong>
        <span>Đang online</span>
      </article>
      <article>
        <strong>{rows.length}</strong>
        <span>Visitor gần đây</span>
      </article>
      <article>
        <strong>{rows.filter(r=>r.user_id).length}</strong>
        <span>Đã đăng nhập</span>
      </article>
    </div>

    <div className="trafficFilter">
      <button
        className={filter==="all"?"active":""}
        onClick={()=>setFilter("all")}
      >
        Tất cả
      </button>
      <button
        className={filter==="online"?"active":""}
        onClick={()=>setFilter("online")}
      >
        Đang online
      </button>
      <button
        className={filter==="member"?"active":""}
        onClick={()=>setFilter("member")}
      >
        Có tài khoản
      </button>
    </div>

    {loading&&!rows.length
      ?<p>Đang tải…</p>
      :<div className="tableWrap">
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
              const p=
                Array.isArray(r.profiles)
                  ?r.profiles[0]
                  :r.profiles;

              const on=
                isOnline(r);

              return <tr key={r.visitor_id}>
                <td>
                  <span className={`presenceDot ${on?"online":"offline"}`}>
                    {on?"Online":"Offline"}
                  </span>
                </td>
                <td>
                  <strong>
                    {p?.display_name||p?.email||"Khách"}
                  </strong>
                  <small className="trafficSub">
                    {p
                      ?`${p.email||""} · ${p.role_id||""} · ${p.status||""}`
                      :`Visitor ${String(r.visitor_id).slice(0,8)}`}
                  </small>
                </td>
                <td>
                  <code>{r.current_path||"/"}</code>
                </td>
                <td>{fmt(r.last_seen_at)}</td>
                <td>{Number(r.page_views||0)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>}
  </section>;
}