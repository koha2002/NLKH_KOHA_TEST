(function(){
'use strict';

const P={
"Xử lý tài liệu":"Process documents",
"nhanh và rõ ràng.":"quickly and clearly.",
"Chọn công cụ, thêm tệp và tải kết quả. Toàn bộ chức năng cũ được giữ nguyên trong một giao diện mới dễ sử dụng hơn.":"Choose a tool, add files, and download the result. Existing functions are kept in a cleaner workspace.",
"Công cụ PDF & ảnh":"PDF & image tools",
"Không gian thống nhất":"Unified workspace",
"Nén PDF":"Compress PDF","Gộp PDF":"Merge PDF","Tách PDF":"Split PDF",
"Word → PDF":"Word → PDF","PDF → JPG":"PDF → JPG","Ảnh → PDF":"Image → PDF",
"Đóng dấu":"Watermark","Sửa PDF":"Repair PDF","Thiết lập tác vụ":"Task setup",
"Chọn trong toàn bộ công cụ":"Choose a tool",
"Mở khóa PDF":"Unlock PDF","Bảo vệ PDF":"Protect PDF","Xoay PDF":"Rotate PDF",
"Đóng dấu PDF":"Watermark PDF","PDF sang PDF/A":"PDF to PDF/A","Word sang PDF":"Word to PDF",
"PowerPoint sang PDF":"PowerPoint to PDF","Excel sang PDF":"Excel to PDF","PDF sang JPG":"PDF to JPG",
"Ảnh sang PDF":"Image to PDF","Đánh số trang":"Page numbers","Trích xuất dữ liệu":"Extract data",
"Sửa chữa PDF":"Repair PDF","Nén ảnh":"Compress image","Thay đổi kích thước ảnh":"Resize image",
"Cắt ảnh":"Crop image","Xoay ảnh":"Rotate image","Chuyển đổi định dạng ảnh":"Convert image format",
"Đóng dấu ảnh":"Watermark image","Xóa nền ảnh":"Remove image background",
"Kéo thả tệp hoặc nhấn để chọn":"Drop files here or click to choose",
"Định dạng cho phép sẽ thay đổi theo công cụ":"Allowed formats depend on the selected tool",
"Chưa có tệp nào được chọn":"No files selected","Xóa tất cả":"Clear all","Bắt đầu xử lý":"Start processing",
"Tệp & xem trước":"Files & preview","Dữ liệu phiên hiện tại":"Current session data",
"Không gian làm việc đang trống":"Workspace is empty",
"Chọn một hoặc nhiều tệp ở bảng bên trái. Tệp ảnh hỗ trợ sẽ được xem trước trực tiếp tại đây.":"Choose one or more files on the left. Supported images can be previewed here.",
"Các tệp đã chọn":"Selected files","Kéo để sắp xếp":"Drag to reorder","Xử lý thành công":"Processing completed",
"Tệp kết quả đã sẵn sàng để tải xuống.":"Your result is ready to download.","Tải tệp":"Download",
"Chế độ xử lý":"Processing mode","Trang cần xóa":"Pages to delete","Thứ tự trang mới":"New page order",
"Mức độ nén":"Compression level","Nén thấp (chất lượng cao)":"Low compression (high quality)",
"Khuyến nghị":"Recommended","Nén cao (kích thước nhỏ)":"High compression (small size)",
"Mật khẩu":"Password","Góc xoay":"Rotation","Loại dấu":"Watermark type","Văn bản":"Text","Hình ảnh":"Image",
"Nội dung":"Content","Tệp ảnh dấu":"Watermark image","Vị trí":"Position","Độ trong suốt":"Opacity",
"Cỡ chữ":"Font size","Màu chữ":"Text color","Kích thước ảnh dấu (%)":"Watermark image size (%)",
"Giữa":"Center","Trên-Trái":"Top-left","Trên-Phải":"Top-right","Dưới-Trái":"Bottom-left","Dưới-Phải":"Bottom-right",
"Tách theo trang":"Split by pages","Nhập trang hoặc khoảng trang cần tách.":"Enter pages or page ranges to split.",
"Chuyển sang định dạng":"Convert to format","Giữ nguyên tỷ lệ":"Keep aspect ratio",
"Xử lý Offline thành công — tệp chỉ được xử lý trên thiết bị này.":"Offline processing completed — the file stayed on this device.",
"Offline xử lý trực tiếp trên thiết bị và không đưa tài liệu lên Internet. Online sử dụng Internet/server cho các tác vụ cần xử lý phía máy chủ.":"Offline processes files on this device without sending documents to the Internet. Online uses the Internet/server for tasks that require server-side processing.",
"xử lý tại máy, tài liệu không được đưa lên Internet.":"processes on this device; documents are not sent to the Internet.",
"xử lý qua Internet/server.":"processes through the Internet/server.",
"Đang xử lý hoàn toàn trên máy…":"Processing entirely on this device…",
"Đã chọn tệp. Sẵn sàng để xử lý.":"File selected. Ready to process.",
"Vui lòng chọn ít nhất một tệp.":"Please select at least one file.",
"Xóa trang PDF (Offline)":"Delete PDF pages (Offline)",
"Sắp xếp trang PDF (Offline)":"Reorder PDF pages (Offline)"
};

const original=new WeakMap(),attrs=new WeakMap();
const qs=new URLSearchParams(location.search);
if(qs.get("lang")==="en"||qs.get("lang")==="vi")document.documentElement.lang=qs.get("lang");

function en(){return document.documentElement.lang==="en"}
function tr(s){
  if(typeof s!=="string")return s;
  const z=s.trim();
  if(P[z])return s.replace(z,P[z]);
  return s
    .replace(/^(\d+) tệp đã được chọn$/,"$1 files selected")
    .replace(/^Tải: /,"Download: ")
    .replace(/^Lỗi: /,"Error: ")
    .replace(/^Đang tải lên tệp (\d+)\/(\d+)/,"Uploading file $1/$2")
    .replace(/^Đã tải kết quả Offline\.$/,"Offline result downloaded.");
}
function walk(n,useEn){
  if(n.nodeType===3){
    if(!original.has(n))original.set(n,n.nodeValue);
    const base=original.get(n);
    const next=useEn?tr(base):base;
    if(n.nodeValue!==next)n.nodeValue=next;
    return;
  }
  if(n.nodeType!==1)return;
  const el=n;
  if(!attrs.has(el)){
    const o={};
    ["placeholder","title","aria-label"].forEach(a=>{if(el.hasAttribute(a))o[a]=el.getAttribute(a)});
    attrs.set(el,o);
  }
  Object.entries(attrs.get(el)).forEach(([a,v])=>{
    const next=useEn?tr(v):v;
    if(el.getAttribute(a)!==next)el.setAttribute(a,next);
  });
  [...el.childNodes].forEach(x=>walk(x,useEn));
}
let queued=false;
function apply(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{
    queued=false;
    if(document.body)walk(document.body,en());
  });
}
new MutationObserver(m=>{
  if(m.some(x=>x.type==="attributes"&&x.attributeName==="lang")||m.some(x=>x.type==="childList"))apply();
}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"],childList:true,subtree:true});

window.addEventListener("load",apply);
apply();
})();