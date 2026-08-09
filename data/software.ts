export type SoftwareCategory = "engineering" | "office" | "utility" | "media";

export type SoftwareItem = {
  name: string;
  mark: string;
  color: string;
  category: SoftwareCategory;
  href: string;
  description: { vi: string; en: string };
  license: { vi: string; en: string };
};

export const software: SoftwareItem[] = [
  {
    name: "AutoCAD",
    mark: "A",
    color: "#e84b3c",
    category: "engineering",
    href: "https://www.autodesk.com/products/autocad/overview",
    description: { vi: "Thiết kế và triển khai bản vẽ kỹ thuật 2D, 3D.", en: "2D and 3D drafting for technical design workflows." },
    license: { vi: "Thương mại", en: "Commercial" },
  },
  {
    name: "EPLAN",
    mark: "E",
    color: "#ee282f",
    category: "engineering",
    href: "https://www.eplan-software.com/",
    description: { vi: "Thiết kế điện, tự động hóa và quản lý dữ liệu kỹ thuật.", en: "Electrical design, automation and engineering data management." },
    license: { vi: "Thương mại", en: "Commercial" },
  },
  {
    name: "MATLAB",
    mark: "M",
    color: "#e36b24",
    category: "engineering",
    href: "https://www.mathworks.com/products/matlab.html",
    description: { vi: "Tính toán, mô phỏng, xử lý dữ liệu và phát triển thuật toán.", en: "Numerical computing, simulation, data analysis and algorithms." },
    license: { vi: "Thương mại", en: "Commercial" },
  },
  {
    name: "Microsoft 365",
    mark: "M",
    color: "#e85a2a",
    category: "office",
    href: "https://www.microsoft.com/microsoft-365",
    description: { vi: "Word, Excel, PowerPoint và bộ công cụ làm việc văn phòng.", en: "Word, Excel, PowerPoint and productivity applications." },
    license: { vi: "Thuê bao", en: "Subscription" },
  },
  {
    name: "Microsoft Visio",
    mark: "V",
    color: "#3955a3",
    category: "office",
    href: "https://www.microsoft.com/microsoft-365/visio/flowchart-software",
    description: { vi: "Vẽ sơ đồ quy trình, sơ đồ khối và tài liệu trực quan.", en: "Flowcharts, block diagrams and visual documentation." },
    license: { vi: "Thương mại", en: "Commercial" },
  },
  {
    name: "Microsoft Project",
    mark: "P",
    color: "#3b7d58",
    category: "office",
    href: "https://www.microsoft.com/microsoft-365/project/project-management-software",
    description: { vi: "Lập kế hoạch, phân bổ nguồn lực và theo dõi dự án.", en: "Project scheduling, resources and progress tracking." },
    license: { vi: "Thương mại", en: "Commercial" },
  },
  {
    name: "Everything",
    mark: "E",
    color: "#efb32d",
    category: "utility",
    href: "https://www.voidtools.com/",
    description: { vi: "Tìm kiếm tệp và thư mục trên Windows gần như tức thì.", en: "Near-instant file and folder search for Windows." },
    license: { vi: "Miễn phí", en: "Free" },
  },
  {
    name: "7-Zip",
    mark: "7Z",
    color: "#20242b",
    category: "utility",
    href: "https://www.7-zip.org/",
    description: { vi: "Nén và giải nén tệp mã nguồn mở, gọn nhẹ.", en: "Lightweight open-source file compression and extraction." },
    license: { vi: "Mã nguồn mở", en: "Open source" },
  },
  {
    name: "TrafficMonitor",
    mark: "TM",
    color: "#2786d5",
    category: "utility",
    href: "https://github.com/zhongyang219/TrafficMonitor",
    description: { vi: "Theo dõi tốc độ mạng, CPU và bộ nhớ trên thanh tác vụ.", en: "Network speed, CPU and memory monitoring in the taskbar." },
    license: { vi: "Mã nguồn mở", en: "Open source" },
  },
  {
    name: "EVKey",
    mark: "EV",
    color: "#168ebc",
    category: "utility",
    href: "https://evkeyvn.com/",
    description: { vi: "Bộ gõ tiếng Việt nhỏ gọn cho Windows và macOS.", en: "A compact Vietnamese input method for Windows and macOS." },
    license: { vi: "Miễn phí", en: "Free" },
  },
  {
    name: "VLC Media Player",
    mark: "VLC",
    color: "#f58a1f",
    category: "media",
    href: "https://www.videolan.org/vlc/",
    description: { vi: "Trình phát đa phương tiện miễn phí, hỗ trợ nhiều định dạng.", en: "A free media player with broad format support." },
    license: { vi: "Mã nguồn mở", en: "Open source" },
  },
  {
    name: "FastStone Capture",
    mark: "FS",
    color: "#2d6ab1",
    category: "media",
    href: "https://www.faststone.org/FSCaptureDetail.htm",
    description: { vi: "Chụp, ghi màn hình và chỉnh sửa ảnh nhanh.", en: "Screen capture, recording and quick image editing." },
    license: { vi: "Thương mại", en: "Commercial" },
  },
];
