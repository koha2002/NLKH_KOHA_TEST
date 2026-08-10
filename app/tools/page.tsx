"use client";

import { useLanguage } from "../../components/LanguageProvider";
import { tools } from "../../data/tools";
import styles from "./tools.module.css";

export default function ToolsPage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <p>TOOLS / {String(tools.length).padStart(2,"0")}</p>
          <h1>{vi ? "Bộ công cụ tôi dùng hằng ngày." : "Tools I use every day."}</h1>
        </div>
      </section>
      <section className={`container ${styles.grid}`}>
        {tools.map((tool, index) => (
          <a href={tool.href} className={styles.card} key={tool.id}>
            <div className={styles.cardTop}><span>{String(index + 1).padStart(2, "0")}</span><strong>{tool.code}</strong></div>
            <div><h2>{tool.title[language]}</h2><p>{tool.description[language]}</p></div>
            <span className={styles.open}>{vi ? (tool.requiresAuth ? "Mở / kiểm tra quyền" : "Mở công cụ") : (tool.requiresAuth ? "Open / check access" : "Open tool")}<i>↗</i></span>
          </a>
        ))}
      </section>
    </main>
  );
}
