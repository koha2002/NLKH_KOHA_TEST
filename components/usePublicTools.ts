"use client";

import { adminOrbitRings, adminTools } from "../data/admin-generated";

export type PublicTool = {
  id: string;
  slug: string;
  code: string;
  route: string;
  title_vi: string;
  title_en: string;
  description_vi: string;
  description_en: string;
  icon?: string | null;
  accent: string;
  status: string;
  show_home: boolean;
  show_orbit: boolean;
  orbit_ring: number;
  orbit_angle: number;
  sort_order: number;
};

export type PublicRing = {
  id: string;
  size: number;
  duration: number;
  reverse: boolean;
  dashed: boolean;
  dot_angle?: number | null;
  dot_tone: string;
};

type AdminTool = (typeof adminTools)[number];
type AdminOrbitRing = (typeof adminOrbitRings)[number];

const staticTools: PublicTool[] = adminTools.map(
  (tool: AdminTool, index: number) => ({
    id: String(tool.id),
    slug: String(tool.slug),
    code: String(tool.code || "TOOL"),
    route: String(tool.href || `/tools/${tool.slug}`),
    title_vi: String(tool.title?.vi || tool.slug),
    title_en: String(tool.title?.en || tool.title?.vi || tool.slug),
    description_vi: String(tool.description?.vi || ""),
    description_en: String(tool.description?.en || tool.description?.vi || ""),
    icon: tool.icon || null,
    accent: String(tool.accent || "#2563eb"),
    status: String(tool.status || "ready"),
    show_home: tool.showHome !== false,
    show_orbit: tool.showOrbit !== false,
    orbit_ring: Number(tool.orbitRing || 1),
    orbit_angle: Number(tool.orbitAngle || 0),
    sort_order: Number(index),
  }),
);

const staticRings: PublicRing[] = adminOrbitRings.map((ring: AdminOrbitRing) => ({
  id: String(ring.id),
  size: Number(ring.size || 100),
  duration: Number(ring.duration || 30),
  reverse: Boolean(ring.reverse),
  dashed: Boolean(ring.dashed),
  dot_angle:
    ring.dotAngle === null || ring.dotAngle === undefined ? null : Number(ring.dotAngle),
  dot_tone: String(ring.dotTone || "blue"),
}));

// Site dùng Next static export. Dữ liệu public đã được sync ở prebuild nên không gọi
// /api/public/tools (route này không tồn tại trong static export). Kết quả này cũng
// giúp HTML đầu tiên có đủ tool cho crawler.
export function usePublicTools() {
  return { tools: staticTools, rings: staticRings };
}
