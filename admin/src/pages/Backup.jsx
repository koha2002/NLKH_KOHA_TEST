import React,{useEffect,useMemo,useRef,useState}from"react";
import{ZipWriter,TextReader}from"@zip.js/zip.js";
import{AdminPage}from"./_shared";
import{invoke}from"../lib/supabase";
import{notify}from"../lib/notify";

const PAGE=250;
const BACKUP_API_KEY=String(
 import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||
 import.meta.env.VITE_SUPABASE_ANON_KEY||
 ""
);
const enc=new TextEncoder();

function bytes(v){
 const n=Number(v||0);
 if(!Number.isFinite(n)||n<=0)return"0 B";
 const u=["B","KB","MB","GB","TB"];
 let x=n,i=0;
 while(x>=1024&&i<u.length-1){x/=1024;i++}
 return`${x.toFixed(i?2:0)} ${u[i]}`;
}
function when(v){
 try{return new Date(v).toLocaleString("vi-VN")}catch{return String(v||"")}
}
function shortHash(v=""){
 let h=2166136261;
 for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619)}
 return(h>>>0).toString(36);
}
function safePart(v=""){
 let s=String(v).replace(/[\x00-\x1f\x7f<>:"|?*]/g,"_");
 if(s==="."||s==="..")s="_";
 return s.slice(0,180)||"_";
}
function safeZipPath(prefix,key){
 const original=String(key||"").replace(/\\/g,"/");
 const rawParts=original.split("/").filter(Boolean);
 const parts=rawParts.map(safePart);
 let path=parts.join("/")||`unnamed-${shortHash(original)}`;
 if(path!==original.replace(/^\/+/,"")){
  const bits=path.split("/");
  bits[bits.length-1]=`${bits[bits.length-1]}--${shortHash(original)}`;
  path=bits.join("/");
 }
 return`${prefix}/${path}`;
}
function decodeMeta(v){
 try{
  if(!v)return{};
  const p=v.replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(p+"=".repeat((4-p.length%4)%4));
  const b=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)b[i]=raw.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(b));
 }catch{return{}}
}

const RESTORE_GUIDE=`NLKH FULL DISASTER BACKUP V3

VALID BACKUP
A backup is complete only when BACKUP_COMPLETE.json exists and the ZIP opens without CRC errors.

INCLUDED
1. supabase/database/public/*.json
   Every row from every table in the public schema.
2. supabase/schema-metadata.json
   Tables, columns, constraints, indexes, RLS state/policies, triggers, functions,
   views, materialized views, sequences, enums, grants, extensions and migration history.
3. supabase/auth/users.json
   User records exposed by the supported Supabase Admin Auth API.
4. supabase-storage/
   Every object currently present in Supabase Storage plus per-page manifests.
5. r2/
   Every object currently present in the configured Cloudflare R2 bucket plus
   object metadata returned by R2.
6. runtime/environment-required.json
   Safe project identifiers and a presence-only checklist for important secrets.

NOT EXPORTED AS SECRET VALUES
- Supabase service-role key
- INTEGRATION_SECRETS_KEY
- Scheduler secret
- R2 secret access key
- Cloudflare API token
- Any other provider secret that cannot be safely read back from runtime

IMPORTANT FOR ENCRYPTED API DATA
api_integrations.secret_ciphertext is backed up as database data. It can only be
decrypted after disaster recovery if the SAME INTEGRATION_SECRETS_KEY is restored.
Keep secret VALUES separately in a password manager/offline secret escrow.

AUTH LIMITATION
Supabase Admin Auth exposes user records, but this ZIP is not a supported export of
password hashes, active sessions or refresh tokens. After a disaster restore, users
may need to be recreated and asked to reset passwords.

SOURCE CODE / DEPLOYMENT
The Git repository remains the authoritative source for Next.js/Admin/Edge Function/
Worker source. This runtime ZIP cannot reconstruct full Git history or provider-side
Render/Cloudflare dashboard settings.

CLOUDFLARE WORKER KV
Technology News CONFIG KV is exported to cloudflare/technology-news-kv.json,
including key names, values, expiration and metadata returned by the Worker binding.

R2 BUCKETS
The backup first attempts account-level ListBuckets using the configured R2 S3
credentials. If those credentials are bucket-scoped and cannot list the account,
the backup falls back to the configured R2_BUCKET_NAME and records that mode.

CONSISTENCY
Supabase + Storage + R2 are different live services. This backup verifies row/object
counts against the preflight inventory and aborts if counts change, but it is not one
cross-service transactional snapshot. Run it during a quiet period for best consistency.

RESTORE ORDER
1. Restore/clone the Git repository.
2. Create/select Supabase project; apply repo migrations.
3. Restore required secret VALUES from your secret escrow.
4. Restore public table JSON data.
5. Recreate Auth users from supabase/auth/users.json; reset passwords if required.
6. Restore Supabase Storage objects to identical bucket/path.
7. Restore every Cloudflare R2 bucket/object to identical bucket/key and metadata.
8. Restore Technology News CONFIG KV from cloudflare/technology-news-kv.json.
9. Deploy Edge Functions, Cloudflare Workers, Admin and frontend.
10. Compare schema metadata/RLS/grants and test all protected flows.

SECURITY
This ZIP contains private application/user data. Store it encrypted or in a secure drive.
`;

