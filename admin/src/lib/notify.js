export function notify(message,type="success",duration=3200){
  if(typeof window==="undefined")return;
  window.dispatchEvent(new CustomEvent("nlkh:admin-toast",{detail:{message:String(message||""),type,duration}}));
}
