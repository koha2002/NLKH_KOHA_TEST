import type { FeatureIconName } from "../FeatureIcon";

export type OrbitTone = "blue" | "cyan" | "orange" | "violet";

export type OrbitRing = {
  id: string;
  size: number;
  duration: number;
  reverse?: boolean;
  dashed?: boolean;
  dot?: { angle: number; tone: OrbitTone };
};

export type OrbitItem = {
  id: string;
  href: string;
  label: string;
  icon?: FeatureIconName;
  image?: string;
  ring: string;
  angle: number;
  tone: OrbitTone;
  title: { vi: string; en: string };
};

/*
 * CHỈNH VÒNG QUỸ ĐẠO TẠI ĐÂY
 *
 * orbitRings: thêm/bớt đường tròn. size là đường kính theo %, duration là số giây/vòng.
 * orbitItems: thêm/bớt nút chức năng. ring phải trùng id của một đường tròn phía dưới.
 * angle nhận giá trị từ 0 đến 359 để đổi vị trí ban đầu của nút.
 * icon: profile | quiz | pdf | comtrade | software | data
 * Hoặc bỏ icon và dùng image: "/feature-icons/ten-logo.png" để dùng logo riêng.
 * tone: blue | cyan | orange | violet
 */
export const orbitRings: OrbitRing[] = [
  { id: "ring-1", size: 98, duration: 42, dashed: true, dot: { angle: 166, tone: "blue" } },
  { id: "ring-2", size: 82, duration: 34, reverse: true, dot: { angle: 22, tone: "orange" } },
  { id: "ring-3", size: 66, duration: 28, dot: { angle: 205, tone: "cyan" } },
  { id: "ring-4", size: 51, duration: 22, reverse: true, dashed: true, dot: { angle: 318, tone: "violet" } },
  { id: "ring-5", size: 39, duration: 17 },
];

export const orbitItems: OrbitItem[] = [
  {
    id: "quiz",
    href: "/tools/quiz",
    label: "QUIZ",
    icon: "quiz",
    ring: "ring-1",
    angle: 222,
    tone: "cyan",
    title: { vi: "Ôn thi và tạo đề", en: "Quiz and exam practice" },
  },
  {
    id: "data",
    href: "/data",
    label: "DATA",
    icon: "data",
    ring: "ring-1",
    angle: 35,
    tone: "blue",
    title: { vi: "Dữ liệu", en: "Data" },
  },
  {
    id: "pdf",
    href: "/tools/pdf",
    label: "PDF",
    icon: "pdf",
    ring: "ring-2",
    angle: 326,
    tone: "blue",
    title: { vi: "PDF Studio", en: "PDF Studio" },
  },
  {
    id: "profile",
    href: "/cv",
    label: "CV",
    icon: "profile",
    ring: "ring-2",
    angle: 142,
    tone: "orange",
    title: { vi: "Hồ sơ năng lực", en: "Professional profile" },
  },
  {
    id: "comtrade",
    href: "/tools/comtrade",
    label: "CFG",
    icon: "comtrade",
    ring: "ring-3",
    angle: 198,
    tone: "violet",
    title: { vi: "Đọc dữ liệu COMTRADE", en: "COMTRADE viewer" },
  },
  {
    id: "software",
    href: "/software",
    label: "APP",
    icon: "software",
    ring: "ring-3",
    angle: 18,
    tone: "cyan",
    title: { vi: "Kho phần mềm", en: "Software library" },
  },
];
