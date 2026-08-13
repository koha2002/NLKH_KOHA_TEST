"use client";

import { useLanguage } from "./LanguageProvider";
import { NewsComments } from "./NewsComments";
import { SafeMarkdown } from "./SafeMarkdown";
import styles from "../app/news/[slug]/article.module.css";

export function NewsArticleClient({ article }: { article: any }) {
  const { language } = useLanguage();
  const vi = language === "vi";

  const title =
    vi ? article.title_vi : (article.title_en || article.title_vi);

  const subtitle =
    vi ? article.subtitle_vi : (article.subtitle_en || article.subtitle_vi);

  const content =
    vi ? article.content_vi : (article.content_en || article.content_vi);

  const coverAlt =
    vi
      ? (article.cover_alt_vi || title || "")
      : (article.cover_alt_en || article.cover_alt_vi || title || "");

  const published = article.published_at
    ? new Intl.DateTimeFormat(vi ? "vi-VN" : "en-US", {
        dateStyle: "long",
      }).format(new Date(article.published_at))
    : "";

  return (
    <main className={styles.v5Article}>
      <header className={styles.v5Header}>
        <a href="/news" className={styles.v5Back}>
          ← {vi ? "Tin tức" : "News"}
        </a>

        <p className={styles.v5Kicker}>NEWS / ARTICLE</p>

        <h1>{title}</h1>

        {subtitle ? (
          <p className={styles.lead}>{subtitle}</p>
        ) : null}

        <div className={styles.v5Byline}>
          <span>
            {vi ? "Tác giả" : "Author"}:{" "}
            <strong>{article.author_name || "NLKH Technology"}</strong>
          </span>

          {article.editor_name ? (
            <span>
              {vi ? "Biên tập" : "Editor"}: {article.editor_name}
            </span>
          ) : null}

          {published ? <time>{published}</time> : null}
        </div>
      </header>

      {article.cover_image ? (
        <figure className={styles.v5Cover}>
          <img src={article.cover_image} alt={coverAlt} />
        </figure>
      ) : null}

      <div className={styles.v5Grid}>
        <article className={styles.prose}>
          <SafeMarkdown content={content || ""} />
        </article>

        <aside className={styles.v5Aside}>
          {article.tags?.length ? (
            <section className={styles.v5MetaCard}>
              <span className={styles.v5MetaLabel}>TAGS</span>
              <div className={styles.v5Tags}>
                {article.tags.map((tag: string) => (
                  <i key={tag}>{tag}</i>
                ))}
              </div>
            </section>
          ) : null}

          {article.source_url ? (
            <section className={styles.v5SourceCard}>
              <span className={styles.v5MetaLabel}>
                {vi ? "NGUỒN THAM KHẢO" : "SOURCE"}
              </span>
              <a
                href={article.source_url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <strong>{article.source_name || (vi ? "Bài nguồn" : "Original source")}</strong>
                <small>{vi ? "Mở bài gốc ↗" : "Open original ↗"}</small>
              </a>
            </section>
          ) : null}
        </aside>
      </div>

      <div className={styles.v5Comments}>
        <NewsComments
          articleId={String(article.id)}
          allow={!!article.allow_comments}
        />
      </div>
    </main>
  );
}