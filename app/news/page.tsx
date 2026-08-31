import {
  adminNewsCategories,
  adminNewsList,
} from "../../data/admin-generated";
import {
  NewsPageClient,
  type NewsArticle,
  type NewsCategory,
} from "../../components/NewsPageClient";

export default function NewsPage(){
  return (
    <NewsPageClient
      articles={adminNewsList as unknown as readonly NewsArticle[]}
      categories={adminNewsCategories as unknown as readonly NewsCategory[]}
    />
  );
}