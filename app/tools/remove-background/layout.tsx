import type { Metadata } from "next";
import { enforceToolAccess } from "../../../lib/auth/tool-access";
import { buildRouteMetadata } from "../../../lib/public/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata("/tools/remove-background", {
    title: "Remove Background",
    description: "Tách nền ảnh trực tiếp trên trình duyệt. Ảnh không tải lên server để xử lý.",
  });
}

export default async function RemoveBackgroundLayout({ children }: { children: React.ReactNode }) {
  await enforceToolAccess("remove-background", "/tools/remove-background");
  return children;
}
