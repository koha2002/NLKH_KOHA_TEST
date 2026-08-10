import { jsonLdFor } from "../lib/admin-seo";
export function AdminSeoJsonLd({route}:{route:string}){
  const data=jsonLdFor(route);if(!data)return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/>;
}
