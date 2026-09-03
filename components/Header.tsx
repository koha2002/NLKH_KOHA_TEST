"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { adminNavigation } from "../data/admin-generated";
import type { MyAccess } from "../lib/supabase-browser";
import styles from "./Header.module.css";

type NavRow = {
  id: string;
  label_vi: string;
  label_en?: string | null;
  href: string;
  location?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  visible: boolean;
  requires_auth: boolean;
  allowed_roles?: readonly string[];
  open_new_tab?: boolean;
  icon_url?: string | null;
};

function hasPersistedSupabaseSession() {
  if (typeof window === "undefined") return false;

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !/^sb-[a-z0-9-]+-auth-token$/i.test(key)) continue;

      const raw = window.localStorage.getItem(key);
      if (raw && raw !== "null" && raw !== "{}") return true;
    }
  } catch {
    return false;
  }

  return false;
}

function accessInitials(name?: string, email?: string) {
  const source = (name || email?.split("@")[0] || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export function Header() {
  const { language, setLanguage, theme, toggleTheme, t } = useLanguage();
  const vi = language === "vi";
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [access, setAccess] = useState<MyAccess>({ authenticated: false, permissions: [] });

  useEffect(() => {
    let alive = true;

    if (!hasPersistedSupabaseSession()) {
      return () => {
        alive = false;
      };
    }

    void import("../lib/supabase-browser")
      .then(({ getMyAccess }) => getMyAccess())
      .then((nextAccess) => {
        if (alive) setAccess(nextAccess);
      })
      .catch(() => {
        if (alive) setAccess({ authenticated: false, permissions: [] });
      });

    return () => {
      alive = false;
    };
  }, []);

  const allowed = useMemo(() => {
    const navigation = adminNavigation as readonly NavRow[];
    return navigation.filter((item) => {
      if (!item.visible || !["header", "both"].includes(String(item.location || "header"))) return false;
      if (!item.requires_auth) return true;
      if (!access.authenticated || access.status !== "active") return false;
      const roles = item.allowed_roles || [];
      return roles.length === 0 || (!!access.role_id && roles.includes(access.role_id));
    });
  }, [access]);

  const parents = allowed.filter((x) => !x.parent_id);
  const children = (id: string) => allowed.filter((x) => String(x.parent_id || "") === String(id));
  const label = (item: NavRow) => language === "en" ? (item.label_en || item.label_vi) : item.label_vi;

  return <header className={styles.header}>
    <div className={`container ${styles.inner}`}>
      <nav className={`${styles.nav} ${open ? styles.open : ""}`} aria-label={vi ? "Điều hướng chính" : "Main navigation"}>
        {parents.map((item) => {
          const subs = children(String(item.id));
          return <div className={styles.navGroup} key={String(item.id)}>
            <a href={item.href} target={item.open_new_tab ? "_blank" : undefined} rel={item.open_new_tab ? "noreferrer" : undefined} onClick={() => !subs.length && setOpen(false)}>
              {item.icon_url ? <img src={item.icon_url} alt="" /> : null}{label(item)}{subs.length ? <span className={styles.chevron}>⌄</span> : null}
            </a>
            {subs.length ? <div className={styles.submenu}>{subs.map((sub) => <a key={String(sub.id)} href={sub.href} target={sub.open_new_tab ? "_blank" : undefined} rel={sub.open_new_tab ? "noreferrer" : undefined} onClick={() => setOpen(false)}>{sub.icon_url ? <img src={sub.icon_url} alt="" /> : null}{label(sub)}</a>)}</div> : null}
          </div>;
        })}
        <div className={styles.mobileLanguage}>
          <button className={language === "vi" ? styles.active : ""} onClick={() => setLanguage("vi")}>VI</button>
          <button className={language === "en" ? styles.active : ""} onClick={() => setLanguage("en")}>EN</button>
          <button onClick={toggleTheme}>{theme === "light" ? `◐ ${t.nav.dark}` : `☀ ${t.nav.light}`}</button>
          <a href={access.authenticated ? "/account" : "/login"}>{access.authenticated ? (vi ? "Tài khoản" : "Account") : (vi ? "Đăng nhập" : "Sign in")}</a>
        </div>
      </nav>

      <div className={styles.actions}>
        <button className={styles.theme} onClick={toggleTheme} aria-label={theme === "light" ? t.nav.dark : t.nav.light} title={theme === "light" ? t.nav.dark : t.nav.light}><span aria-hidden="true">{theme === "light" ? "◐" : "☀"}</span></button>
        <div className={styles.language} aria-label={vi ? "Chọn ngôn ngữ" : "Choose language"}>
          <button className={language === "vi" ? styles.active : ""} onClick={() => setLanguage("vi")} aria-pressed={language === "vi"}>VI</button><span>/</span><button className={language === "en" ? styles.active : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
        </div>

        {access.authenticated ? <div className={styles.accountWrap}>
          <button className={styles.avatarButton} onClick={() => setAccountOpen((v) => !v)} aria-expanded={accountOpen} aria-label={vi ? "Tài khoản" : "Account"}>{access.avatar_url ? <img src={access.avatar_url} alt="" /> : <span>{accessInitials(access.display_name, access.email)}</span>}</button>
          {accountOpen ? <div className={styles.accountMenu}><strong>{access.display_name || access.email}</strong><small>{access.email}</small><a href="/account">{vi ? "Tài khoản & ảnh đại diện" : "Account & profile picture"}</a>{access.status === "active" && (access.permissions || []).length ? <><a href={process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.nguyenlekhanhhoa.com"}>{vi ? "Quản trị" : "Admin"} ↗</a><a href="https://automation.nguyenlekhanhhoa.com">Automation {"\u2197"}</a></> : null}</div> : null}
        </div> : <a className={styles.loginButton} href="/login">{vi ? "Đăng nhập" : "Sign in"}</a>}

        <button className={styles.menu} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? t.nav.close : t.nav.menu}><span /><span /></button>
      </div>
    </div>
  </header>;
}