function pagedJsonStream(fetchPage,onPage){
 let offset=0,first=true,done=false,started=false;
 return new ReadableStream({
  async pull(controller){
   if(done)return;
   try{
    if(!started){controller.enqueue(enc.encode("[\n"));started=true}
    const rows=await fetchPage(offset);
    if(rows.length){
     const text=rows.map(x=>JSON.stringify(x)).join(",\n");
     controller.enqueue(enc.encode((first?"":",\n")+text));
     first=false;
     offset+=rows.length;
     onPage?.(rows.length,offset);
    }
    if(rows.length<PAGE){
     controller.enqueue(enc.encode("\n]\n"));
     done=true;controller.close();
    }
   }catch(e){done=true;controller.error(e)}
  }
 });
}
function authJsonStream(fetchPage,onPage){
 let page=1,first=true,done=false,started=false,total=0;
 return new ReadableStream({
  async pull(controller){
   if(done)return;
   try{
    if(!started){controller.enqueue(enc.encode("[\n"));started=true}
    const users=await fetchPage(page);
    if(users.length){
     const text=users.map(x=>JSON.stringify(x)).join(",\n");
     controller.enqueue(enc.encode((first?"":",\n")+text));
     first=false;total+=users.length;page++;
     onPage?.(users.length,total);
    }
    if(users.length<1000){
     controller.enqueue(enc.encode("\n]\n"));
     done=true;controller.close();
    }
   }catch(e){done=true;controller.error(e)}
  }
 });
}

