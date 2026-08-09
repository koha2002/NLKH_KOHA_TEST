import type { Metadata } from "next";
import { buildRouteMetadata } from "../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/software", { title:"Kho phần mềm", description:"Danh mục phần mềm, tiện ích và liên kết tải." }); }

export default function SoftwareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
