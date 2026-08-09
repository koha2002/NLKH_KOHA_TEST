import type { Metadata } from "next";
import { buildRouteMetadata } from "../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/tools", { title:"Công cụ", description:"Bộ công cụ làm việc và học tập của Nguyễn Lê Khánh Hòa." }); }
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
