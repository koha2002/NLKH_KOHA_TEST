import type { FeatureIconName } from "../components/FeatureIcon";
import { adminTools } from "./admin-generated";

export type HomeProduct = {
  href: string; label: string; icon?: FeatureIconName; image?: string;
  color: "orange" | "cyan" | "blue"; title: { vi: string; en: string }; description: { vi: string; en: string };
};

const knownIcons = new Set<FeatureIconName>(["profile","quiz","pdf","comtrade","software","data"]);
const tone = (value?: string): HomeProduct["color"] => {
  if (value === "orange" || value === "cyan" || value === "blue") return value;
  const m=String(value||"").match(/^#([0-9a-f]{6})$/i); if(!m)return"blue";
  const n=parseInt(m[1],16),rgb=[(n>>16)&255,(n>>8)&255,n&255];
  const choices:{name:HomeProduct["color"];rgb:number[]}[]=[
    {name:"orange",rgb:[249,115,22]},{name:"cyan",rgb:[6,182,212]},{name:"blue",rgb:[37,99,235]}
  ];
  return choices.sort((a,b)=>a.rgb.reduce((t,x,i)=>t+(x-rgb[i])**2,0)-b.rgb.reduce((t,x,i)=>t+(x-rgb[i])**2,0))[0].name;
};

const core: HomeProduct[] = [{
  href:"/cv",label:"CV",icon:"profile",color:"orange",
  title:{vi:"Hồ sơ năng lực",en:"Professional profile"},
  description:{vi:"Học vấn, chứng chỉ, kinh nghiệm và kỹ năng chuyên môn.",en:"Education, certificates, experience and professional skills."},
}];

const toolProducts: HomeProduct[] = adminTools.filter((tool)=>tool.showHome).map((tool)=>{
  const iconValue=String(tool.icon||""), isKnown=knownIcons.has(iconValue as FeatureIconName);
  return {
    href:tool.href,label:tool.code,...(isKnown?{icon:iconValue as FeatureIconName}:iconValue?{image:iconValue}:{}),
    color:tone(tool.accent),title:tool.title,description:tool.description,
  };
});

const tail: HomeProduct[] = [
  {href:"/software",label:"APP",icon:"software",color:"cyan",title:{vi:"Kho phần mềm",en:"Software library"},description:{vi:"Kho phần mềm có tìm kiếm, phân loại, logo và liên kết tải.",en:"A searchable software library with categories, logos and download links."}},
  {href:"/data",label:"DATA",icon:"data",color:"blue",title:{vi:"Dữ liệu",en:"Data"},description:{vi:"Tài liệu và liên kết được cấp riêng theo từng tài khoản.",en:"Documents and links assigned to each account."}},
];

export const homeProducts: HomeProduct[] = [...core,...toolProducts,...tail];
