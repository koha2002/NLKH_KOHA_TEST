import type { Metadata } from "next";
import { adminSoftwareItems } from "../../data/admin-generated";
import { buildMetadata } from "../../lib/admin-seo";

type SoftwareRow = {
  id?:string|null;
  slug?:string|null;
  name?:string|null;
  name_vi?:string|null;
  name_en?:string|null;
  title_vi?:string|null;
  title_en?:string|null;
  description_vi?:string|null;
  description_en?:string|null;
  version?:string|null;
  platform?:string|null;
  publisher?:string|null;
};

const items = (adminSoftwareItems as readonly SoftwareRow[]).filter(Boolean);

function appName(x:SoftwareRow){
  return x.name_vi || x.title_vi || x.name || x.name_en || x.title_en || x.slug || "Phần mềm";
}

function appDescription(x:SoftwareRow){
  return x.description_vi || x.description_en || "";
}

function compactNames(){
  const names = items.map(appName).filter(Boolean);
  if(!names.length) return "Kho phần mềm tải trực tiếp";
  return names.join(", ").slice(0,150);
}

export function generateMetadata(): Metadata {
  const names = compactNames();
  return buildMetadata("/software",{
    title:"Kho phần mềm tải trực tiếp",
    description:`Tải phần mềm và công cụ: ${names}. Danh sách cập nhật từ kho phần mềm Nguyễn Lê Khánh Hòa.`,
    index:true
  });
}

export default function SoftwareLayout({children}:{children:React.ReactNode}){
  const jsonLd = {
    "@context":"https://schema.org",
    "@type":"ItemList",
    "name":"Kho phần mềm Nguyễn Lê Khánh Hòa",
    "url":"https://nguyenlekhanhhoa.com/software",
    "numberOfItems":items.length,
    "itemListElement":items.map((x,index)=>({
      "@type":"ListItem",
      "position":index+1,
      "item":{
        "@type":"SoftwareApplication",
        "@id":`https://nguyenlekhanhhoa.com/software#${x.slug || x.id || index+1}`,
        "url":"https://nguyenlekhanhhoa.com/software",
        "name":appName(x),
        ...(appDescription(x)?{"description":appDescription(x)}:{}),
        ...(x.version?{"softwareVersion":x.version}:{}),
        ...(x.platform?{"operatingSystem":x.platform}:{})
      }
    }))
  };

  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}
    />
    {children}
  </>;
}