export default function Backup({access}){
 const[inventory,setInventory]=useState(null);
 const[checking,setChecking]=useState(false);
 const[downloading,setDownloading]=useState(false);
 const[message,setMessage]=useState("");
 const[progress,setProgress]=useState({phase:"",current:0,total:0,detail:""});
 const ticketRef=useRef(null);

 const pct=useMemo(()=>{
  if(!progress.total)return 0;
  return Math.max(0,Math.min(100,Math.round(progress.current*100/progress.total)));
 },[progress]);

 async function check(){
  try{
   setChecking(true);setMessage("");
   const r=await invoke("manual-backup",{action:"inventory"});
   setInventory(r);
   notify("Đã kiểm tra dữ liệu backup.","success");
   return r;
  }catch(e){
   const m=e?.message||String(e);setMessage(m);notify(m,"error",8000);throw e;
  }finally{setChecking(false)}
 }
 useEffect(()=>{check().catch(()=>{})},[]);

 async function ensureTicket(force=false){
  const cur=ticketRef.current;
  if(!force&&cur&&new Date(cur.expires_at).getTime()-Date.now()>5*60*1000)return cur;
  const r=await invoke("manual-backup",{action:"ticket"});
  if(!r?.ticket||!r?.endpoint)throw new Error("Không tạo được vé backup.");
  ticketRef.current=r;
  return r;
 }
 async function edgeFetch(params,retryTicket=true){
  const op=String(params?.op||"binary");
  const t=await ensureTicket(false);
  const u=new URL(t.endpoint);
  u.searchParams.set("ticket",t.ticket);
  Object.entries(params||{}).forEach(([k,v])=>{
   if(v!==undefined&&v!==null&&v!=="")u.searchParams.set(k,String(v));
  });

  let lastError=null;
  for(let attempt=1;attempt<=3;attempt++){
   try{
    const headers=BACKUP_API_KEY?{apikey:BACKUP_API_KEY}:{};
    const r=await fetch(u.toString(),{
     cache:"no-store",
     mode:"cors",
     credentials:"omit",
     headers
    });
    if(r.status===403&&retryTicket){
     await ensureTicket(true);
     return edgeFetch(params,false);
    }
    if(!r.ok){
     const text=await r.text().catch(()=>"");
     throw new Error(text||`Backup API HTTP ${r.status}`);
    }
    return r;
   }catch(e){
    lastError=e;
    if(attempt<3)await new Promise(resolve=>setTimeout(resolve,500*attempt));
   }
  }
  throw new Error(
   `Không kết nối được luồng backup (${op}): ${lastError?.message||String(lastError||"Failed to fetch")}`
  );
 }
 async function edgeJson(params){
  const x=await invoke("manual-backup",{action:"json-op",...(params||{})});
  if(x?.error)throw new Error(x.error);
  return x;
 }
 async function addText(zip,name,text){
  await zip.add(name,new TextReader(String(text)),{level:0});
 }

 async function downloadFull(){
  if(downloading)return;
  if(!window.showSaveFilePicker){
   const m="Trình duyệt này không hỗ trợ ghi ZIP trực tiếp xuống ổ đĩa. Hãy dùng Chrome/Edge desktop mới.";
   setMessage(m);notify(m,"error",9000);return;
  }
  const ok=confirm(
   "Tạo FULL disaster backup về máy?\n\nBao gồm toàn bộ public Supabase DB, Auth users, Supabase Storage và Cloudflare R2. File có dữ liệu riêng tư."
  );
  if(!ok)return;

  const stamp=new Date().toISOString().replace(/[:.]/g,"-");
  let handle;
  try{
   handle=await window.showSaveFilePicker({
    suggestedName:`NLKH_FULL_BACKUP_${stamp}.zip`,
    types:[{description:"ZIP backup",accept:{"application/zip":[".zip"]}}]
   });
  }catch(e){
   if(e?.name==="AbortError")return;
   throw e;
  }

  let writable=null,zip=null,wake=null;
  const startedAt=new Date().toISOString();

  try{
   setDownloading(true);setMessage("Đang kiểm tra lần cuối trước khi tạo ZIP...");
   setProgress({phase:"Preflight",current:0,total:1,detail:"Kiểm tra Database/Auth/Storage/R2"});

   const inv=await invoke("manual-backup",{action:"inventory"});
   if(!inv?.ready)throw new Error("Preflight backup không sẵn sàng.");
   setInventory(inv);
   await ensureTicket(true);

   try{wake=await navigator.wakeLock?.request?.("screen")}catch{}

   writable=await handle.createWritable();
   zip=new ZipWriter(writable,{
    level:0,
    zip64:true,
    useWebWorkers:false,
    useCompressionStream:false,
    preventClose:true
   });

   const rootManifest={
    format:"NLKH_FULL_DISASTER_BACKUP_V4_1",
    started_at:startedAt,
    preflight:inv,
    complete_marker:"BACKUP_COMPLETE.json",
    zip64:true,
    compression:"store-level-0",
    source_code:"Git repository is separate.",
    cloudflare_worker_kv:"Included via protected Technology News Worker export.",
    secret_values:"Not embedded; see runtime/environment-required.json."
   };
   await addText(zip,"README_RESTORE.txt",RESTORE_GUIDE);
   await addText(zip,"manifest.json",JSON.stringify(rootManifest,null,2));

   setProgress({phase:"Schema",current:0,total:1,detail:"Metadata/RLS/functions/migrations"});
   const[schemaPack,metaPack]=await Promise.all([
    edgeJson({op:"schema"}),
    edgeJson({op:"meta"})
   ]);
   await addText(zip,"supabase/schema-metadata.json",JSON.stringify(schemaPack.schema||{},null,2));
   await addText(zip,"runtime/environment-required.json",JSON.stringify(metaPack,null,2));
   setProgress({phase:"Schema",current:1,total:1,detail:"Đã ghi metadata"});

   let dbRows=0;
   const tables=inv.database?.tables||[];
   for(let ti=0;ti<tables.length;ti++){
    const table=tables[ti];
    let seen=0;
    setProgress({
     phase:"Supabase Database",current:ti,total:tables.length,
     detail:`${table.table_name} · 0/${table.row_count} dòng`
    });
    const stream=pagedJsonStream(
     async(offset)=>{
      const x=await edgeJson({
       op:"table-page",table:table.table_name,offset,limit:PAGE
      });
      return x.rows||[];
     },
     (_,total)=>{
      seen=total;
      setProgress({
       phase:"Supabase Database",current:ti,total:tables.length,
       detail:`${table.table_name} · ${total}/${table.row_count} dòng`
      });
     }
    );
    await zip.add(
     `supabase/database/public/${safePart(table.table_name)}.json`,
     stream,{level:0,zip64:true}
    );
    if(seen!==Number(table.row_count||0)){
     throw new Error(
      `Database thay đổi trong lúc backup: ${table.table_name} expected ${table.row_count}, got ${seen}. Hãy chạy lại khi website ít thay đổi.`
     );
    }
    dbRows+=seen;
    setProgress({
     phase:"Supabase Database",current:ti+1,total:tables.length,
     detail:`Đã xong ${table.table_name}`
    });
   }

   let authSeen=0;
   setProgress({phase:"Supabase Auth",current:0,total:Number(inv.auth?.users||0),detail:"Users"});
   const authStream=authJsonStream(
    async(page)=>{
     const x=await edgeJson({op:"auth-page",page,limit:1000});
     return x.users||[];
    },
    (_,total)=>{
     authSeen=total;
     setProgress({
      phase:"Supabase Auth",current:total,total:Number(inv.auth?.users||0),
      detail:`${total}/${inv.auth?.users||0} users`
     });
    }
   );
   await zip.add("supabase/auth/users.json",authStream,{level:0,zip64:true});
   if(authSeen!==Number(inv.auth?.users||0)){
    throw new Error(`Auth users thay đổi trong lúc backup: expected ${inv.auth?.users||0}, got ${authSeen}.`);
   }

   let storageSeen=0,storageOffset=0,storagePage=1;
   const storageExpected=Number(inv.supabase_storage?.objects||0);
   while(true){
    const x=await edgeJson({op:"storage-list-page",offset:storageOffset,limit:PAGE});
    const objects=x.objects||[];
    if(!objects.length)break;

    const pageMeta=[];
    for(const obj of objects){
     const bucket=String(obj.bucket_id||"");
     const name=String(obj.name||"");
     setProgress({
      phase:"Supabase Storage",current:storageSeen,total:storageExpected,
      detail:`${bucket}/${name}`
     });
     const res=await edgeFetch({op:"storage-file",bucket,name});
     if(!res.body)throw new Error(`Storage response rỗng: ${bucket}/${name}`);
     const zipPath=safeZipPath(`supabase-storage/files/${safePart(bucket)}`,name);
     const responseMeta=decodeMeta(res.headers.get("X-NLKH-Object-Meta"));
     await zip.add(zipPath,res.body,{level:0,zip64:true});
     storageSeen++;
     pageMeta.push({
      ...obj,zip_path:zipPath,
      response:{
       content_type:res.headers.get("Content-Type"),
       content_length:res.headers.get("Content-Length"),
       etag:res.headers.get("ETag"),
       last_modified:res.headers.get("Last-Modified"),
       cache_control:res.headers.get("Cache-Control")
      },
      proxy_meta:responseMeta
     });
    }
    await addText(
     zip,
     `supabase-storage/manifests/page-${String(storagePage).padStart(6,"0")}.json`,
     JSON.stringify(pageMeta,null,2)
    );
    storageOffset+=objects.length;storagePage++;
    if(objects.length<PAGE)break;
   }
   if(storageSeen!==storageExpected){
    throw new Error(`Supabase Storage thay đổi trong lúc backup: expected ${storageExpected}, got ${storageSeen}.`);
   }

   let r2Seen=0,r2Page=1;
   const r2Expected=Number(inv.r2?.objects||0);
   const r2Buckets=Array.isArray(inv.r2?.buckets)?inv.r2.buckets:[];
   for(const bucketInfo of r2Buckets){
    const bucket=String(bucketInfo?.name||"");
    if(!bucket)continue;
    let r2Cursor="";
    let bucketSeen=0;
    const bucketExpected=Number(bucketInfo?.objects||0);
    while(true){
     const x=await edgeJson({
      op:"r2-list-page",bucket,cursor:r2Cursor,limit:PAGE
     });
     const objects=x.objects||[];
     if(!objects.length&&!x.next_cursor)break;

     const pageMeta=[];
     for(const obj of objects){
      const key=String(obj.key||"");
      setProgress({
       phase:"Cloudflare R2",current:r2Seen,total:r2Expected,
       detail:`${bucket}/${key}`
      });
      const res=await edgeFetch({op:"r2-file",bucket,key});
      if(!res.body)throw new Error(`R2 response rỗng: ${bucket}/${key}`);
      const zipPath=safeZipPath(`r2/buckets/${safePart(bucket)}/files`,key);
      const fullMeta=decodeMeta(res.headers.get("X-NLKH-Object-Meta"));
      await zip.add(zipPath,res.body,{level:0,zip64:true});
      r2Seen++;bucketSeen++;
      pageMeta.push({
       ...obj,bucket,zip_path:zipPath,
       response:{
        content_type:res.headers.get("Content-Type"),
        content_length:res.headers.get("Content-Length"),
        etag:res.headers.get("ETag"),
        last_modified:res.headers.get("Last-Modified"),
        cache_control:res.headers.get("Cache-Control"),
        content_disposition:res.headers.get("Content-Disposition"),
        content_encoding:res.headers.get("Content-Encoding"),
        content_language:res.headers.get("Content-Language")
       },
       r2_metadata:fullMeta
      });
     }
     await addText(
      zip,
      `r2/buckets/${safePart(bucket)}/manifests/page-${String(r2Page).padStart(6,"0")}.json`,
      JSON.stringify(pageMeta,null,2)
     );
     r2Page++;
     r2Cursor=String(x.next_cursor||"");
     if(!r2Cursor)break;
    }
    if(bucketSeen!==bucketExpected){
     throw new Error(`R2 bucket ${bucket} thay đổi trong lúc backup: expected ${bucketExpected}, got ${bucketSeen}.`);
    }
   }
   if(r2Seen!==r2Expected){
    throw new Error(`R2 thay đổi trong lúc backup: expected ${r2Expected}, got ${r2Seen}.`);
   }

   setProgress({phase:"Cloudflare KV",current:0,total:1,detail:"Technology News CONFIG"});
   const kvPack=await edgeJson({op:"technology-news-kv"});
   await addText(
    zip,
    "cloudflare/technology-news-kv.json",
    JSON.stringify(kvPack,null,2)
   );
   const kvKeys=Array.isArray(kvPack?.keys)?kvPack.keys.length:0;
   setProgress({phase:"Cloudflare KV",current:1,total:1,detail:`${kvKeys} keys`});

   const complete={
    ok:true,
    format:"NLKH_FULL_DISASTER_BACKUP_V4_1",
    started_at:startedAt,
    completed_at:new Date().toISOString(),
    database_tables:tables.length,
    database_rows:dbRows,
    auth_users:authSeen,
    supabase_storage_objects:storageSeen,
    r2_buckets:Number(inv.r2?.total_buckets||r2Buckets.length||0),
    r2_objects:r2Seen,
    technology_news_kv_keys:kvKeys,
    preflight_checked_at:inv.checked_at,
    consistency:"count-verified-non-transactional-cross-service"
   };

   setProgress({phase:"Hoàn tất",current:0,total:1,detail:"Ghi BACKUP_COMPLETE.json"});
   await addText(zip,"BACKUP_COMPLETE.json",JSON.stringify(complete,null,2));
   await zip.close({zip64:true,preventClose:true});
   await writable.close();
   writable=null;
   zip=null;

   setProgress({phase:"Hoàn tất",current:1,total:1,detail:"ZIP đã ghi xong xuống ổ đĩa"});
   setMessage(
    `Backup FULL hoàn tất: ${dbRows} dòng DB · ${authSeen} users · ${storageSeen} Storage · ${r2Seen} R2 · ${kvKeys} KV. Hãy mở ZIP và kiểm tra BACKUP_COMPLETE.json.`
   );
   notify("FULL backup V4.1 đã hoàn tất.","success",8000);
  }catch(e){
   try{await zip?.close?.({preventClose:true})}catch{}
   try{await writable?.abort?.()}catch{}
   const m=e?.message||String(e);
   setMessage(`BACKUP THẤT BẠI: ${m}`);
   notify(`Backup thất bại: ${m}`,"error",12000);
  }finally{
   try{await wake?.release?.()}catch{}
   setDownloading(false);
   ticketRef.current=null;
  }
 }

 const db=inventory?.database||{};
 const ss=inventory?.supabase_storage||{};
 const r2=inventory?.r2||{};
 const estimated=Number(inventory?.estimated_binary_bytes||0);

 return <AdminPage access={access}>
  <section className="adminSection">
   <div className="sectionTitle">
    <div>
     <h1>Backup FULL thủ công V4.1</h1>
     <p className="sectionDescription">
      Một nút tạo ZIP64 và ghi trực tiếp xuống ổ đĩa. Metadata đi qua request Admin đã xác thực;
      file R2/Storage đi qua luồng GET có ticket ngắn hạn và CORS riêng.
     </p>
    </div>
    <button className="primary" disabled={checking||downloading} onClick={check}>
     {checking?"Đang kiểm tra...":"Kiểm tra dữ liệu backup"}
    </button>
   </div>

   {message?<div className="fullBackupMessage">{message}</div>:null}

   <div className="fullBackupStats">
    <article><small>Supabase Database</small><strong>{db.total_tables??"—"} bảng</strong><span>{db.total_rows??"—"} dòng</span></article>
    <article><small>Supabase Auth</small><strong>{inventory?.auth?.users??"—"} users</strong><span>User/metadata</span></article>
    <article><small>Supabase Storage</small><strong>{ss.objects??"—"} file</strong><span>{bytes(ss.bytes)}</span></article>
    <article><small>Cloudflare R2</small><strong>{r2.objects??"—"} file</strong><span>{r2.total_buckets??"—"} bucket · {bytes(r2.bytes)}</span></article>
   </div>

   <div className="fullBackupAction">
    <div>
     <strong>{inventory?.ready?"✓ Sẵn sàng backup":"Chưa kiểm tra / chưa sẵn sàng"}</strong>
     <small>
      {inventory?.checked_at
       ?`Kiểm tra ${when(inventory.checked_at)} · dữ liệu nhị phân ~ ${bytes(estimated)}`
       :"Hệ thống kiểm tra Database, Auth, Supabase Storage và R2."}
     </small>
    </div>
    <button className="primary" disabled={!inventory?.ready||checking||downloading} onClick={downloadFull}>
     {downloading?"Đang backup...":"Tạo & lưu FULL ZIP"}
    </button>
   </div>

   {downloading||progress.phase?<div className="fullBackupProgress">
    <div><strong>{progress.phase||"Backup"}</strong><span>{progress.total?`${progress.current}/${progress.total}`:""}</span></div>
    <progress max="100" value={pct}/>
    <small>{progress.detail||""}</small>
   </div>:null}

   <div className="notice">
    <b>Backup chỉ hợp lệ khi:</b> file ZIP mở được và có <code>BACKUP_COMPLETE.json</code>.
    Nếu dữ liệu thay đổi làm số lượng DB/Storage/R2 lệch so với lúc kiểm tra, hệ thống sẽ báo lỗi để bạn chạy lại.
   </div>
  </section>

  <section className="adminSection">
   <div className="sectionTitle"><div><h1>Phạm vi dữ liệu</h1><p className="sectionDescription">Toàn bộ bảng Supabase public hiện có.</p></div></div>
   <div className="tableWrap">
    <table>
     <thead><tr><th>Bảng</th><th>Số dòng</th></tr></thead>
     <tbody>{(db.tables||[]).map(x=><tr key={x.table_name}><td><code>{x.table_name}</code></td><td>{x.row_count}</td></tr>)}</tbody>
    </table>
   </div>
  </section>

  <section className="adminSection">
   <div className="sectionTitle"><div><h1>Khôi phục khi web sập</h1><p className="sectionDescription">ZIP có README, schema/RLS/functions/migration metadata, DB, Auth, Storage, mọi R2 bucket mà credential truy cập được và Technology News KV.</p></div></div>
   <div className="fullBackupWarnings">
    <p><b>Secret value phải cất riêng:</b> service-role key, INTEGRATION_SECRETS_KEY, R2 secret, Scheduler secret, Cloudflare token. Runtime không nên cho phép đọc ngược các giá trị này vào ZIP.</p>
    <p><b>Auth:</b> backup user record nhưng không phải bản export password hash/session được hỗ trợ. Phục hồi có thể cần reset mật khẩu.</p>
    <p><b>Git/source:</b> vẫn phải giữ Git/GitHub. ZIP runtime không thay thế lịch sử source code.</p>
    <p><b>Cloudflare Worker KV:</b> Technology News CONFIG KV được đưa vào ZIP qua endpoint nội bộ ký HMAC; gồm key/value/expiration/metadata.</p>
   </div>
  </section>
 </AdminPage>;
}
