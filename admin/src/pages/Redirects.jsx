import React,{useState}from"react";import TableManager from"../components/TableManager";import{AdminPage}from"./_shared";import{f}from"../schema";import{invoke}from"../lib/supabase";import{notify}from"../lib/notify";
const hosts=[
 {value:"nguyenlekhanhhoa.com",label:"nguyenlekhanhhoa.com — miền chính"},
 {value:"koha.io.vn",label:"koha.io.vn — miền cũ"},
 {value:"nguyenlekhanhhoa.name.vn",label:"nguyenlekhanhhoa.name.vn — miền cũ"},
];
export default function Redirects({access}){const[syncing,setSyncing]=useState(false);async function sync(){if(!confirm("Đồng bộ TOÀN BỘ redirect đang Kích hoạt lên Cloudflare Bulk Redirects?"))return;setSyncing(true);try{const r=await invoke("cloudflare-redirect-sync",{action:"sync"});notify(r.message||"Đã đồng bộ Cloudflare.","success",6000)}catch(e){notify(e.message||String(e),"error",9000)}finally{setSyncing(false)}}return <AdminPage access={access}><section className="adminSection"><div className="sectionHead"><div><p className="eyebrow">EDGE / REDIRECT</p><h1>Redirect đa miền</h1><p>Quản lý redirect giữa 3 miền ngay trong Admin. Sau khi Lưu, bấm <b>Đồng bộ Cloudflare</b>; không cần Publish frontend cho redirect đa miền.</p></div><button onClick={sync} disabled={syncing}>{syncing?"Đang đồng bộ…":"Đồng bộ Cloudflare"}</button></div><div className="notice"><b>Ví dụ chuyển toàn bộ koha.io.vn → nguyenlekhanhhoa.com:</b> Miền nguồn = koha.io.vn · Path = / · Đích = https://nguyenlekhanhhoa.com/ · bật “Khớp mọi path con” + “Giữ phần path phía sau” + “Giữ query”. Dùng 301.</div></section><TableManager title="Danh sách Redirect" description="Same-domain path vẫn có thể tạo fallback static khi build. Redirect giữa các miền được đồng bộ thật tại Cloudflare Edge và trả HTTP 301/302/307/308." table="redirects" orderBy="source_host" ascending defaults={{source_host:"nguyenlekhanhhoa.com",source_path:"/",status_code:301,active:true,preserve_query:true,include_subdomains:true,subpath_matching:false,preserve_path_suffix:false}} fields={[
 f.sel("source_host","Miền nguồn",hosts,{required:true,help:"Chọn một trong 3 miền bạn sở hữu. www và subdomain có thể bao phủ bằng tùy chọn Include subdomains."}),
 f.text("source_path","Đường dẫn nguồn",{required:true,placeholder:"/ hoặc /cv-cu",help:"/ = gốc miền. Muốn chuyển cả miền, dùng / và bật Khớp mọi path con + Giữ phần path phía sau."}),
 f.url("target_url","Chuyển tới",{required:true,placeholder:"https://nguyenlekhanhhoa.com/",help:"Redirect đa miền nên dùng URL đầy đủ https://...; path tương đối vẫn được Cloudflare sync về miền chính."}),
 f.sel("status_code","Loại redirect",[{value:301,label:"301 — vĩnh viễn, nên dùng khi đổi miền/SEO"},{value:302,label:"302 — tạm thời"},{value:307,label:"307 — tạm thời, giữ HTTP method"},{value:308,label:"308 — vĩnh viễn, giữ HTTP method"}],{required:true}),
 f.bool("active","Kích hoạt",{trueLabel:"Redirect đang hoạt động"}),
 f.bool("include_subdomains","Bao gồm subdomain",{trueLabel:"Áp dụng cả www/subdomain phù hợp",help:"Hữu ích khi muốn www.koha.io.vn cũng chuyển."}),
 f.bool("subpath_matching","Khớp mọi path con",{trueLabel:"Khớp cả URL nằm dưới path nguồn",help:"Ví dụ nguồn / + bật = /abc, /tools/pdf… cũng khớp."}),
 f.bool("preserve_path_suffix","Giữ phần path phía sau",{trueLabel:"Giữ suffix path khi chuyển",help:"Ví dụ koha.io.vn/tools/pdf → nguyenlekhanhhoa.com/tools/pdf nếu target là root và bật tùy chọn này."}),
 f.bool("preserve_query","Giữ query string",{trueLabel:"Giữ các tham số sau dấu ?"}),
 f.area("note","Ghi chú nội bộ",{placeholder:"Ví dụ: chuyển miền cũ sang .com"})
 ]}/></AdminPage>}
