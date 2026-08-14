"use client";
import { FormEvent,useEffect,useMemo,useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { getMyAccess,invokeEdge,supabase,uploadR2 } from "../../lib/supabase-browser";
import styles from "./data.module.css";

const PAGE_SIZE=12;
type Permission="read"|"add"|"full";
type Media={id:string;object_key:string;public_url?:string|null;original_name?:string;visibility?:string};
type Item={id:string;collection_id:string|null;title_vi:string;title_en?:string;description_vi?:string;description_en?:string;storage_mode:"link"|"r2";external_url?:string|null;media_id?:string|null;media_assets?:Media|null;visibility:string;sort_order:number};
type Collection={id:string;slug:string;r2_prefix?:string|null;name_vi:string;name_en?:string;description_vi?:string;description_en?:string;visibility:string};

export default function DataPage(){
 const{language}=useLanguage(),vi=language==="vi";
 const[loading,setLoading]=useState(true),[itemsLoading,setItemsLoading]=useState(false),[logged,setLogged]=useState(false);
 const[items,setItems]=useState<Item[]>([]),[totalItems,setTotalItems]=useState(0),[collections,setCollections]=useState<Collection[]>([]);
 const[permissions,setPermissions]=useState<Record<string,Permission>>({});
 const[active,setActive]=useState(""),[message,setMessage]=useState(""),[page,setPage]=useState(1);
 const[edit,setEdit]=useState<Item|null>(null),[title,setTitle]=useState(""),[description,setDescription]=useState("");
 const[storage,setStorage]=useState<"link"|"r2">("r2"),[url,setUrl]=useState(""),[file,setFile]=useState<File|null>(null),[saving,setSaving]=useState(false);

 async function loadShell(){
  setLoading(true);setMessage("");
  try{
   const a:any=await getMyAccess();setLogged(!!a.authenticated);
   const calls:any[]=[supabase.from("data_collections").select("id,slug,r2_prefix,name_vi,name_en,description_vi,description_en,visibility").eq("visible",true).order("sort_order")];
   if(a.authenticated)calls.unshift(supabase.rpc("get_my_collection_permissions"));
   const res=await Promise.all(calls);let p:any,c:any;
   if(a.authenticated){[p,c]=res}else{[c]=res;p={data:[]}};
   if(p?.error||c.error)throw(p?.error||c.error);
   const map:Record<string,Permission>={};(p?.data||[]).forEach((x:any)=>map[x.collection_id]=x.permission_level);
   const cs=(c.data||[]) as Collection[];setPermissions(map);setCollections(cs);
   setActive(x=>x&&cs.some(c=>c.id===x)?x:(cs[0]?.id||""));
  }catch(e){setMessage(e instanceof Error?e.message:String(e))}
  finally{setLoading(false)}
 }

 async function loadItems(collectionId:string,pageNo:number){
  if(!collectionId){setItems([]);setTotalItems(0);return}
  setItemsLoading(true);
  try{
   const from=(pageNo-1)*PAGE_SIZE,to=from+PAGE_SIZE-1;
   const{data,count,error}=await supabase.from("data_items")
    .select("id,collection_id,title_vi,title_en,description_vi,description_en,storage_mode,external_url,media_id,visibility,sort_order,media_assets(id,object_key,public_url,original_name,visibility)",{count:"exact"})
    .eq("visible",true).eq("collection_id",collectionId).order("sort_order").range(from,to);
   if(error)throw error;
   setItems((data||[]) as unknown as Item[]);setTotalItems(Number(count||0));
  }catch(e){setMessage(e instanceof Error?e.message:String(e));setItems([]);setTotalItems(0)}
  finally{setItemsLoading(false)}
 }

 useEffect(()=>{loadShell()},[]);
 useEffect(()=>{setPage(1);resetEditor()},[active]);
 useEffect(()=>{if(active)loadItems(active,page)},[active,page]);

 const current=collections.find(c=>c.id===active);
 const currentPermission:Permission=permissions[active]||(current?.visibility==="public"||logged&&current?.visibility==="authenticated"?"read":"read");
 const canAdd=logged&&(currentPermission==="add"||currentPermission==="full");
 const canFull=logged&&currentPermission==="full";
 const totalPages=Math.max(1,Math.ceil(totalItems/PAGE_SIZE));

 async function openItem(item:Item){
  try{
   if(item.storage_mode==="link"&&item.external_url){window.open(item.external_url,"_blank","noopener,noreferrer");return}
   const m=item.media_assets;if(!m)return;
   const out:any=await invokeEdge("r2-file",{action:"presign-download",item_id:item.id,media_id:m.id,object_key:m.object_key});
   window.open(out.url,"_blank","noopener,noreferrer");
  }catch(e){setMessage(e instanceof Error?e.message:String(e))}
 }
 function resetEditor(){setEdit(null);setTitle("");setDescription("");setStorage("r2");setUrl("");setFile(null)}
 function beginEdit(item:Item){if(!canFull)return;setEdit(item);setTitle(vi?item.title_vi:(item.title_en||item.title_vi));setDescription(vi?(item.description_vi||""):(item.description_en||item.description_vi||""));setStorage(item.storage_mode);setUrl(item.external_url||"");setFile(null)}

 async function save(e:FormEvent){
  e.preventDefault();
  if(!current||(!canAdd&&!edit)){setMessage(vi?"Bạn chưa có quyền thêm trong thư mục này.":"You do not have Add permission in this folder.");return}
  if(edit&&!canFull){setMessage(vi?"Cần quyền Full để sửa.":"Full permission is required to edit.");return}
  if(!title.trim())return;
  setSaving(true);
  try{
   let mediaId=edit?.media_id||null,objectKey=edit?.media_assets?.object_key||null;
   if(storage==="r2"&&file){
    const asset:any=await uploadR2(file,{usageType:"data",folder:current.r2_prefix||`data/${current.slug}`,visibility:"private",usageNote:`Data folder ${current.slug}: ${title.trim()}`,itemId:edit?.id,collectionId:current.id});
    mediaId=asset.id;objectKey=asset.object_key;
   }
   if(storage==="r2"&&!mediaId)throw new Error(vi?"Hãy chọn file để upload.":"Choose a file to upload.");
   if(storage==="link"&&!url.trim())throw new Error(vi?"Hãy nhập URL.":"URL is required.");
   const loc=edit?(vi?{title_vi:title.trim(),description_vi:description.trim()}:{title_en:title.trim(),description_en:description.trim()}):(vi?{title_vi:title.trim(),description_vi:description.trim(),title_en:"",description_en:""}:{title_vi:title.trim(),title_en:title.trim(),description_vi:description.trim(),description_en:description.trim()});
   const payload:any={collection_id:current.id,...loc,storage_mode:storage,item_type:storage==="r2"?(file?.name.toLowerCase().endsWith(".json")||edit?.media_assets?.original_name?.toLowerCase().endsWith(".json")?"quiz_json":"document"):"link",external_url:storage==="link"?url.trim():null,media_id:storage==="r2"?mediaId:null,object_key:storage==="r2"?objectKey:null,visibility:"private",visible:true};
   if(edit){const{error}=await supabase.from("data_items").update(payload).eq("id",edit.id);if(error)throw error}
   else{const{error}=await supabase.from("data_items").insert({...payload,sort_order:totalItems+1});if(error)throw error}
   resetEditor();await loadItems(current.id,page);setMessage(vi?"Đã lưu trong thư mục.":"Saved in folder.");
  }catch(e){setMessage(e instanceof Error?e.message:String(e))}
  finally{setSaving(false)}
 }
 async function remove(item:Item){
  if(!canFull)return false;
  if(!confirm(vi?"Xóa mục này khỏi thư mục? File R2 gốc vẫn giữ trong thư viện R2 để tránh phá nơi khác.":"Delete this item from the folder? The original R2 asset remains in the R2 library."))return false;
  const{error}=await supabase.from("data_items").delete().eq("id",item.id);if(error){setMessage(error.message);return false}
  if(items.length===1&&page>1)setPage(page-1);else await loadItems(active,page);
  return true;
 }

 if(loading)return <main><div className="container" style={{padding:"80px 0"}}>{vi?"Đang tải danh sách thư mục…":"Loading folders…"}</div></main>;

 return <main>
  <section className={styles.hero}><div className="container"><p>DATA / FOLDERS</p><h1>{vi?"Thư mục dữ liệu được phân quyền.":"Permission-based data folders."}</h1><span>{vi?"Mỗi lần chỉ tải tối đa 12 mục của thư mục đang mở, không kéo toàn bộ dữ liệu website về trình duyệt.":"Only up to 12 items in the active folder are loaded at a time."}</span></div></section>
  <section className={`container ${styles.workspace}`}>
   {message?<p className={styles.notice}>{message}</p>:null}
   {!collections.length?<p className={styles.empty}>{vi?"Chưa có thư mục dữ liệu bạn được xem.":"No accessible data folders."}</p>:<>
    <div className={styles.folderTabs}>{collections.map(c=><button key={c.id} className={active===c.id?styles.activeFolder:""} onClick={()=>setActive(c.id)}><b>{vi?c.name_vi:(c.name_en||c.name_vi)}</b><small>{c.r2_prefix||`data/${c.slug}`}</small></button>)}</div>
    {current&&<div className={styles.folderHeader}><div><span>{currentPermission.toUpperCase()}</span><h2>{vi?current.name_vi:(current.name_en||current.name_vi)}</h2><p>{vi?current.description_vi:(current.description_en||current.description_vi)}</p></div>{canAdd&&!edit?<button onClick={()=>resetEditor()} className={styles.addButton}>+ {vi?"Thêm file / link":"Add file / link"}</button>:null}</div>}
    {canAdd||edit?<form className={styles.editor} onSubmit={save}>
      <h2>{edit?(vi?"Sửa mục trong thư mục":"Edit folder item"):(vi?"Thêm vào thư mục":"Add to folder")}</h2>
      <label>{vi?"Tên":"Name"} *<input value={title} onChange={e=>setTitle(e.target.value)} required/></label>
      <label>{vi?"Mô tả":"Description"}<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></label>
      <label>{vi?"Loại":"Type"}<select value={storage} onChange={e=>{setStorage(e.target.value as any);setFile(null)}}><option value="r2">R2</option><option value="link">Link</option></select></label>
      {storage==="r2"?<div className={styles.fileField}><span className={styles.fileLabel}>{vi?"Tệp R2":"R2 file"} {!edit?.media_id?"*":""}</span>{edit?.media_assets?<div className={styles.currentFile}><div><small>{vi?"Tệp hiện tại":"Current file"}</small><strong>{edit.media_assets.original_name||edit.media_assets.object_key}</strong><code>{edit.media_assets.object_key}</code></div><div className={styles.fileActions}><button type="button" onClick={()=>openItem(edit)}>{vi?"Xem / mở tệp":"Preview / open"}</button><label className={styles.fileButton}>{vi?"Thay tệp":"Replace file"}<input type="file" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div></div>:<label className={styles.fileButton}>{vi?"Chọn tệp từ máy":"Choose file from computer"}<input type="file" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/></label>}{file?<div className={styles.pendingFile}><div><small>{edit?(vi?"Sẽ thay bằng":"Will replace with"):(vi?"Tệp đã chọn":"Selected file")}</small><strong>{file.name}</strong></div><button type="button" onClick={()=>setFile(null)}>{vi?"Bỏ thay đổi tệp":"Cancel file change"}</button></div>:null}<small className={styles.prefix}>{vi?"Thư mục R2":"R2 folder"}: {current?.r2_prefix||`data/${current?.slug}`}</small></div>:<label>URL *<input type="url" value={url} onChange={e=>setUrl(e.target.value)}/></label>}
      <div className={styles.editorActions}>{edit?<button type="button" className={styles.deleteButton} onClick={async()=>{if(await remove(edit))resetEditor()}}>{vi?"Xóa mục":"Delete item"}</button>:null}<button type="button" onClick={resetEditor}>{vi?"Hủy":"Cancel"}</button><button disabled={saving}>{saving?(vi?"Đang lưu…":"Saving…"):(vi?"Lưu":"Save")}</button></div>
    </form>:null}
    {itemsLoading?<p className={styles.notice}>{vi?"Đang tải trang dữ liệu…":"Loading data page…"}</p>:<div className={styles.grid}>{items.map(item=><article className={styles.resource} key={item.id}><div><span>{item.storage_mode==="r2"?"R2":"LINK"}</span><i>{currentPermission.toUpperCase()}</i></div><h2>{vi?item.title_vi:(item.title_en||item.title_vi)}</h2><p>{vi?item.description_vi:(item.description_en||item.description_vi)}</p><div className={styles.resourceActions}><button onClick={()=>openItem(item)}>{vi?"Mở":"Open"} ↗</button>{canFull?<><button onClick={()=>beginEdit(item)}>{vi?"Sửa":"Edit"}</button><button onClick={()=>remove(item)}>{vi?"Xóa":"Delete"}</button></>:null}</div></article>)}</div>}
    {totalPages>1?<nav className={styles.pagination}><button disabled={page===1} onClick={()=>setPage(x=>Math.max(1,x-1))}>{vi?"← Trước":"← Previous"}</button><span>{vi?`Trang ${page} / ${totalPages} · ${totalItems} mục`:`Page ${page} / ${totalPages} · ${totalItems} items`}</span><button disabled={page===totalPages} onClick={()=>setPage(x=>Math.min(totalPages,x+1))}>{vi?"Sau →":"Next →"}</button></nav>:null}
   </>}
  </section>
 </main>;
}