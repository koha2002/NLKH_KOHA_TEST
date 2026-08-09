"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import styles from "./data.module.css";

type Collection = { id: string; name_vi: string; name_en: string; description_vi?: string; description_en?: string; icon?: string };
type DataItem = {
  id: string;
  collection_id?: string;
  title_vi: string;
  title_en: string;
  description_vi?: string;
  description_en?: string;
  item_type: "link" | "r2_file" | "quiz_json" | "document" | "video";
  access_url?: string;
  visibility: "public" | "authenticated" | "private";
};

const typeLabels: Record<DataItem["item_type"], string> = {
  link: "LINK",
  r2_file: "R2 FILE",
  quiz_json: "QUIZ JSON",
  document: "DOCUMENT",
  video: "VIDEO",
};

export default function DataPage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<DataItem[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/public/data", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setCollections(payload.collections ?? []);
        setItems(payload.items ?? []);
        setAuthenticated(Boolean(payload.authenticated));
      })
      .catch(() => setError(vi ? "Không thể tải dữ liệu lúc này." : "Could not load data right now."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [vi]);

  const grouped = useMemo(() => {
    const known = collections.map((collection) => ({ collection, items: items.filter((item) => item.collection_id === collection.id) }));
    const ungrouped = items.filter((item) => !item.collection_id || !collections.some((collection) => collection.id === item.collection_id));
    if (ungrouped.length) known.push({ collection: { id: "ungrouped", name_vi: "Khác", name_en: "Other" }, items: ungrouped });
    return known.filter((group) => group.items.length);
  }, [collections, items]);

  return (
    <main>
      <section className={styles.hero}><div className="container"><p>DATA / ACCOUNT ACCESS</p><h1>{vi ? "Dữ liệu và tài liệu được cấp." : "Assigned data and documents."}</h1><span>{vi ? "Mục công khai hiện ngay; mục riêng chỉ xuất hiện khi tài khoản của bạn được cấp quyền." : "Public items appear immediately; private items are shown only when assigned to your account."}</span></div></section>
      <section className={`container ${styles.workspace}`}>
        <div className={styles.toolbar}>
          <div><span>{items.length}</span><p>{vi ? "mục đang hiển thị" : "visible items"}</p></div>
          <div className={styles.user}>{authenticated ? <><span>{vi ? "Đã đăng nhập" : "Signed in"}</span><a href="/account">{vi ? "Tài khoản" : "Account"}</a></> : <a href="/login?next=/data">{vi ? "Đăng nhập / Đăng ký" : "Sign in / Register"}</a>}</div>
        </div>
        {loading ? <p className={styles.empty}>{vi ? "Đang tải dữ liệu…" : "Loading data…"}</p> : null}
        {error ? <p className={styles.empty} role="alert">{error}</p> : null}
        {!loading && !error && grouped.length ? grouped.map(({ collection, items: groupItems }) => (
          <section className={styles.group} key={collection.id}>
            <header><div className={styles.groupIcon}>{collection.icon || "DATA"}</div><div><h2>{vi ? collection.name_vi : collection.name_en || collection.name_vi}</h2>{(vi ? collection.description_vi : collection.description_en) ? <p>{vi ? collection.description_vi : collection.description_en}</p> : null}</div></header>
            <div className={styles.grid}>
              {groupItems.map((item) => <a href={item.access_url || "#"} target={item.access_url?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={styles.resource} key={item.id} aria-disabled={!item.access_url}>
                <div><span>{typeLabels[item.item_type]}</span><i>{item.visibility === "private" ? (vi ? "Được cấp" : "Assigned") : item.visibility === "authenticated" ? (vi ? "Tài khoản" : "Account") : (vi ? "Công khai" : "Public")}</i></div>
                <h3>{vi ? item.title_vi : item.title_en || item.title_vi}</h3>
                <p>{vi ? item.description_vi : item.description_en || item.description_vi}</p>
                <strong>{item.item_type === "quiz_json" ? (vi ? "Tải JSON" : "Download JSON") : (vi ? "Mở mục" : "Open item")} <span>↗</span></strong>
              </a>)}
            </div>
          </section>
        )) : null}
        {!loading && !error && !grouped.length ? <div className={styles.empty}><p>{authenticated ? (vi ? "Tài khoản này chưa được cấp dữ liệu." : "No data has been assigned to this account.") : (vi ? "Chưa có dữ liệu công khai. Đăng nhập để kiểm tra dữ liệu được cấp." : "No public data yet. Sign in to check assigned data.")}</p>{!authenticated ? <a href="/login?next=/data">{vi ? "Đăng nhập" : "Sign in"} →</a> : null}</div> : null}
      </section>
    </main>
  );
}
