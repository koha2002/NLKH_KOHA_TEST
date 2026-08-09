import type { Metadata } from "next";
import { buildRouteMetadata } from "../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/news", { title:"Tin tức & bài viết", description:"Tin tức, ghi chép kỹ thuật và nội dung chuyên môn được tuyển chọn." }); }
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
