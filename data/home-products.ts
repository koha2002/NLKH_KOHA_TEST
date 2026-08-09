import type { FeatureIconName } from "../components/FeatureIcon";

export type HomeProduct = {
  href: string;
  label: string;
  icon?: FeatureIconName;
  image?: string;
  color: "orange" | "cyan" | "blue";
  title: { vi: string; en: string };
  description: { vi: string; en: string };
};

/* Danh sách thẻ chức năng ở Trang chủ. Thêm/bớt thẻ chỉ cần sửa mảng này. */
export const homeProducts: HomeProduct[] = [
  {
    href: "/cv",
    label: "CV",
    icon: "profile",
    color: "orange",
    title: { vi: "Hồ sơ năng lực", en: "Professional profile" },
    description: { vi: "Học vấn, chứng chỉ, kinh nghiệm và kỹ năng chuyên môn.", en: "Education, certificates, experience and professional skills." },
  },
  {
    href: "/tools/quiz",
    label: "QUIZ",
    icon: "quiz",
    color: "cyan",
    title: { vi: "Ôn thi & tạo đề", en: "Quiz practice" },
    description: { vi: "Tạo, nhập, chỉnh sửa và luyện đề; lưu tiến độ trực tiếp trên trình duyệt.", en: "Create, import, edit and practice quizzes with browser-saved progress." },
  },
  {
    href: "/tools/pdf",
    label: "PDF",
    icon: "pdf",
    color: "blue",
    title: { vi: "PDF Studio", en: "PDF Studio" },
    description: { vi: "Bộ công cụ PDF/ảnh đầy đủ và chế độ gộp PDF cục bộ riêng tư.", en: "A complete PDF/image suite with private local PDF merging." },
  },
  {
    href: "/tools/comtrade",
    label: "CFG",
    icon: "comtrade",
    color: "orange",
    title: { vi: "COMTRADE", en: "COMTRADE" },
    description: { vi: "Đọc CFG/DAT và biểu diễn các kênh analog, digital.", en: "Read CFG/DAT records and plot analog and digital channels." },
  },
  {
    href: "/software",
    label: "APP",
    icon: "software",
    color: "cyan",
    title: { vi: "Kho phần mềm", en: "Software library" },
    description: { vi: "Kho phần mềm có tìm kiếm, phân loại, logo và liên kết tải.", en: "A searchable software library with categories, logos and download links." },
  },
  {
    href: "/data",
    label: "DATA",
    icon: "data",
    color: "blue",
    title: { vi: "Dữ liệu", en: "Data" },
    description: { vi: "Tài liệu và liên kết được cấp riêng theo từng tài khoản.", en: "Documents and links assigned to each account." },
  },
];
