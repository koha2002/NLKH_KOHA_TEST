import {
  adminNewsArticles,
  adminNewsCategories,
} from "../../data/admin-generated";
import { NewsPageClient } from "../../components/NewsPageClient";

export default function NewsPage(){
  return (
    <NewsPageClient
      articles={adminNewsArticles as unknown as any[]}
      categories={adminNewsCategories as unknown as any[]}
    />
  );
}