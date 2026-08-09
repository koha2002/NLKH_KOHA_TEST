"use client";

import { ToolFrame } from "../../../components/ToolFrame";
import { useLanguage } from "../../../components/LanguageProvider";
import styles from "../tool-page.module.css";

export default function ComtradePage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  return <main><section className={styles.hero}><div className="container"><p>COMTRADE / CFG + DAT</p><h1>{vi ? "Đọc bản ghi sự cố ngay trên trình duyệt." : "Read disturbance records in the browser."}</h1><span>{vi ? "Chọn cặp tệp CFG/DAT để xem metadata, kênh analog và kênh trạng thái. Dữ liệu được phân tích trên thiết bị." : "Select a CFG/DAT pair to inspect metadata, analog channels and digital status channels on your device."}</span></div></section><section className={styles.fullWorkspace}><ToolFrame src="/tool-modules/comtrade/index.html" title={vi ? "Trình đọc COMTRADE" : "COMTRADE viewer"} tall flush /></section></main>;
}
