import React,{useEffect,useMemo,useState}from"react";
import{assetCode,deleteAsset,getAsset,getAssetPreviewUrl,listAssets,replaceR2Asset,uploadToR2}from"../lib/media";

function AssetPreview({asset,compact=false}) {
  const[preview,setPreview]=useState("");
  const isImage=(asset?.mime_type||"").startsWith("image/");
  useEffect(()=>{
    let alive=true;setPreview("");
    if(asset&&isImage)getAssetPreviewUrl(asset).then(u=>alive&&setPreview(u)).catch(()=>{});
    return()=>{alive=false};
  },[asset?.id,asset?.public_url,asset?.object_key]);
  if(!asset) return <div className="assetEmpty">Chưa chọn tệp</div>;
  return <div className={`assetPreview ${compact?"compact":""}`}>
    <div className="assetThumb">
      {isImage && preview ? <img src={preview} alt={asset.alt_vi||asset.original_name}/> : <span>{(asset.mime_type||"FILE").split("/").pop()?.toUpperCase()}</span>}
    </div>
    <div className="assetMeta">
      <strong>{assetCode(asset.asset_no)}</strong>
      <span>{asset.original_name}</span>
      <small>ID DB: {asset.id}</small>
      <small>R2: {asset.object_key}</small>
    </div>
  </div>
}

