import type { Metadata } from "next";
import { buildRouteMetadata } from "../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/data", { title:"Dữ liệu", description:"Tài liệu, dữ liệu học tập và liên kết được chia sẻ theo quyền truy cập." }); }
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
