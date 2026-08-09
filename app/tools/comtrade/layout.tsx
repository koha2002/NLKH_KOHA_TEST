import { enforceToolAccess } from "../../../lib/auth/tool-access";
import type { Metadata } from "next";
import { buildRouteMetadata } from "../../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/tools/comtrade", { title:"COMTRADE", description:"Đọc CFG/DAT và biểu diễn kênh analog, digital trực tiếp trong trình duyệt." }); }

export default async function ComtradeLayout({ children }: { children: React.ReactNode }) {
  await enforceToolAccess("comtrade", "/tools/comtrade");
  return children;
}
