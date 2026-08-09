"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { usePublicShell } from "./PublicShellProvider";
import styles from "./Header.module.css";

export function Header() {
  const { language, setLanguage, theme, toggleTheme, t } = useLanguage();
  const { menu, account } = usePublicShell();
  const [open, setOpen] = useState(false);
  const links = menu.filter((item) => item.location === "header" || item.location === "both");

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <nav className={`${styles.nav} ${open ? styles.open : ""}`} aria-label="Điều hướng chính">
          {links.map((link) => (
            <a key={link.id} href={link.href} target={link.open_new_tab ? "_blank" : undefined} rel={link.open_new_tab ? "noreferrer" : undefined} onClick={() => setOpen(false)}>{language === "vi" ? link.label_vi : link.label_en}</a>
          ))}
          <a href={account.authenticated ? "/account" : "/login"} onClick={() => setOpen(false)}>{account.authenticated ? (language === "vi" ? "Tài khoản" : "Account") : (language === "vi" ? "Đăng nhập" : "Sign in")}</a>
          <div className={styles.mobileLanguage}>
            <button className={language === "vi" ? styles.active : ""} onClick={() => setLanguage("vi")}>VI</button>
            <button className={language === "en" ? styles.active : ""} onClick={() => setLanguage("en")}>EN</button>
            <button onClick={toggleTheme}>{theme === "light" ? `◐ ${t.nav.dark}` : `☀ ${t.nav.light}`}</button>
          </div>
        </nav>

        <div className={styles.actions}>
          <button className={styles.theme} onClick={toggleTheme} aria-label={theme === "light" ? t.nav.dark : t.nav.light} title={theme === "light" ? t.nav.dark : t.nav.light}>
            <span aria-hidden="true">{theme === "light" ? "◐" : "☀"}</span>
          </button>
          <div className={styles.language} aria-label="Chọn ngôn ngữ">
            <button className={language === "vi" ? styles.active : ""} onClick={() => setLanguage("vi")} aria-pressed={language === "vi"}>VI</button>
            <span>/</span>
            <button className={language === "en" ? styles.active : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
          </div>
          <button
            className={styles.menu}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? t.nav.close : t.nav.menu}
          >
            <span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
