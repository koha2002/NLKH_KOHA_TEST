"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SitePresence } from "./SitePresence";

export type ShellMenuItem = { id: string; label_vi: string; label_en: string; href: string; location: "header" | "footer" | "both"; open_new_tab?: boolean };
export type ShellSocial = { id: string; platform: string; label: string; url: string; icon?: string | null };
type ShellState = {
  site: Record<string, unknown>;
  menu: ShellMenuItem[];
  socials: ShellSocial[];
  blocks: Array<{ page_key: string; block_key: string; content: Record<string, unknown> }>;
  account: { authenticated: boolean; role: string };
};

const fallback: ShellState = {
  site: { site_name: "Nguyễn Lê Khánh Hòa", footer_intro_vi: "Kỹ sư điện, người xây dựng các công cụ số phục vụ công việc và học tập.", footer_intro_en: "Electrical engineer building practical digital tools.", copyright_text: "© 2025 Nguyễn Lê Khánh Hòa", registration_enabled: true },
  menu: [
    { id:"/",label_vi:"Trang chủ",label_en:"Home",href:"/",location:"both" },
    { id:"/cv",label_vi:"Hồ sơ",label_en:"Profile",href:"/cv",location:"both" },
    { id:"/tools",label_vi:"Công cụ",label_en:"Tools",href:"/tools",location:"both" },
    { id:"/software",label_vi:"Phần mềm",label_en:"Software",href:"/software",location:"both" },
    { id:"/data",label_vi:"Dữ liệu",label_en:"Data",href:"/data",location:"both" },
    { id:"/news",label_vi:"Tin tức",label_en:"News",href:"/news",location:"both" },
  ], socials: [], blocks: [], account: { authenticated:false, role:"guest" },
};

const ShellContext = createContext<ShellState>(fallback);

export function PublicShellProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/shell", { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Partial<ShellState>> : Promise.reject()).then((data) => setValue({ ...fallback, ...data })).catch(() => undefined);
    return () => controller.abort();
  }, []);
  const stable = useMemo(() => value, [value]);
  return <><SitePresence/><ShellContext.Provider value={stable}>{children}</ShellContext.Provider></>;
}

export function usePublicShell() { return useContext(ShellContext); }
