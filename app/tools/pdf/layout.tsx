import type { Metadata } from "next";
import { enforceToolAccess } from "../../../lib/auth/tool-access";
import { buildRouteMetadata } from "../../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/tools/pdf", { title:"Công cụ PDF", description:"Bộ công cụ PDF và hình ảnh chạy cục bộ trên thiết bị." }); }

export default async function PdfLayout({ children }: { children: React.ReactNode }) {
  await enforceToolAccess("pdf", "/tools/pdf");
  return children;
}
