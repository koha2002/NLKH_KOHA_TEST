"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { usePublicShell } from "./PublicShellProvider";
import styles from "./Footer.module.css";

export function Footer() {
  const { t, language } = useLanguage();
  const { site, menu, socials } = usePublicShell();
  const footerMenu = menu.filter((item) => item.location === "footer" || item.location === "both");
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <Link className={styles.wordmark} href="/">NLKH<span>.</span></Link>
          <p>{String(language === "vi" ? site.footer_intro_vi || t.footer.intro : site.footer_intro_en || t.footer.intro)}</p>
        </div>
        <div>
          <h2>{t.footer.explore}</h2>
          {footerMenu.map((item) => <Link key={item.id} href={item.href} target={item.open_new_tab ? "_blank" : undefined}>{language === "vi" ? item.label_vi : item.label_en}</Link>)}
        </div>
        <div>
          <h2>{t.footer.connect}</h2>
          {socials.map((social) => <a key={social.id} href={social.url} target={social.url.startsWith("http") ? "_blank" : undefined} rel={social.url.startsWith("http") ? "noreferrer" : undefined}>{social.label}{social.url.startsWith("http") ? " ↗" : ""}</a>)}
        </div>
      </div>
      <div className={`container ${styles.bottom}`}>
        <p>{String(site.copyright_text || "© 2025 Nguyễn Lê Khánh Hòa")}</p>
        <p>{t.footer.rights}</p>
      </div>
    </footer>
  );
}
