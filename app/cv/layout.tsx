import type { Metadata } from "next";
import { buildRouteMetadata } from "../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/cv", { title:"Hồ sơ năng lực", description:"Học vấn, chứng chỉ, kinh nghiệm và kỹ năng của kỹ sư điện Nguyễn Lê Khánh Hòa." }); }

export default function CvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
