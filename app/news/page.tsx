import type { Metadata } from "next";
import { NewsIndex } from "../../components/NewsIndex";

export const metadata: Metadata = { title: "Tin tức", description: "Tin tức, ghi chép và kiến thức của Nguyễn Lê Khánh Hòa." };
export default function NewsPage() { return <main><NewsIndex /></main>; }
