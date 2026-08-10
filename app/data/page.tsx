"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { getMyAccess, invokeEdge, supabase, uploadR2 } from "../../lib/supabase-browser";
import styles from "./data.module.css";

type Permission="read"|"add"|"full";
type Media={id:string;object_key:string;public_url?:string|null;original_name?:string;visibility?:string};
type Item={id:string;collection_id:string|null;title_vi:string;title_en?:string;description_vi?:string;description_en?:string;storage_mode:"link"|"r2";external_url?:string|null;media_id?:string|null;media_assets?:Media|null;visibility:string;sort_order:number};
type Collection={id:string;name_vi:string;name_en?:string;description_vi?:string;description_en?:string};

export default function DataPage(){
  const{language}=useLanguage(),vi=language==="vi";
  const[loading,setLoading]=useState(true),[logged,setLogged]=useState(false),[items,setItems]=useState<Item[]>([]),[collections,setCollections]=useState<Collection[]>([]),[permissions,setPermissions]=useState<Record<string,Permission>>({}),[message,setMessage]=useState("");
  const[edit,setEdit]=useState<Item|null>(null),[addCollection,setAddCollection]=useState(""),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[storage,setStorage]=useState<"link"|"r2">("link"),[url,setUrl]=useState(""),[file,setFile]=useState<File|null>(null),[saving,setSaving]=useState(false);

  async function load(){
    setLoading(true);setMessage("");const a=await getMyAccess();setLogged(a.authenticated);
    if(!a.authenticated){setItems([]);setCollections([]);setPermissions({});setLoading(false);return}
    const[p,c,i]=await Promise.all([
      supabase.rpc("get_my_data_permissions"),
      supabase.from("data_collections").select("id,name_vi,name_en,description_vi,description_en").order("sort_order"),
      supabase.from("data_items").select("id,collection_id,title_vi,title_en,description_vi,description_en,storage_mode,external_url,media_id,visibility,sort_order,media_assets(id,object_key,public_url,original_name,visibility)").order("sort_order")
    ]);
    if(p.error||c.error||i.error)setMessage(p.error?.message||c.error?.message||i.error?.message||(vi?"Không thể tải dữ liệu.":"Unable to load data."));
    const map:Record<string,Permission>={};(p.data||[]).forEach((x:any)=>map[x.item_id]=x.permission_level);
    setPermissions(map);setCollections((c.data||[]) as Collection[]);setItems((i.data||[]) as unknown as Item[]);setLoading(false);
  }
  useEffect(()=>{load()},[]);

  const addableCollections=useMemo(()=>{const ids=new Set<string>();items.forEach(x=>{const p=permissions[x.id];if(x.collection_id&&(p==="add"||p==="full"))ids.add(x.collection_id)});return collections.filter(c=>ids.has(c.id))},[items,permissions,collections]);

  async function openItem(item:Item){try{if(item.storage_mode==="link"&&item.external_url){window.open(item.external_url,"_blank","noopener,noreferrer");return}const media=item.media_assets;if(media?.public_url&&media.visibility==="public"){window.open(media.public_url,"_blank","noopener,noreferrer");return}if(!media)return;const out:any=await invokeEdge("r2-file",{action:"presign-download",item_id:item.id,media_id:media.id,object_key:media.object_key});window.open(out.url,"_blank","noopener,noreferrer")}catch(e){setMessage(e instanceof Error?e.message:String(e))}}
  function beginAdd(){const c=addableCollections[0];if(!c){setMessage(vi?"Bạn chưa có quyền Thêm hoặc Full ở nhóm dữ liệu nào.":"You do not have Add or Full permission in any data group.");return}setEdit(null);setAddCollection(c.id);setTitle("");setDescription("");setStorage("link");setUrl("");setFile(null)}
  function beginEdit(item:Item){if(permissions[item.id]!=="full"){setMessage(vi?"Mục này chỉ có quyền đọc/thêm; cần quyền Full để sửa.":"Full permission is required to edit this item.");return}setEdit(item);setAddCollection(item.collection_id||"");setTitle(vi?(item.title_vi||""):(item.title_en||item.title_vi||""));setDescription(vi?(item.description_vi||""):(item.description_en||item.description_vi||""));setStorage(item.storage_mode||"link");setUrl(item.external_url||"");setFile(null)}
  async function save(e:FormEvent){
    e.preventDefault();setMessage("");
    if(title.trim().length<2){setMessage(vi?"Tên tài liệu cần ít nhất 2 ký tự.":"The document name must contain at least 2 characters.");return}
    if(storage==="link"&&!url.trim()){setMessage(vi?"Bạn đã chọn nguồn Liên kết nên cần nhập URL.":"A URL is required when Link is selected.");return}
    if(storage==="r2"&&!file&&!edit?.media_id){setMessage(vi?"Bạn đã chọn Tệp R2 nên cần chọn file.":"Choose a file when R2 is selected.");return}
    setSaving(true);
    try{
      let mediaId=edit?.media_id||null,objectKey=edit?.media_assets?.object_key||null;
      if(storage==="r2"&&file){const asset:any=await uploadR2(file,{usageType:"data",folder:"data",visibility:"private",usageNote:`Data: ${title.trim()}`,itemId:edit?.id,collectionId:addCollection});mediaId=asset.id;objectKey=asset.object_key}
      const localized=edit
        ? (vi?{title_vi:title.trim(),description_vi:description.trim()}:{title_en:title.trim(),description_en:description.trim()})
        : (vi?{title_vi:title.trim(),description_vi:description.trim()}:{title_vi:title.trim(),title_en:title.trim(),description_vi:description.trim(),description_en:description.trim()});
      const payload:any={collection_id:addCollection||null,...localized,storage_mode:storage,item_type:storage==="link"?"link":"document",external_url:storage==="link"?url.trim():null,media_id:storage==="r2"?mediaId:null,object_key:storage==="r2"?objectKey:null,visibility:"private",visible:true};
      if(edit){const{error}=await supabase.from("data_items").update(payload).eq("id",edit.id);if(error)throw error;setMessage(vi?"Đã cập nhật tài liệu.":"Document updated.")}
      else{const{error}=await supabase.from("data_items").insert({...payload,sort_order:items.filter(x=>x.collection_id===addCollection).length+1});if(error)throw error;setMessage(vi?"Đã thêm tài liệu mới trong nhóm bạn được cấp quyền thêm.":"A new document was added to an allowed group.")}
      setEdit(null);setTitle("");setDescription("");setUrl("");setFile(null);await load();
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setSaving(false)}
  }
  async function remove(item:Item){if(permissions[item.id]!=="full"){setMessage(vi?"Cần quyền Full để xóa mục này.":"Full permission is required to delete this item.");return}if(!confirm(vi?"Xóa mục dữ liệu này? File R2 gốc không bị xóa khỏi thư viện để tránh làm hỏng nơi khác đang dùng cùng ID.":"Delete this data item? The original R2 file will remain in the library to avoid breaking other references."))return;const{error}=await supabase.from("data_items").delete().eq("id",item.id);if(error)setMessage(error.message);else{setMessage(vi?"Đã xóa mục dữ liệu.":"Data item deleted.");load()}}

  if(loading)return <main><div className="container" style={{padding:"80px 0"}}>{vi?"Đang tải dữ liệu…":"Loading data…"}</div></main>;
  return <main>
    <section className={styles.hero}><div className="container"><p>DATA / ACCESS</p><h1>{vi?"Dữ liệu được cấp theo quyền.":"Permission-based data."}</h1><span>{vi?"Quyền Đọc = chỉ xem; Thêm = thêm tài liệu mới trong nhóm đã cấp; Full = xem, sửa và xóa mục được cấp.":"Read = view only; Add = add new documents to allowed groups; Full = view, edit and delete allowed items."}</span></div></section>
    <section className={`container ${styles.workspace}`}>
      {!logged?<div className={styles.loginWrap}><div className={styles.login}><span>PRIVATE / LOGIN</span><h2>{vi?"Đăng nhập để xem dữ liệu được cấp":"Sign in to view assigned data"}</h2><a href="/login" style={{padding:"13px",background:"var(--orange-500)",color:"#20120c",fontWeight:800,textAlign:"center",borderRadius:"7px"}}>{vi?"Đăng nhập":"Sign in"}</a></div></div>:<>
        <div className={styles.toolbar}><div><span>{items.length}</span><p>{vi?"mục bạn có thể xem":"visible items"}</p></div>{addableCollections.length?<button onClick={beginAdd}>{vi?"+ Thêm tài liệu":"+ Add document"}</button>:null}</div>
        {message?<p className={styles.notice}>{message}</p>:null}
        {addableCollections.length||edit?<form className={styles.editor} onSubmit={save}>
          <h2>{edit?(vi?"Sửa tài liệu (quyền Full)":"Edit document (Full permission)"):(vi?"Thêm tài liệu":"Add document")}</h2>
          <label>{vi?"Nhóm":"Group"} *<select value={addCollection} onChange={e=>setAddCollection(e.target.value)} disabled={!!edit}>{(edit?collections:addableCollections).map(c=><option key={c.id} value={c.id}>{vi?c.name_vi:(c.name_en||c.name_vi)}</option>)}</select></label>
          <label>{vi?"Tên tài liệu":"Document name"} *<input value={title} onChange={e=>setTitle(e.target.value)} required/></label>
          <label>{vi?"Mô tả":"Description"}<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></label>
          <label>{vi?"Nguồn":"Source"} *<select value={storage} onChange={e=>setStorage(e.target.value as "link"|"r2")}><option value="link">{vi?"Liên kết":"Link"}</option><option value="r2">{vi?"Tệp R2":"R2 file"}</option></select></label>
          {storage==="link"?<label>URL *<input type="url" value={url} onChange={e=>setUrl(e.target.value)} required/></label>:<label>{vi?"Tệp":"File"} {edit?.media_id?(vi?"(chọn file mới nếu muốn thay)":"(choose a new file to replace it)"):"*"}<input type="file" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>}
          <div className={styles.editorActions}><button type="button" onClick={()=>{setEdit(null);setTitle("");setDescription("")}}>{vi?"Hủy":"Cancel"}</button><button disabled={saving}>{saving?(vi?"Đang lưu…":"Saving…"):(vi?"Lưu":"Save")}</button></div>
        </form>:null}
        {!items.length?<p className={styles.empty}>{vi?"Chưa có dữ liệu được cấp.":"No assigned data."}</p>:<div className={styles.grid}>{items.map(item=>{const p=permissions[item.id]||"read";return <article className={styles.resource} key={item.id}><div><span>{item.storage_mode==="r2"?"R2":"LINK"}</span><i>{p.toUpperCase()}</i></div><h2>{vi?item.title_vi:(item.title_en||item.title_vi)}</h2><p>{vi?item.description_vi:(item.description_en||item.description_vi)}</p><div className={styles.resourceActions}><button onClick={()=>openItem(item)}>{vi?"Mở":"Open"} ↗</button>{p==="full"?<><button onClick={()=>beginEdit(item)}>{vi?"Sửa":"Edit"}</button><button onClick={()=>remove(item)}>{vi?"Xóa":"Delete"}</button></>:null}</div></article>})}</div>}
      </>}
    </section>
  </main>
}
