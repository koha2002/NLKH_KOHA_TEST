"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import styles from "../app/news/news.module.css";

const PAGE_SIZE = 6;

type NewsCategory = {
  id: string | number;
  slug?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  visible?: boolean | null;
  sort_order?: number | string | null;
};

type NewsArticle = {
  id?: string | number | null;
  slug: string;
  category_id?: string | number | null;
  title_vi?: string | null;
  title_en?: string | null;
  excerpt_vi?: string | null;
  excerpt_en?: string | null;
  tags?: string[] | null;
  cover_image?: string | null;
  cover_alt_vi?: string | null;
  cover_alt_en?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type NewsPageClientProps = {
  articles: NewsArticle[];
  categories: NewsCategory[];
};

function timeOf(article: NewsArticle) {
  const value =
    article.published_at || article.created_at || article.updated_at || "";
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function NewsPageClient({
  articles,
  categories,
}: NewsPageClientProps) {
  const { language } = useLanguage();
  const vi = language === "vi";

  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const visibleCategories = useMemo(
    () =>
      [...(categories || [])]
        .filter((item) => item?.visible !== false)
        .sort(
          (a, b) =>
            Number(a.sort_order || 0) - Number(b.sort_order || 0),
        ),
    [categories],
  );

  const categoryById = useMemo(
    () =>
      new Map<string, NewsCategory>(
        visibleCategories.map((item) => [String(item.id), item]),
      ),
    [visibleCategories],
  );

  const rows = useMemo(() => {
    const q = query
      .trim()
      .toLocaleLowerCase(vi ? "vi-VN" : "en-US");

    return [...(articles || [])]
      .sort((a, b) => timeOf(b) - timeOf(a))
      .filter((article) => {
        if (
          category !== "all" &&
          String(article.category_id || "") !== category
        ) {
          return false;
        }

        if (!q) return true;

        const haystack = [
          article.title_vi,
          article.title_en,
          article.excerpt_vi,
          article.excerpt_en,
          ...(Array.isArray(article.tags) ? article.tags : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(vi ? "vi-VN" : "en-US");

        return haystack.includes(q);
      });
  }, [articles, category, query, vi]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const chooseCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <>
      <section className={styles.v53Hero}>
        <div className={styles.v53Shell}>
          <p>NEWS / ARTICLES</p>
          <h1>{vi ? "Tin tức & ghi chú." : "News & notes."}</h1>
          <span>
            {vi
              ? "Bài mới nhất được xếp trước. Lọc theo danh mục hoặc tìm nhanh theo từ khóa."
              : "Newest articles appear first. Filter by category or search by keyword."}
          </span>
        </div>
      </section>

      <section className={styles.v53Tools}>
        <div className={styles.v53Shell}>
          <div
            className={styles.v53Categories}
            role="group"
            aria-label={vi ? "Danh mục tin" : "News categories"}
          >
            <button
              type="button"
              className={category === "all" ? styles.v53Active : ""}
              onClick={() => chooseCategory("all")}
            >
              {vi ? "Tất cả" : "All"}
            </button>

            {visibleCategories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={
                  category === String(cat.id) ? styles.v53Active : ""
                }
                onClick={() => chooseCategory(String(cat.id))}
              >
                {vi
                  ? cat.name_vi || cat.slug
                  : cat.name_en || cat.name_vi || cat.slug}
              </button>
            ))}
          </div>

          <label className={styles.v53Search}>
            <span className="sr-only">
              {vi ? "Tìm bài viết" : "Search articles"}
            </span>
            <input
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder={
                vi
                  ? "Tìm tiêu đề, nội dung, tag…"
                  : "Search title, summary, tags…"
              }
            />
          </label>
        </div>
      </section>

      <section className={styles.v53List}>
        <div className={styles.v53Shell}>
          <div className={styles.v53Count}>
            {vi
              ? `${rows.length} bài viết · trang ${currentPage}/${totalPages}`
              : `${rows.length} article${rows.length === 1 ? "" : "s"} · page ${currentPage}/${totalPages}`}
          </div>

          {rows.length ? (
            <div className={styles.v53Grid}>
              {pageRows.map((article) => {
                const cat = categoryById.get(
                  String(article.category_id || ""),
                );
                const date =
                  article.published_at || article.created_at || "";

                return (
                  <article
                    className={styles.v53Card}
                    key={article.id || article.slug}
                  >
                    <a
                      href={`/news/${article.slug}`}
                      className={styles.v53Cover}
                    >
                      {article.cover_image ? (
                        // Dynamic CMS/R2 image URLs intentionally use <img>.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.cover_image}
                          alt={
                            vi
                              ? article.cover_alt_vi ||
                                article.title_vi ||
                                ""
                              : article.cover_alt_en ||
                                article.cover_alt_vi ||
                                article.title_en ||
                                article.title_vi ||
                                ""
                          }
                          loading="lazy"
                        />
                      ) : (
                        <span>NLKH / NEWS</span>
                      )}
                    </a>

                    <div className={styles.v53CardBody}>
                      <div className={styles.v53Meta}>
                        <span>
                          {cat
                            ? vi
                              ? cat.name_vi || cat.slug
                              : cat.name_en ||
                                cat.name_vi ||
                                cat.slug
                            : "NEWS"}
                        </span>

                        {date ? (
                          <time>
                            {new Intl.DateTimeFormat(
                              vi ? "vi-VN" : "en-US",
                              {
                                dateStyle: "medium",
                                timeZone: "UTC",
                              },
                            ).format(new Date(date))}
                          </time>
                        ) : null}
                      </div>

                      <h2>
                        <a href={`/news/${article.slug}`}>
                          {vi
                            ? article.title_vi
                            : article.title_en || article.title_vi}
                        </a>
                      </h2>

                      <p>
                        {vi
                          ? article.excerpt_vi
                          : article.excerpt_en || article.excerpt_vi}
                      </p>

                      <a
                        className={styles.v53Read}
                        href={`/news/${article.slug}`}
                      >
                        {vi ? "Đọc bài" : "Read article"} <span>↗</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className={styles.v53Empty}>
              {vi ? "Không có bài phù hợp." : "No matching articles."}
            </p>
          )}

          {totalPages > 1 ? (
            <nav
              className={styles.v53Pagination}
              aria-label={vi ? "Phân trang tin tức" : "News pagination"}
            >
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setPage(Math.max(1, currentPage - 1))
                }
              >
                {vi ? "← Trước" : "← Previous"}
              </button>

              <div>
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((number) => (
                  <button
                    key={number}
                    className={
                      number === currentPage
                        ? styles.v53PageActive
                        : ""
                    }
                    onClick={() => setPage(number)}
                    aria-current={
                      number === currentPage ? "page" : undefined
                    }
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage(Math.min(totalPages, currentPage + 1))
                }
              >
                {vi ? "Sau →" : "Next →"}
              </button>
            </nav>
          ) : null}
        </div>
      </section>
    </>
  );
}
