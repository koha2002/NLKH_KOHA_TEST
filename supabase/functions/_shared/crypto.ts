const enc=new TextEncoder(),dec=new TextDecoder();
function b64(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(s:string){const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function getKey(){
  const secret=Deno.env.get("INTEGRATION_SECRETS_KEY");
  if(!secret||secret.length<32)throw new Error("INTEGRATION_SECRETS_KEY phải >= 32 ký tự");
  const digest=await crypto.subtle.digest("SHA-256",enc.encode(secret));
  return crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
export async function encryptSecret(value:string){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const out=await crypto.subtle.encrypt({name:"AES-GCM",iv},await getKey(),enc.encode(value));
  return`v1.${b64(iv)}.${b64(new Uint8Array(out))}`;
}
export async function decryptSecret(value:string){
  const[ver,iv,cipher]=value.split(".");
  if(ver!=="v1"||!iv||!cipher)throw new Error("Ciphertext format invalid");
  const out=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(iv)},await getKey(),unb64(cipher));
  return dec.decode(out);
}
