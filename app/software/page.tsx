"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import styles from "./software.module.css";

type SoftwareCategory = { id: string; slug: string; name_vi: string; name_en: string };
type SoftwareItem = { id: string; name: string; icon_url?: string; download_url: string; description_vi: string; description_en: string; price_label_vi: string; price_label_en: string; category_id?: string };

export default function SoftwarePage() {
  const { language, t } = useLanguage();
  const copy = t.software;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [categoryRows, setCategoryRows] = useState<SoftwareCategory[]>([]);

  useEffect(() => {
    fetch("/api/public/software")
      .then((response) => response.json())
      .then((payload: { categories?: SoftwareCategory[]; items?: SoftwareItem[] }) => { setSoftware(payload.items ?? []); setCategoryRows(payload.categories ?? []); })
      .catch(() => setSoftware([]));
  }, []);

  const categories = [{ id: "all", label: copy.all }, ...categoryRows.map((item) => ({ id: item.id, label: language === "vi" ? item.name_vi : item.name_en || item.name_vi }))];

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language);
    return software.filter((item) => {
      const inCategory = category === "all" || item.category_id === category;
      const haystack = `${item.name} ${language === "vi" ? item.description_vi : item.description_en}`.toLocaleLowerCase(language);
      return inCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, language, query, software]);

  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <div className={styles.searchWrap}>
            <span aria-hidden="true">⌕</span>
            <label className="sr-only" htmlFor="software-search">{copy.search}</label>
            <input id="software-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
            <kbd>{visible.length} {copy.found}</kbd>
          </div>
        </div>
      </section>

      <section className={`container ${styles.catalog}`}>
        <div className={styles.filters} aria-label="Lọc phần mềm">
          {categories.map((item) => (
            <button key={item.id} className={category === item.id ? styles.active : ""} onClick={() => setCategory(item.id)} aria-pressed={category === item.id}>{item.label}</button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className={styles.noResult}>{copy.noResult}</div>
        ) : (
          <div className={styles.grid} aria-live="polite">
            {visible.map((item) => (
              <article className={styles.card} key={item.name}>
                <div className={styles.cardTop}>
                  <span className={styles.mark}>{item.icon_url ? <img src={item.icon_url} alt="" loading="lazy" /> : <b>APP</b>}</span>
                  <span className={styles.category}>{categories.find((row) => row.id === item.category_id)?.label ?? "APP"}</span>
                </div>
                <div>
                  <h2>{item.name}</h2>
                  <p>{language === "vi" ? item.description_vi : item.description_en || item.description_vi}</p>
                </div>
                <div className={styles.cardFooter}>
                  <span>{language === "vi" ? item.price_label_vi : item.price_label_en}</span>
                  <a href={item.download_url} target="_blank" rel="noreferrer">{copy.official}<i>↗</i></a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.policy}>
        <div className={`container ${styles.policyInner}`}>
          <span>!</span>
          <div><h2>{copy.noteTitle}</h2><p>{copy.note}</p></div>
        </div>
      </section>
    </main>
  );
}
