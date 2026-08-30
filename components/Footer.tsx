"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { adminNavigation, adminSite, adminSocial } from "../data/admin-generated";
import styles from "./Footer.module.css";

type NavigationItem = (typeof adminNavigation)[number];
type SocialItem = (typeof adminSocial)[number];

export function Footer() {
  const { language, t } = useLanguage();
  const site = adminSite;
  const links = adminNavigation.filter(
    (item) =>
      item.visible &&
      ["footer", "both"].includes(String(item.location || "both")) &&
      !item.requires_auth,
  );
  const label = (item: NavigationItem) =>
    language === "en" ? item.label_en || item.label_vi : item.label_vi;
  const intro =
    language === "en"
      ? site.footer_intro_en || site.footer_intro_vi
      : site.footer_intro_vi;
  const year = new Date().getFullYear();
  const copyright = String(
    site.copyright_text || `© ${year} Nguyễn Lê Khánh Hòa`,
  ).replace(/©\s*\d{4}/, `© ${year}`);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <Link className={styles.wordmark} href="/">
            KOHA<span>.</span>
          </Link>
          <p>{intro || t.footer.intro}</p>
        </div>

        <div>
          <h2>{t.footer.explore}</h2>
          {links.map((item: NavigationItem) => (
            <Link className={styles.linkWithIcon} key={String(item.id)} href={item.href}>
              {item.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon_url} alt="" />
              ) : null}
              {label(item)}
            </Link>
          ))}
        </div>

        <div>
          <h2>{t.footer.connect}</h2>
          {site.contact_email ? <a href={`mailto:${site.contact_email}`}>Email</a> : null}
          {adminSocial.map((item: SocialItem) => (
            <a
              className={styles.linkWithIcon}
              key={String(item.id)}
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              {item.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon} alt="" />
              ) : null}
              {item.label} ↗
            </a>
          ))}
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p suppressHydrationWarning>{copyright}</p>
        <p>{t.footer.rights}</p>
      </div>
    </footer>
  );
}
