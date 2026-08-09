export type ToolItem = {
  id: string;
  href: string;
  code: string;
  title: { vi: string; en: string };
  description: { vi: string; en: string };
  status: "ready" | "online";
};

export const tools: ToolItem[] = [
  {
    id: "quiz",
    href: "/tools/quiz",
    code: "QUIZ",
    title: { vi: "Ôn thi & tạo đề", en: "Quiz & exam practice" },
    description: { vi: "Nhập, tạo, sửa và làm đề; lưu tiến độ, xuất JSON/PDF/Word và luyện lại câu sai.", en: "Create, import and practice quizzes with progress saving and JSON/PDF/Word export." },
    status: "ready",
  },
  {
    id: "pdf",
    href: "/tools/pdf",
    code: "PDF",
    title: { vi: "PDF & hình ảnh", en: "PDF & image studio" },
    description: { vi: "Đầy đủ bộ chức năng PDF/ảnh từ web cũ; có thêm chế độ gộp PDF cục bộ riêng tư.", en: "The complete PDF/image suite from the previous site, plus private local PDF merging." },
    status: "online",
  },
  {
    id: "comtrade",
    href: "/tools/comtrade",
    code: "CFG",
    title: { vi: "Đọc dữ liệu COMTRADE", en: "COMTRADE viewer" },
    description: { vi: "Đọc CFG/DAT, metadata và vẽ biểu đồ kênh tương tự, kênh số ngay trong trình duyệt.", en: "Read CFG/DAT files and plot analog and digital channels in the browser." },
    status: "ready",
  },
];
