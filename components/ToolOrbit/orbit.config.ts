import type { FeatureIconName } from "../FeatureIcon";
import { adminOrbitRings, adminTools } from "../../data/admin-generated";

export type OrbitTone = "blue" | "cyan" | "orange" | "violet";
export type OrbitRing = { id:string; size:number; duration:number; reverse?:boolean; dashed?:boolean; dot?:{angle:number;tone:OrbitTone} };
export type OrbitItem = { id:string; href:string; label:string; icon?:FeatureIconName; image?:string; ring:string; angle:number; tone:OrbitTone; title:{vi:string;en:string} };

const knownIcons=new Set<FeatureIconName>(["profile","quiz","pdf","comtrade","software","data"]);
const tone=(v?:string):OrbitTone=>{
  if(["blue","cyan","orange","violet"].includes(String(v)))return v as OrbitTone;
  const m=String(v||"").match(/^#([0-9a-f]{6})$/i);if(!m)return"blue";
  const n=parseInt(m[1],16),rgb=[(n>>16)&255,(n>>8)&255,n&255];
  const choices:{name:OrbitTone;rgb:number[]}[]=[
    {name:"blue",rgb:[37,99,235]},{name:"cyan",rgb:[6,182,212]},{name:"orange",rgb:[249,115,22]},{name:"violet",rgb:[139,92,246]}
  ];
  return choices.sort((a,b)=>a.rgb.reduce((t,x,i)=>t+(x-rgb[i])**2,0)-b.rgb.reduce((t,x,i)=>t+(x-rgb[i])**2,0))[0].name;
};

export const orbitRings: OrbitRing[] = adminOrbitRings.length ? adminOrbitRings.map((r)=>({
  id:r.id,size:r.size,duration:r.duration,reverse:r.reverse,dashed:r.dashed,
  ...(r.dotAngle==null?{}:{dot:{angle:Number(r.dotAngle),tone:tone(r.dotTone)}}),
})) : [
  {id:"ring-1",size:98,duration:42,dashed:true,dot:{angle:166,tone:"blue"}},
  {id:"ring-2",size:82,duration:34,reverse:true,dot:{angle:22,tone:"orange"}},
  {id:"ring-3",size:66,duration:28,dot:{angle:205,tone:"cyan"}},
];

const ringId=(n:number)=>orbitRings[Math.max(0,Math.min((n||1)-1,orbitRings.length-1))]?.id||orbitRings[0]?.id||"ring-1";

export const orbitItems: OrbitItem[] = [
  ...adminTools.filter((tool)=>tool.showOrbit).map((tool)=>{
    const iconValue=String(tool.icon||""),isKnown=knownIcons.has(iconValue as FeatureIconName);
    return {id:tool.id,href:tool.href,label:tool.code,...(isKnown?{icon:iconValue as FeatureIconName}:iconValue?{image:iconValue}:{}),
      ring:ringId(tool.orbitRing),angle:Number(tool.orbitAngle||0),tone:tone(tool.accent),title:tool.title};
  }),
  {id:"profile",href:"/cv",label:"CV",icon:"profile",ring:ringId(2),angle:142,tone:"orange",title:{vi:"Hồ sơ năng lực",en:"Professional profile"}},
  {id:"software",href:"/software",label:"APP",icon:"software",ring:ringId(3),angle:18,tone:"cyan",title:{vi:"Kho phần mềm",en:"Software library"}},
  {id:"data",href:"/data",label:"DATA",icon:"data",ring:ringId(1),angle:35,tone:"blue",title:{vi:"Dữ liệu",en:"Data"}},
];
