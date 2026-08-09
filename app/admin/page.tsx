import Link from "next/link";
import styles from "../../components/admin/admin.module.css";

const cards = [
  ["/admin/site","Website","Tên, nội dung chung, footer và chế độ vận hành."],
  ["/admin/news","Tin tức","Soạn, duyệt, hẹn giờ và xuất bản bài viết."],
  ["/admin/tools","Công cụ","Bật/tắt, phân quyền và cấu hình riêng từng tool."],
  ["/admin/data","Dữ liệu","Nhóm, tài liệu R2/link ngoài và cấp quyền từng người."],
  ["/admin/users","Người dùng","Duyệt tài khoản, vai trò và phạm vi quản trị."],
  ["/admin/api","API & lịch chạy","Vault bí mật, proxy server và tác vụ định kỳ."],
] as const;

export default function AdminDashboard() {
  return <main className={styles.dashboard}><header className={styles.dashboardHeader}><p>CONTROL CENTER</p><h1>Quản trị NLKH.</h1><span>Frontend chỉ hiển thị; nội dung, quyền, SEO, menu và tích hợp được quản lý tại đây.</span></header><section className={styles.dashboardGrid}>{cards.map(([href,title,description]) => <Link href={href} key={href}><strong>{title}</strong><span>{description}</span><b>Quản lý →</b></Link>)}</section></main>;
}
