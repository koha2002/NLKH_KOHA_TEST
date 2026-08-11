(function(){
'use strict';

const P={
"Chào mừng đến với ôn thi cùng Quiz":"Welcome to Quiz practice",
"Chọn một quiz để bắt đầu hoặc tạo quiz của riêng bạn.":"Choose a quiz to start or create your own.",
"Danh sách Quiz có sẵn":"Available quizzes",
"Nhập Quiz từ file":"Import Quiz from computer",
"Nhập Quiz từ máy":"Import Quiz from computer",
"Nhập Quiz từ dữ liệu":"Import Quiz from data",
"Chuyển đổi file từ Word":"Convert from Word",
"Tạo Quiz Mới":"Create New Quiz",
"Sẵn sàng chơi!":"Ready to play!",
"Nhập tên và chọn chế độ chơi.":"Enter your name and choose a game mode.",
"Nhập tên của bạn...":"Enter your name...",
"Chế độ chơi":"Game mode","Kiểm tra":"Test","Luyện tập":"Practice","Tùy chọn":"Options",
"Trộn câu hỏi":"Shuffle questions","Trộn đáp án":"Shuffle answers","Cài đặt thời gian":"Timer settings",
"Đếm ngược thời gian":"Countdown timer","giây":"seconds","phút":"minutes","/ câu":"/ question",
"Bắt đầu":"Start","Quay lại":"Back","Câu hỏi:":"Question:","Đúng:":"Correct:","Sai:":"Wrong:",
"Nộp bài":"Submit","Kết quả":"Results","Làm lại":"Try again","Về trang chủ":"Back to home",
"Hoàn thành!":"Completed!","Xem lại các câu sai từ lần đầu":"Review initially incorrect answers",
"Xuất file câu sai":"Export wrong answers",
"Tạo câu hỏi":"Create question","Tên bộ câu hỏi:":"Quiz title:","Thêm câu hỏi mới":"Add new question",
"Nội dung câu hỏi:":"Question content:","Ảnh minh họa câu hỏi (tùy chọn):":"Question image (optional):",
"Xem trước ảnh":"Image preview","Xóa ảnh":"Remove image","Các lựa chọn:":"Choices:",
"Một đáp án":"Single answer","Nhiều đáp án":"Multiple answers","Thêm câu hỏi này":"Add this question",
"Các câu hỏi đã thêm:":"Questions added:","Bổ sung từ file":"Import more from file",
"Hủy":"Cancel","Lưu và Tải về":"Save and download",
"Tùy chọn xuất tài liệu":"Export options","Xuất PDF":"Export PDF","Xuất Word (.docx)":"Export Word (.docx)",
"Xuất JSON":"Export JSON","Xuất toàn bộ (đánh dấu đáp án)":"Export all (mark answers)",
"Tất cả câu hỏi và lựa chọn. Đáp án đúng có dấu * và màu đỏ.":"All questions and choices. Correct answers are marked with * and red.",
"Xuất toàn bộ (không đánh dấu đáp án)":"Export all (without answers)",
"Tất cả câu hỏi và lựa chọn, không có đáp án. Dùng để làm đề kiểm tra.":"All questions and choices without answers. Suitable for a test.",
"Xuất câu hỏi và đáp án":"Export questions and answers",
"Chỉ có câu hỏi và đáp án đúng. Dùng làm tài liệu ôn tập nhanh.":"Questions and correct answers only, for quick review.",
"Xuất ngẫu nhiên":"Random export","Chọn ngẫu nhiên một số câu hỏi từ bộ đề.":"Choose a random subset of questions.",
"câu hỏi":"questions","Tiêu đề bộ câu hỏi":"Quiz title","Tải file .docx":"Upload .docx file",
"Xóa file đã chọn":"Clear selected file","Hoặc dán nội dung thô":"Or paste raw content",
"Xóa nội dung nhập tay":"Clear pasted content","Màu mẫu nhận diện đáp án đúng":"Reference color for correct answers",
"Hoặc chọn màu tùy chỉnh":"Or choose a custom color","Chuyển đổi":"Convert",
"Nhập vào danh sách quiz":"Import into quiz list","Đưa vào màn tạo quiz":"Load into quiz creator",
"Kết quả JSON":"JSON result","Sẵn sàng.":"Ready.","Chưa có dữ liệu.":"No data yet.",
"Đáp án:":"Answers:","Đáp án đúng nhận diện:":"Detected correct answers:",
"Đỏ đậm":"Dark red","Đỏ":"Red","Vàng cam":"Orange yellow","Xanh lá nhạt":"Light green",
"Xanh lá":"Green","Xanh da trời":"Sky blue","Xanh dương":"Blue","Xanh navy":"Navy","Tím":"Purple",
"Tự chọn bên dưới":"Custom below",
"Nếu không phát hiện đáp án đúng theo màu đã chọn, gán các đáp án là false":"If no correct answer is detected using the selected color, set answers to false"
};

const original=new WeakMap(),attrs=new WeakMap();
const qs=new URLSearchParams(location.search);
if(qs.get("lang")==="en"||qs.get("lang")==="vi")document.documentElement.lang=qs.get("lang");

function isEn(){return document.documentElement.lang==="en"}
function tr(s){
  if(typeof s!=="string")return s;
  const z=s.trim();
  if(P[z])return s.replace(z,P[z]);
  return s
    .replace(/^Câu (\d+)/,"Question $1")
    .replace(/(\d+) câu hỏi/g,"$1 questions")
    .replace(/^Lỗi khi đọc file\. Vui lòng kiểm tra lại file JSON\.$/,"Could not read the file. Check the JSON file.")
    .replace(/^Đã cập nhật quiz thành công!$/,"Quiz updated successfully!")
    .replace(/^Đã nhập quiz mới từ file Word: /,"Imported a new quiz from Word: ")
    .replace(/^Đã chuyển đổi (\d+) câu hỏi, nhận diện (\d+) đáp án đúng\.$/,"Converted $1 questions and detected $2 correct answers.")
    .replace(/^Đã chuyển đổi (\d+) câu hỏi từ nội dung nhập tay\.$/,"Converted $1 questions from pasted content.");
}

function ensureImportButtons(){
  const local=document.getElementById("import-quiz-btn");
  if(!local)return;

  local.dataset.nlkhManaged="1";
  const localHtml='<i class="fas fa-upload mr-2"></i><span>'+(isEn()?"Import Quiz from computer":"Nhập Quiz từ máy")+'</span>';
  if(local.innerHTML!==localHtml)local.innerHTML=localHtml;

  let data=document.getElementById("nlkh-import-data-btn");
  if(!data){
    data=document.createElement("button");
    data.id="nlkh-import-data-btn";
    data.type="button";
    data.className="btn bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 shadow-lg";
    data.dataset.nlkhManaged="1";
    data.addEventListener("click",()=>{
      window.parent.postMessage({type:"nlkh-quiz-data-picker-open"},window.location.origin);
    });
    local.parentNode.insertBefore(data,local);
  }
  const dataHtml='<i class="fas fa-database mr-2"></i><span>'+(isEn()?"Import Quiz from data":"Nhập Quiz từ dữ liệu")+'</span>';
  if(data.innerHTML!==dataHtml)data.innerHTML=dataHtml;
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
  const e=n;
  if(e.dataset?.nlkhManaged==="1")return;
  if(!attrs.has(e)){
    const o={};
    ["placeholder","title","aria-label","alt"].forEach(a=>{if(e.hasAttribute(a))o[a]=e.getAttribute(a)});
    attrs.set(e,o);
  }
  Object.entries(attrs.get(e)).forEach(([a,v])=>{
    const next=useEn?tr(v):v;
    if(e.getAttribute(a)!==next)e.setAttribute(a,next);
  });
  [...e.childNodes].forEach(x=>walk(x,useEn));
}

function isManagedNode(n){
  if(!n)return false;
  const el=n.nodeType===1?n:n.parentElement;
  return el?.dataset?.nlkhManaged==="1"||!!el?.closest?.("[data-nlkh-managed]");
}

let queued=false,applying=false;
function apply(){
  if(queued||applying)return;
  queued=true;
  queueMicrotask(()=>{
    queued=false;
    applying=true;
    try{
      ensureImportButtons();
      if(document.body)walk(document.body,isEn());
    }finally{
      applying=false;
    }
  });
}

const oldAlert=window.alert;
window.alert=function(m){return oldAlert(isEn()?tr(String(m)):m)};
const oldConfirm=window.confirm;
window.confirm=function(m){return oldConfirm(isEn()?tr(String(m)):m)};

new MutationObserver(m=>{
  if(applying)return;
  const langChanged=m.some(x=>x.type==="attributes"&&x.attributeName==="lang");
  const domChanged=m.some(x=>x.type==="childList"&&!isManagedNode(x.target));
  if(langChanged||domChanged)apply();
}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"],childList:true,subtree:true});

window.addEventListener("load",apply);
apply();
})();