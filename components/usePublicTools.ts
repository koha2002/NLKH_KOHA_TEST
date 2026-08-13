"use client";

import { useEffect, useState } from "react";

export type PublicTool = {
  id: string; slug: string; code: string; route: string; title_vi: string; title_en: string;
  description_vi: string; description_en: string; icon?: string | null; accent: string; status: string;
  show_home: boolean; show_orbit: boolean; orbit_ring: number; orbit_angle: number; sort_order: number;
};
export type PublicRing = { id: string; size: number; duration: number; reverse: boolean; dashed: boolean; dot_angle?: number | null; dot_tone: string };

export function usePublicTools() {
  const [state, setState] = useState<{ tools: PublicTool[] | null; rings: PublicRing[] | null }>({ tools: null, rings: null });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/tools", { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ tools?: PublicTool[]; rings?: PublicRing[] }> : Promise.reject()).then((data) => setState({ tools: data.tools || [], rings: data.rings || [] })).catch(() => undefined);
    return () => controller.abort();
  }, []);
  return state;
}