export default function MediaPicker({
  value,onChange,kind="image",visibility="public",label="Tệp",help="",required=false,
  onMirrorUrl,uploadedFrom="admin",itemId=null,collectionId=null
}) {
  const[current,setCurrent]=useState(null),[open,setOpen]=useState(false),[assets,setAssets]=useState([]),
    [q,setQ]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[info,setInfo]=useState("");

  useEffect(()=>{value?getAsset(value).then(setCurrent).catch(e=>setError(e.message)):setCurrent(null)},[value]);

  async function refresh(){try{setAssets(await listAssets(kind))}catch(e){setError(e.message)}}
  useEffect(()=>{if(open)refresh()},[open,kind]);

  const filtered=useMemo(()=>assets.filter(a=>a.visibility===visibility&&`${assetCode(a.asset_no)} ${a.original_name} ${a.title} ${a.object_key}`.toLowerCase().includes(q.toLowerCase())),[assets,q,visibility]);

  async function upload(file){
    if(!file)return;
    try{
      setBusy(true);setError("");setInfo("");
      const asset=await uploadToR2(file,{visibility,folder:kind==="image"?"images":kind==="pdf"?"cv":"files",usageNote:label,uploadedFrom,itemId,collectionId});
      setCurrent(asset);onChange(asset.id);onMirrorUrl?.(asset.public_url||"");
      setInfo(asset._deduplicated?`File giống hệt đã có. Hệ thống dùng lại ${assetCode(asset.asset_no)} nên không tăng dung lượng R2.`:`Đã tải lên và gán ID ${assetCode(asset.asset_no)}.`);
      await refresh();
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  async function replaceSameId(file){
    if(!file||!current)return;
    const usageWarn="Thay file nhưng giữ nguyên ID sẽ cập nhật nội dung ở TẤT CẢ nơi đang dùng ID này. Nếu chỉ muốn đổi riêng mục hiện tại, hãy dùng ‘Tải tệp mới’ hoặc ‘Chọn từ thư viện’.";
    if(!confirm(`${usageWarn}\n\nTiếp tục với ${assetCode(current.asset_no)}?`))return;
    try{
      setBusy(true);setError("");setInfo("");
      const asset=await replaceR2Asset(current.id,file);
      setCurrent(asset);onChange(asset.id);onMirrorUrl?.(asset.public_url||"");
      if(asset._replacedByExisting)setInfo(`Nội dung này đã tồn tại ở ${assetCode(asset.asset_no)}. Hệ thống chuyển mục hiện tại sang ID đó để tránh lưu trùng.`);
      else setInfo(`Đã thay file bên trong ${assetCode(asset.asset_no)} và giữ nguyên ID. Mọi nơi dùng ID này nhận file mới.`);
      await refresh();
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  function choose(a){setCurrent(a);onChange(a.id);onMirrorUrl?.(a.public_url||"");setInfo(`Đã chọn ${assetCode(a.asset_no)} từ thư viện; không upload thêm bản trùng.`);setOpen(false)}
  function detach(){setCurrent(null);onChange("");onMirrorUrl?.("");setInfo("Đã bỏ liên kết khỏi mục này; file vẫn còn trong Thư viện R2 để dùng lại.")}

  async function removeFromR2(a){
    if(!confirm(`Xóa ${assetCode(a.asset_no)} khỏi R2? Hệ thống sẽ chặn nếu tệp đang được dùng.`))return;
    try{
      setBusy(true);setError("");setInfo("");
      await deleteAsset(a.id,false);
      if(value===a.id)detach();
      setInfo(`Đã xóa ${assetCode(a.asset_no)} khỏi R2. ID này không được tái sử dụng.`);
      await refresh();
    }catch(e){
      const ok=confirm(`${e.message}\n\nNếu bạn chắc chắn muốn xóa bắt buộc, hệ thống sẽ gỡ các liên kết đang dùng ID này. Bấm OK để tiếp tục.`);
      if(ok){try{await deleteAsset(a.id,true);if(value===a.id)detach();setInfo(`Đã xóa bắt buộc ${assetCode(a.asset_no)} và gỡ các liên kết.`);await refresh()}catch(x){setError(x.message)}}
    }finally{setBusy(false)}
  }

  const accept=kind==="image"?"image/*":kind==="pdf"?"application/pdf":"*/*";
  const helpText=help||"Tải file trực tiếp lên Cloudflare R2 hoặc chọn ID đã có. ID dạng R2-000001 tăng tự động và tồn tại sau khi đăng xuất/đăng nhập.";
  return <div className="mediaField">
    <div className="fieldLabel"><span>{label}{required&&<b className="requiredMark">*</b>}</span><button className="helpDot" type="button" title={helpText}>?</button></div>
    <AssetPreview asset={current}/>
    <div className="mediaActions">
      <label className="miniButton uploadButton">{busy?"Đang tải…":"Tải tệp mới"}<input type="file" hidden accept={accept} disabled={busy} onChange={e=>{upload(e.target.files?.[0]);e.target.value=""}}/></label>
      {current&&<label className="miniButton uploadButton">Thay file, giữ ID<input type="file" hidden accept={accept} disabled={busy} onChange={e=>{replaceSameId(e.target.files?.[0]);e.target.value=""}}/></label>}
      <button type="button" className="miniButton" onClick={()=>setOpen(true)}>Chọn / xem thư viện R2</button>
      {current&&<button type="button" className="miniButton dangerText" onClick={detach}>Bỏ khỏi mục này</button>}
      {current&&<button type="button" className="miniButton dangerText" onClick={()=>removeFromR2(current)}>Xóa ID khỏi R2</button>}
    </div>
    <small className="fieldHelp">{helpText}</small>
    {info&&<div className="fieldInfo">{info}</div>}
    {error&&<div className="fieldError">{error}</div>}

    {open&&<div className="modal assetModal">
      <div className="assetLibrary">
        <div className="editorHead"><div><h2>Thư viện R2</h2><small>Chỉ hiện file có cùng mức quyền với trường này ({visibility}). Chọn ID cũ để tái sử dụng; tìm bằng R2-000123, tên file hoặc object key.</small></div><button type="button" onClick={()=>setOpen(false)}>✕</button></div>
        <input className="assetSearch" value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm ID R2, tên tệp hoặc đường dẫn R2…"/>
        <div className="assetGrid">
          {filtered.map(a=><div className="assetCard" key={a.id}>
            <button type="button" className="assetChoose" onClick={()=>choose(a)}><AssetPreview asset={a} compact/></button>
            <button type="button" className="assetDelete" onClick={()=>removeFromR2(a)}>Xóa khỏi R2</button>
          </div>)}
          {!filtered.length&&<p className="emptyState">Chưa có tệp phù hợp.</p>}
        </div>
      </div>
    </div>}
  </div>
}
