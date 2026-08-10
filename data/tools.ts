import { adminTools } from "./admin-generated";

export type ToolItem = {
  id: string;
  href: string;
  code: string;
  title: { vi: string; en: string };
  description: { vi: string; en: string };
  status: "ready" | "online" | string;
  requiresAuth?: boolean;
  allowedRoles?: readonly string[];
  hasInlineHtml?: boolean;
};

export const tools: ToolItem[] = adminTools.map((tool) => ({
  id: tool.id, href: tool.href, code: tool.code, title: tool.title, description: tool.description,
  status: tool.status, requiresAuth: tool.requiresAuth, allowedRoles: tool.allowedRoles, hasInlineHtml: tool.hasInlineHtml,
}));
