"use client";

import { useLanguage } from "../../components/LanguageProvider";
import { tools } from "../../data/tools";
import { usePublicTools } from "../../components/usePublicTools";
import styles from "./tools.module.css";

export default function ToolsPage() {
  const { language } = useLanguage();
  const remote = usePublicTools();
  const vi = language === "vi";
  const visibleTools = remote.tools === null ? tools : remote.tools.map((tool) => ({ id:tool.slug,href:tool.route,code:tool.code,title:{vi:tool.title_vi,en:tool.title_en},description:{vi:tool.description_vi,en:tool.description_en},status:tool.status }));

  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <p>TOOLS / {String(visibleTools.length).padStart(2, "0")}</p>
          <h1>{vi ? "Bộ công cụ tôi dùng hằng ngày." : "Tools I use every day."}</h1>
        </div>
      </section>
      <section className={`container ${styles.grid}`}>
        {/* Ghi chú phát triển: thêm công cụ mới trong data/tools.ts; trang sẽ tự tạo thẻ và vẫn dùng layout chung. */}
        {visibleTools.map((tool, index) => (
          <a href={tool.href} className={styles.card} key={tool.id}>
            <div className={styles.cardTop}><span>{String(index + 1).padStart(2, "0")}</span><strong>{tool.code}</strong></div>
            <div><h2>{tool.title[language]}</h2><p>{tool.description[language]}</p></div>
            <span className={styles.open}>{vi ? "Mở công cụ" : "Open tool"}<i>↗</i></span>
          </a>
        ))}
      </section>
    </main>
  );
}
