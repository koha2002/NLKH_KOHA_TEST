import { enforceToolAccess } from "../../../lib/auth/tool-access";
import type { Metadata } from "next";
import { buildRouteMetadata } from "../../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> { return buildRouteMetadata("/tools/quiz", { title:"Ôn thi & tạo đề", description:"Tạo, nhập, chỉnh sửa và luyện đề ngay trên trình duyệt." }); }

export default async function QuizLayout({ children }: { children: React.ReactNode }) {
  await enforceToolAccess("quiz", "/tools/quiz");
  return children;
}
