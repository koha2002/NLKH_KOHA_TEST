"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { adminNavigation, adminSite, adminSocial } from "../data/admin-generated";
import styles from "./Footer.module.css";

export function Footer() {
  const { language, t } = useLanguage();
  const site:any=adminSite;
  const links = adminNavigation.filter((x) => x.visible && ["footer","both"].includes(String(x.location || "both")) && !x.requires_auth);
  const label = (x: any) => language === "en" ? (x.label_en || x.label_vi) : x.label_vi;
  const intro = language === "en" ? (site.footer_intro_en || site.footer_intro_vi) : site.footer_intro_vi;
  const year = new Date().getFullYear();
  const copyright = String(site.copyright_text || `© ${year} Nguyễn Lê Khánh Hòa`).replace(/©\s*\d{4}/, `© ${year}`);
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <Link className={styles.wordmark} href="/">KOHA<span>.</span></Link>
          <p>{intro || t.footer.intro}</p>
        </div>
        <div>
          <h2>{t.footer.explore}</h2>
          {links.map((x:any) => <Link className={styles.linkWithIcon} key={String(x.id)} href={x.href}>{x.icon_url?<img src={x.icon_url} alt=""/>:null}{label(x)}</Link>)}
        </div>
        <div>
          <h2>{t.footer.connect}</h2>
          {site.contact_email ? <a href={`mailto:${site.contact_email}`}>Email</a> : null}
          {adminSocial.map((x:any) => <a className={styles.linkWithIcon} key={String(x.id)} href={x.url} target="_blank" rel="noreferrer">{x.icon?<img src={x.icon} alt=""/>:null}{x.label} ↗</a>)}
        </div>
      </div>
      <div className={`container ${styles.bottom}`}>
        <p suppressHydrationWarning>{copyright}</p>
        <p>{t.footer.rights}</p>
      </div>
    </footer>
  );
}
