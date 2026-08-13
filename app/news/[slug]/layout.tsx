import type { ReactNode } from "react";
import { adminNewsArticles, adminSite } from "../../../data/admin-generated";

type ArticleRow = {
  slug:string;
  title_vi?:string;
  title_en?:string;
  excerpt_vi?:string;
  excerpt_en?:string;
  cover_image?:string;
  cover_alt_vi?:string;
  author_name?:string;
  editor_name?:string;
  source_name?:string;
  source_url?:string;
  tags?:string[];
  published_at?:string | null;
  updated_at?:string;
};

function absoluteUrl(path:string){
  const configured = String((adminSite as any)?.site_url || "https://nguyenlekhanhhoa.com").replace(/\/+$/,"");
  return `${configured}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function NewsArticleSeoLayout({
  children,
  params,
}:{
  children:ReactNode;
  params:Promise<{slug:string}>;
}){
  const {slug}=await params;
  const article=(adminNewsArticles as readonly ArticleRow[]).find((x)=>x.slug===slug);

  if(!article) return <>{children}</>;

  const url=absoluteUrl(`/news/${slug}`);
  const image=article.cover_image
    ? (/^https?:\/\//i.test(article.cover_image) ? article.cover_image : absoluteUrl(article.cover_image))
    : undefined;

  const jsonLd:any={
    "@context":"https://schema.org",
    "@type":"NewsArticle",
    "@id":`${url}#article`,
    "mainEntityOfPage":{"@type":"WebPage","@id":url},
    "url":url,
    "headline":article.title_vi || article.title_en || slug,
    "description":article.excerpt_vi || article.excerpt_en || undefined,
    "datePublished":article.published_at || undefined,
    "dateModified":article.updated_at || article.published_at || undefined,
    "author":{
      "@type":"Person",
      "name":article.author_name || "NLKH Technology"
    },
    "publisher":{
      "@type":"Organization",
      "name":String((adminSite as any)?.site_name || "NLKH Technology"),
      "url":String((adminSite as any)?.site_url || "https://nguyenlekhanhhoa.com")
    },
    "keywords":Array.isArray(article.tags) ? article.tags.join(", ") : undefined,
    ...(image ? {"image":[image]} : {}),
    ...(article.source_name || article.source_url ? {
      "citation":[{
        "@type":"CreativeWork",
        ...(article.source_name?{"name":article.source_name}:{}),
        ...(article.source_url?{"url":article.source_url}:{})
      }]
    } : {})
  };

  // Remove undefined keys before outputting JSON-LD.
  const clean=JSON.parse(JSON.stringify(jsonLd));

  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html:JSON.stringify(clean).replace(/</g,"\\u003c")}}
    />
    {children}
  </>;
}
